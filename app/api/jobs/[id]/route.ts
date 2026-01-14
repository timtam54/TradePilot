import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';

// GET - Get single job with all details
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

    const { data: job, error } = await supabase
      .from('jobs')
      .select(`
        *,
        customers (
          id,
          name,
          email,
          phone,
          address
        ),
        job_materials (*),
        job_labour (*)
      `)
      .eq('id', id)
      .eq('user_id', profile.id)
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Get time entries separately
    const { data: timeEntries } = await supabase
      .from('job_time_entries')
      .select('*')
      .eq('job_id', id)
      .order('start_time', { ascending: false });

    // Calculate totals
    const materials = job.job_materials || [];
    const labour = job.job_labour || [];
    const materialsTotal = materials.reduce((sum: number, m: { line_total?: number }) => sum + (m.line_total || 0), 0);
    const labourTotal = labour.reduce((sum: number, l: { total?: number }) => sum + (l.total || 0), 0);

    const jobWithDetails = {
      ...job,
      customer: job.customers,
      materials,
      labour,
      time_entries: timeEntries || [],
      totals: {
        materials: materialsTotal,
        labour: labourTotal,
        total: materialsTotal + labourTotal,
      },
      customers: undefined,
      job_materials: undefined,
      job_labour: undefined,
    };

    return NextResponse.json({ job: jobWithDetails });
  } catch (error) {
    console.error('Error fetching job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update job
export async function PUT(
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
      customer_id,
      title,
      description,
      status,
      address,
      latitude,
      longitude,
      scheduled_start,
      scheduled_end,
      actual_start,
      actual_end,
      estimated_hours,
      labour_rate,
      notes,
    } = body;

    const supabase = getSupabase();

    const updateData: Record<string, unknown> = {};
    if (customer_id !== undefined) updateData.customer_id = customer_id || null;
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (address !== undefined) updateData.address = address;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (scheduled_start !== undefined) updateData.scheduled_start = scheduled_start;
    if (scheduled_end !== undefined) updateData.scheduled_end = scheduled_end;
    if (actual_start !== undefined) updateData.actual_start = actual_start;
    if (actual_end !== undefined) updateData.actual_end = actual_end;
    if (estimated_hours !== undefined) updateData.estimated_hours = estimated_hours;
    if (labour_rate !== undefined) updateData.labour_rate = labour_rate;
    if (notes !== undefined) updateData.notes = notes;

    const { data: job, error } = await supabase
      .from('jobs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', profile.id)
      .select()
      .single();

    if (error || !job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete job
export async function DELETE(
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

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)
      .eq('user_id', profile.id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
