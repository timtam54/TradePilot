import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';

// GET - Get job materials
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = getSupabase();

    const { data: materials, error } = await supabase
      .from('job_materials')
      .select('*')
      .eq('job_id', id)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true });

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

// POST - Add material to job
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      catalog_material_id,
      name,
      sku,
      supplier,
      qty = 1,
      unit = 'each',
      buy_price = 0,
      markup_pct,
      sell_price,
      source = 'manual',
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Material name is required' }, { status: 400 });
    }

    const markupPercent = markup_pct ?? profile.default_markup_pct;
    const finalSellPrice = sell_price ?? (buy_price * (1 + markupPercent / 100));
    const lineTotal = qty * finalSellPrice;

    const supabase = getSupabase();

    const { data: material, error } = await supabase
      .from('job_materials')
      .insert({
        job_id: id,
        user_id: profile.id,
        catalog_material_id: catalog_material_id || null,
        name,
        sku: sku || null,
        supplier: supplier || null,
        qty,
        unit,
        buy_price,
        markup_pct: markupPercent,
        sell_price: finalSellPrice,
        line_total: lineTotal,
        source,
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
