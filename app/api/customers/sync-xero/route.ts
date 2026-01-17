import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';
import { createXeroApi } from '@/lib/xero/api';

// POST - Sync customers from Xero
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Syncing customers from Xero for user:', profile.id);

    const xeroApi = createXeroApi(profile.id);
    const supabase = getSupabase();

    // Get all contacts from Xero
    console.log('Fetching contacts from Xero...');
    const allContacts = await xeroApi.getContacts();
    console.log(`Found ${allContacts.length} contacts in Xero`);

    // Filter to customers only (not supplier-only contacts)
    const contacts = allContacts.filter(c => c.IsCustomer !== false);
    console.log(`Processing ${contacts.length} customer contacts`);

    // Get existing customers with xero_contact_id
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id, name, xero_contact_id')
      .eq('user_id', profile.id);

    const existingByXeroId = new Map(
      (existingCustomers || [])
        .filter(c => c.xero_contact_id)
        .map(c => [c.xero_contact_id, c])
    );
    const existingByName = new Map(
      (existingCustomers || [])
        .filter(c => !c.xero_contact_id)
        .map(c => [c.name.toLowerCase(), c])
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process in batches
    const toInsert: Array<{
      user_id: string;
      xero_contact_id: string;
      name: string;
      email: string | null;
      phone: string | null;
    }> = [];

    for (const contact of contacts) {
      // Get phone number (prefer mobile, then default)
      const phone = contact.Phones?.find(p => p.PhoneType === 'MOBILE')?.PhoneNumber
        || contact.Phones?.find(p => p.PhoneNumber)?.PhoneNumber
        || null;

      const existing = existingByXeroId.get(contact.ContactID);

      if (existing) {
        // Update existing customer (batch these too if needed)
        await supabase
          .from('customers')
          .update({
            name: contact.Name,
            email: contact.EmailAddress || null,
            phone,
          })
          .eq('id', existing.id);
        updated++;
      } else {
        // Check if customer exists by name (to link existing customers)
        const existingName = existingByName.get(contact.Name.toLowerCase());

        if (existingName) {
          // Link existing customer to Xero
          await supabase
            .from('customers')
            .update({
              xero_contact_id: contact.ContactID,
              email: contact.EmailAddress || null,
              phone: phone || undefined,
            })
            .eq('id', existingName.id);
          // Remove from map so we don't match again
          existingByName.delete(contact.Name.toLowerCase());
          updated++;
        } else {
          // Queue for batch insert
          toInsert.push({
            user_id: profile.id,
            xero_contact_id: contact.ContactID,
            name: contact.Name,
            email: contact.EmailAddress || null,
            phone,
          });
        }
      }
    }

    // Batch insert new customers
    if (toInsert.length > 0) {
      console.log(`Inserting ${toInsert.length} new customers...`);
      const { error } = await supabase
        .from('customers')
        .insert(toInsert);

      if (error) {
        console.error('Batch insert error:', error);
        skipped = toInsert.length;
      } else {
        created = toInsert.length;
      }
    }

    console.log(`Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

    return NextResponse.json({
      success: true,
      message: `Synced ${created + updated} customers from Xero`,
      created,
      updated,
      skipped,
      total: contacts.length,
    });
  } catch (error) {
    console.error('Xero customer sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to sync customers: ${errorMessage}` },
      { status: 500 }
    );
  }
}
