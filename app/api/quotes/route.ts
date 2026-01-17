import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';

// GET - List all quotes (jobs with xero_quote_number)
export async function GET(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: quotes, error } = await supabase
      .from('jobs')
      .select(`
        id,
        title,
        status,
        xero_quote_id,
        xero_quote_number,
        created_at,
        updated_at,
        customers (
          id,
          name
        ),
        job_materials (
          line_total
        ),
        job_labour (
          total
        )
      `)
      .eq('user_id', profile.id)
      .not('xero_quote_number', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Calculate totals for each quote
    const quotesWithTotals = (quotes || []).map(quote => {
      const materialsTotal = (quote.job_materials || []).reduce(
        (sum: number, m: { line_total: number }) => sum + (m.line_total || 0),
        0
      );
      const labourTotal = (quote.job_labour || []).reduce(
        (sum: number, l: { total: number }) => sum + (l.total || 0),
        0
      );
      const subtotal = materialsTotal + labourTotal;
      const tax = subtotal * 0.1; // 10% GST
      const total = subtotal + tax;

      return {
        id: quote.id,
        quote_number: quote.xero_quote_number,
        xero_quote_id: quote.xero_quote_id,
        title: quote.title,
        status: quote.status,
        customer_name: quote.customers?.name || null,
        subtotal,
        tax,
        total,
        created_at: quote.created_at,
      };
    });

    return NextResponse.json({ quotes: quotesWithTotals });
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
