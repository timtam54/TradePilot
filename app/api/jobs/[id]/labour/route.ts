import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';

// GET - Get job labour entries
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

    const { data: labour, error } = await supabase
      .from('job_labour')
      .select('*')
      .eq('job_id', id)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching labour:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ labour: labour || [] });
  } catch (error) {
    console.error('Error fetching labour:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Add labour entry to job
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
    const { description, hours = 0, rate, source } = body;

    if (!description) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const supabase = getSupabase();

    // Get job to get default rate
    const { data: job } = await supabase
      .from('jobs')
      .select('labour_rate')
      .eq('id', id)
      .eq('user_id', profile.id)
      .single();

    const finalRate = rate || job?.labour_rate || profile.default_labour_rate;
    const total = hours * finalRate;

    const { data: labour, error } = await supabase
      .from('job_labour')
      .insert({
        job_id: id,
        user_id: profile.id,
        description,
        hours,
        rate: finalRate,
        total,
        source: source || 'manual',
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding labour:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ labour }, { status: 201 });
  } catch (error) {
    console.error('Error adding labour:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
