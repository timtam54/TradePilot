import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';
import { createXeroApi } from '@/lib/xero/api';

// GET - Get synced Xero contacts from local DB
export async function GET(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: contacts, error } = await supabase
      .from('xero_contacts')
      .select('*')
      .eq('user_id', profile.id)
      .order('name');

    if (error) {
      console.error('Error fetching Xero contacts:', error);
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
    }

    // Find default contact
    const defaultContact = contacts?.find(c => c.is_default) || null;

    return NextResponse.json({
      contacts: contacts || [],
      default_contact: defaultContact,
    });
  } catch (error) {
    console.error('Error fetching Xero contacts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Sync contacts from Xero
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const xeroApi = createXeroApi(profile.id);
    const result = await xeroApi.syncContactsToLocal();

    return NextResponse.json({
      success: true,
      message: 'Contacts synced successfully',
      synced: result.synced,
      default_contact_id: result.defaultContactId,
    });
  } catch (error) {
    console.error('Xero contacts sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to sync contacts: ${errorMessage}` },
      { status: 500 }
    );
  }
}
