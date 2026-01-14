import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';
import { Job } from '@/lib/types';

// GET - List all jobs
export async function GET(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const customerId = searchParams.get('customer_id');
    const search = searchParams.get('search');
    const today = searchParams.get('today') === 'true';

    const supabase = getSupabase();
    let query = supabase
      .from('jobs')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone
        )
      `)
      .eq('user_id', profile.id)
      .order('scheduled_start', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (today) {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      query = query
        .gte('scheduled_start', todayStart.toISOString())
        .lte('scheduled_start', todayEnd.toISOString());
    }

    const { data: jobs, error } = await query;

    if (error) {
      console.error('Error fetching jobs:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Map customer data to match expected format
    const jobsWithCustomer = (jobs || []).map((job: Job & { customers: { id: string; name: string; email: string; phone: string } | null }) => ({
      ...job,
      customer: job.customers,
      customers: undefined,
    }));

    return NextResponse.json({ jobs: jobsWithCustomer });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new job
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      customer_id,
      title,
      description,
      status = 'quote',
      address,
      latitude,
      longitude,
      scheduled_start,
      scheduled_end,
      estimated_hours,
      labour_rate,
      notes,
    } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const { data: job, error } = await supabase
      .from('jobs')
      .insert({
        user_id: profile.id,
        customer_id: customer_id || null,
        title,
        description: description || null,
        status,
        address: address || null,
        latitude: latitude || null,
        longitude: longitude || null,
        scheduled_start: scheduled_start || null,
        scheduled_end: scheduled_end || null,
        estimated_hours: estimated_hours || null,
        labour_rate: labour_rate || profile.default_labour_rate,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating job:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ job }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
