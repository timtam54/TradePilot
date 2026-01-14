import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';

// GET - List suppliers
export async function GET(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');

    const supabase = getSupabase();
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: suppliers, error } = await query;

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ suppliers: suppliers || [] });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add supplier
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      category,
      phone,
      website,
      address_line1,
      suburb,
      state,
      postcode,
      notes,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        user_id: profile.id,
        name,
        category: category || null,
        phone: phone || null,
        website: website || null,
        address_line1: address_line1 || null,
        suburb: suburb || null,
        state: state || null,
        postcode: postcode || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding supplier:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ supplier }, { status: 201 });
  } catch (error) {
    console.error('Error adding supplier:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
