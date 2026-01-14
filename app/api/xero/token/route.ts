import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';
import { XeroToken } from '@/lib/types/xero';

// GET - Get Xero token for current user
export async function GET(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: token, error } = await supabase
      .from('xero_tokens')
      .select('*')
      .eq('user_id', profile.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching Xero token:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ token: token || null });
  } catch (error) {
    console.error('Error fetching Xero token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create Xero token
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { client_id, client_secret, scope } = body;

    const supabase = getSupabase();
    const { data: token, error } = await supabase
      .from('xero_tokens')
      .insert({
        user_id: profile.id,
        client_id,
        client_secret,
        scope,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating Xero token:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ token }, { status: 201 });
  } catch (error) {
    console.error('Error creating Xero token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update Xero token
export async function PUT(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { client_id, client_secret, scope, access_token, refresh_token, expires_at, tenant_id, tenant_name, tenant_type } = body;

    const supabase = getSupabase();

    // Build update object
    const updateData: Partial<XeroToken> = {};
    if (client_id !== undefined) updateData.client_id = client_id;
    if (client_secret !== undefined) updateData.client_secret = client_secret;
    if (scope !== undefined) updateData.scope = scope;
    if (access_token !== undefined) updateData.access_token = access_token;
    if (refresh_token !== undefined) updateData.refresh_token = refresh_token;
    if (expires_at !== undefined) updateData.expires_at = expires_at;
    if (tenant_id !== undefined) updateData.tenant_id = tenant_id;
    if (tenant_name !== undefined) updateData.tenant_name = tenant_name;
    if (tenant_type !== undefined) updateData.tenant_type = tenant_type;

    const { data: token, error } = await supabase
      .from('xero_tokens')
      .update(updateData)
      .eq('user_id', profile.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating Xero token:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (error) {
    console.error('Error updating Xero token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete Xero token
export async function DELETE(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { error } = await supabase
      .from('xero_tokens')
      .delete()
      .eq('user_id', profile.id);

    if (error) {
      console.error('Error deleting Xero token:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Xero token:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
