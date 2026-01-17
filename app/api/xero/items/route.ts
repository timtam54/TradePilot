import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';
import { createXeroApi } from '@/lib/xero/api';

// GET - Get synced Xero items from local DB
export async function GET(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();
    const { data: items, error } = await supabase
      .from('xero_items')
      .select('*')
      .eq('user_id', profile.id)
      .order('code');

    if (error) {
      console.error('Error fetching Xero items:', error);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    // Find default items
    const defaultLabourItem = items?.find(i => i.is_default_labour) || null;
    const defaultMaterialsItem = items?.find(i => i.is_default_materials) || null;

    return NextResponse.json({
      items: items || [],
      default_labour_item: defaultLabourItem,
      default_materials_item: defaultMaterialsItem,
    });
  } catch (error) {
    console.error('Error fetching Xero items:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Sync items from Xero
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const xeroApi = createXeroApi(profile.id);
    const result = await xeroApi.syncItemsToLocal(profile.default_labour_rate);

    return NextResponse.json({
      success: true,
      message: 'Items synced successfully',
      synced: result.synced,
      labour_item_id: result.labourItemId,
      materials_item_id: result.materialsItemId,
    });
  } catch (error) {
    console.error('Xero items sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to sync items: ${errorMessage}` },
      { status: 500 }
    );
  }
}
