import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';

// GET - List materials catalog
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
      .from('materials_catalog')
      .select('*')
      .eq('user_id', profile.id)
      .order('name', { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,sku.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data: materials, error } = await query;

    if (error) {
      console.error('Error fetching materials:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ materials: materials || [] });
  } catch (error) {
    console.error('Error fetching materials:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add material to catalog
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      sku,
      supplier,
      buy_price = 0,
      markup_pct,
      unit = 'each',
      trade,
      category,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const markupPercent = markup_pct ?? profile.default_markup_pct;
    const sell_price = buy_price * (1 + markupPercent / 100);

    const supabase = getSupabase();

    const { data: material, error } = await supabase
      .from('materials_catalog')
      .insert({
        user_id: profile.id,
        name,
        sku: sku || null,
        supplier: supplier || null,
        buy_price,
        markup_pct: markupPercent,
        sell_price,
        unit,
        trade: trade || profile.trade,
        category: category || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding material:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error('Error adding material:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
