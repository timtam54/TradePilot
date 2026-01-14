import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';
import { Customer } from '@/lib/types';

// GET - List all customers
export async function GET(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const needsFollowUp = searchParams.get('needs_follow_up') === 'true';

    const supabase = getSupabase();
    let query = supabase
      .from('customers')
      .select('*')
      .eq('user_id', profile.id)
      .order('updated_at', { ascending: false });

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (needsFollowUp) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const today = new Date().toISOString().split('T')[0];

      query = query.or(
        `last_contacted_at.is.null,last_contacted_at.lt.${thirtyDaysAgo.toISOString()},follow_up_date.lte.${today}`
      );
    }

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ customers: customers || [] });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, address, notes, follow_up_date } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: customer, error } = await supabase
      .from('customers')
      .insert({
        user_id: profile.id,
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        notes: notes || null,
        follow_up_date: follow_up_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
