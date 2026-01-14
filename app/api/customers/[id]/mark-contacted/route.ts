import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';

// POST - Mark customer as contacted
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
    const supabase = getSupabase();

    const { data: customer, error } = await supabase
      .from('customers')
      .update({
        last_contacted_at: new Date().toISOString(),
        follow_up_date: null
      })
      .eq('id', id)
      .eq('user_id', profile.id)
      .select()
      .single();

    if (error || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    return NextResponse.json({ customer });
  } catch (error) {
    console.error('Error marking customer as contacted:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
