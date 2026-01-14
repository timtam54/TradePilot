import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { Profile } from '@/lib/types';

async function getAuthInfo(request: NextRequest): Promise<{ provider: string; providerId: string } | null> {
  const authHeader = request.headers.get('authorization');
  const provider = request.headers.get('x-auth-provider');

  if (!authHeader || !provider) return null;

  const token = authHeader.replace('Bearer ', '');

  // For Google OAuth, the token is an access token, not JWT
  // The providerId was passed when creating the profile
  // We need to look up by provider only for now, or use a different approach

  if (provider === 'google') {
    // For Google, we'll fetch user info to get the sub
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (userInfoResponse.ok) {
        const userInfo = await userInfoResponse.json();
        return { provider, providerId: userInfo.sub };
      }
    } catch {
      // Token might be expired or invalid
    }
    return null;
  }

  // For Microsoft, parse the JWT
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const providerId = payload.oid || payload.sub;
    return { provider, providerId };
  } catch {
    return null;
  }
}

// GET - Fetch current user's profile
export async function GET(request: NextRequest) {
  try {
    const authInfo = await getAuthInfo(request);
    if (!authInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_provider', authInfo.provider)
      .eq('auth_provider_id', authInfo.providerId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching profile:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create or update profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, full_name, auth_provider, auth_provider_id, trade, company_name } = body;

    const supabase = getSupabase();

    // Check if profile exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('*')
      .eq('auth_provider', auth_provider)
      .eq('auth_provider_id', auth_provider_id)
      .single();

    if (existing) {
      // Update existing profile
      const { data: updated, error } = await supabase
        .from('profiles')
        .update({ email, full_name })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }

      return NextResponse.json({ profile: updated, created: false });
    }

    // Create new profile
    const { data: newProfile, error } = await supabase
      .from('profiles')
      .insert({
        email,
        full_name,
        auth_provider,
        auth_provider_id,
        trade: trade || 'general',
        company_name: company_name || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ profile: newProfile, created: true }, { status: 201 });
  } catch (error) {
    console.error('Error creating/updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update profile settings
export async function PUT(request: NextRequest) {
  try {
    const authInfo = await getAuthInfo(request);
    if (!authInfo) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, trade, company_name, phone, default_labour_rate, default_markup_pct } = body;

    const supabase = getSupabase();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (trade !== undefined) updateData.trade = trade;
    if (company_name !== undefined) updateData.company_name = company_name;
    if (phone !== undefined) updateData.phone = phone;
    if (default_labour_rate !== undefined) updateData.default_labour_rate = default_labour_rate;
    if (default_markup_pct !== undefined) updateData.default_markup_pct = default_markup_pct;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('auth_provider', authInfo.provider)
      .eq('auth_provider_id', authInfo.providerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    if (!updated) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
