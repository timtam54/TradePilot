import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';
import { XeroToken } from '@/lib/types/xero';

const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';

async function refreshTokenIfNeeded(token: XeroToken, userId: string): Promise<string> {
  if (!token.access_token || !token.refresh_token) {
    throw new Error('Xero tokens not available. Please reconnect Xero.');
  }

  const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
  const now = new Date();
  const bufferMs = 5 * 60 * 1000;

  if (expiresAt && expiresAt.getTime() - bufferMs > now.getTime()) {
    return token.access_token;
  }

  const refreshResponse = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${token.client_id}:${token.client_secret}`).toString('base64')}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    }),
  });

  if (!refreshResponse.ok) {
    throw new Error('Failed to refresh Xero token. Please reconnect Xero.');
  }

  const newTokenData = await refreshResponse.json();
  const newExpiresAt = new Date(Date.now() + newTokenData.expires_in * 1000);

  const supabase = getSupabase();
  await supabase
    .from('xero_tokens')
    .update({
      access_token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token,
      expires_at: newExpiresAt.toISOString(),
    })
    .eq('user_id', userId);

  return newTokenData.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await request.json();
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get Xero token
    const { data: token, error: tokenError } = await supabase
      .from('xero_tokens')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (tokenError || !token) {
      return NextResponse.json(
        { error: 'Xero not connected. Please connect Xero in settings.' },
        { status: 400 }
      );
    }

    // Get job with materials and labour
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (*),
        job_materials (*),
        job_labour (*)
      `)
      .eq('id', jobId)
      .eq('user_id', profile.id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get default contact and items
    const { data: defaultContact } = await supabase
      .from('xero_contacts')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_default', true)
      .single();

    const { data: labourItem } = await supabase
      .from('xero_items')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_default_labour', true)
      .single();

    const { data: materialsItem } = await supabase
      .from('xero_items')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_default_materials', true)
      .single();

    if (!defaultContact || !labourItem || !materialsItem) {
      return NextResponse.json(
        { error: 'Please sync Xero data first (contacts and items)' },
        { status: 400 }
      );
    }

    // Get fresh access token
    const accessToken = await refreshTokenIfNeeded(token, profile.id);

    // Build line items
    const lineItems: Array<{
      ItemCode: string;
      Description: string;
      Quantity: number;
      UnitAmount: number;
      AccountCode?: string;
    }> = [];

    // Add labour entries
    for (const labour of job.job_labour || []) {
      lineItems.push({
        ItemCode: labourItem.code,
        Description: labour.description,
        Quantity: labour.hours,
        UnitAmount: labour.rate,
        AccountCode: labourItem.sales_account_code || '200',
      });
    }

    // Add materials - group by name or add individually
    for (const material of job.job_materials || []) {
      lineItems.push({
        ItemCode: materialsItem.code,
        Description: `${material.name}${material.supplier ? ` (${material.supplier})` : ''}`,
        Quantity: material.qty,
        UnitAmount: material.sell_price,
        AccountCode: materialsItem.sales_account_code || '200',
      });
    }

    if (lineItems.length === 0) {
      return NextResponse.json(
        { error: 'No materials or labour to quote. Please add items first.' },
        { status: 400 }
      );
    }

    // Create quote in Xero
    const quoteDate = new Date().toISOString().split('T')[0];
    const expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const quotePayload = {
      Quotes: [{
        Contact: { ContactID: defaultContact.xero_contact_id },
        LineItems: lineItems,
        Date: quoteDate,
        ExpiryDate: expiryDate,
        Reference: `Job: ${job.title}`,
        Title: job.title,
        Summary: job.description || '',
        LineAmountTypes: 'Exclusive', // Amounts are exclusive of GST
      }],
    };

    const quoteResponse = await fetch(`${XERO_API_BASE}/Quotes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-Tenant-Id': token.tenant_id!,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(quotePayload),
    });

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error('Xero quote creation error:', errorText);
      return NextResponse.json(
        { error: `Failed to create quote in Xero: ${quoteResponse.statusText}` },
        { status: 500 }
      );
    }

    const quoteData = await quoteResponse.json();
    const createdQuote = quoteData.Quotes?.[0];

    if (!createdQuote) {
      return NextResponse.json(
        { error: 'Quote was not created properly' },
        { status: 500 }
      );
    }

    // Update job with Xero quote reference
    await supabase
      .from('jobs')
      .update({
        xero_quote_id: createdQuote.QuoteID,
        xero_quote_number: createdQuote.QuoteNumber,
      })
      .eq('id', jobId);

    return NextResponse.json({
      success: true,
      quote_id: createdQuote.QuoteID,
      quote_number: createdQuote.QuoteNumber,
      total: createdQuote.Total,
    });
  } catch (error) {
    console.error('Create Xero quote error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to create quote: ${errorMessage}` },
      { status: 500 }
    );
  }
}
