import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';

// GET - List invoices
export async function GET(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const supabase = getSupabase();
    let query = supabase
      .from('invoices')
      .select(`
        *,
        jobs (id, title),
        customers (id, name)
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invoices, error } = await query;

    if (error) {
      console.error('Error fetching invoices:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    // Map related data
    const mappedInvoices = (invoices || []).map((inv: Record<string, unknown>) => ({
      ...inv,
      job: inv.jobs,
      customer: inv.customers,
      jobs: undefined,
      customers: undefined,
    }));

    return NextResponse.json({ invoices: mappedInvoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create invoice
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      job_id,
      customer_id,
      line_items = [],
      customer_name,
      customer_email,
      customer_phone,
      notes,
      due_date,
      tax_rate = 10,
    } = body;

    const supabase = getSupabase();

    // Generate invoice number
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id);

    const invoiceNumber = `INV-${String((count || 0) + 1).padStart(5, '0')}`;

    const subtotal = line_items.reduce((sum: number, item: { total?: number }) => sum + (item.total || 0), 0);
    const tax_amount = subtotal * (tax_rate / 100);
    const total = subtotal + tax_amount;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        user_id: profile.id,
        job_id: job_id || null,
        customer_id: customer_id || null,
        invoice_number: invoiceNumber,
        status: 'draft',
        line_items,
        customer_name: customer_name || null,
        customer_email: customer_email || null,
        customer_phone: customer_phone || null,
        subtotal,
        tax_rate,
        tax_amount,
        total,
        notes: notes || null,
        due_date: due_date || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating invoice:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
