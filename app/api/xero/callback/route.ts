import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

// GET - Handle Xero OAuth callback
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('Xero OAuth error:', error);
      return NextResponse.redirect(
        new URL(`/settings/xero?error=${encodeURIComponent(error)}`, request.url)
      );
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/settings/xero?error=missing_params', request.url)
      );
    }

    // Decode state to get user info
    let stateData: { userId: string; provider: string; providerId: string };
    try {
      stateData = JSON.parse(atob(state));
    } catch {
      return NextResponse.redirect(
        new URL('/settings/xero?error=invalid_state', request.url)
      );
    }

    const supabase = getSupabase();

    // Get the user's Xero token record to get client credentials
    const { data: tokenRecord, error: tokenError } = await supabase
      .from('xero_tokens')
      .select('*')
      .eq('user_id', stateData.userId)
      .single();

    if (tokenError || !tokenRecord) {
      return NextResponse.redirect(
        new URL('/settings/xero?error=token_not_found', request.url)
      );
    }

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://identity.xero.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${tokenRecord.client_id}:${tokenRecord.client_secret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.NEXT_PUBLIC_XERO_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/xero/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Xero token exchange failed:', errorText);
      return NextResponse.redirect(
        new URL('/settings/xero?error=token_exchange_failed', request.url)
      );
    }

    const tokenData = await tokenResponse.json();

    // Get tenant (organization) info
    const connectionsResponse = await fetch('https://api.xero.com/connections', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
    });

    let tenantId = null;
    let tenantName = null;
    let tenantType = null;

    if (connectionsResponse.ok) {
      const connections = await connectionsResponse.json();
      if (connections.length > 0) {
        tenantId = connections[0].tenantId;
        tenantName = connections[0].tenantName;
        tenantType = connections[0].tenantType;
      }
    }

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString();

    // Update the token record with access token and tenant info
    const { error: updateError } = await supabase
      .from('xero_tokens')
      .update({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        tenant_id: tenantId,
        tenant_name: tenantName,
        tenant_type: tenantType,
        scope: tokenData.scope,
      })
      .eq('user_id', stateData.userId);

    if (updateError) {
      console.error('Error updating Xero token:', updateError);
      return NextResponse.redirect(
        new URL('/settings/xero?error=update_failed', request.url)
      );
    }

    // Redirect back to settings with success
    return NextResponse.redirect(new URL('/settings/xero?success=true', request.url));
  } catch (error) {
    console.error('Xero callback error:', error);
    return NextResponse.redirect(
      new URL('/settings/xero?error=unknown', request.url)
    );
  }
}
