import { NextRequest, NextResponse } from 'next/server';
import { getProfile } from '@/lib/auth/api-auth';
import { createXeroApi } from '@/lib/xero/api';

// POST - Sync all Xero data (contacts and items)
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting Xero sync for user:', profile.id);
    const xeroApi = createXeroApi(profile.id);

    console.log('Syncing contacts...');
    const contacts = await xeroApi.syncContactsToLocal();
    console.log('Contacts synced:', contacts.synced);

    console.log('Syncing items...');
    const items = await xeroApi.syncItemsToLocal(profile.default_labour_rate);
    console.log('Items synced:', items.synced);

    return NextResponse.json({
      success: true,
      message: 'Xero data synced successfully',
      data: {
        contacts_synced: contacts.synced,
        default_contact_id: contacts.defaultContactId,
        items_synced: items.synced,
        labour_item_id: items.labourItemId,
        materials_item_id: items.materialsItemId,
      },
    });
  } catch (error) {
    console.error('Xero sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to sync Xero data: ${errorMessage}` },
      { status: 500 }
    );
  }
}
