import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getProfile } from '@/lib/auth/api-auth';
import { createXeroApi } from '@/lib/xero/api';

// POST - Sync suppliers from Xero
export async function POST(request: NextRequest) {
  try {
    const profile = await getProfile(request);
    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Syncing suppliers from Xero for user:', profile.id);

    const xeroApi = createXeroApi(profile.id);
    const supabase = getSupabase();

    // Get all contacts from Xero
    console.log('Fetching contacts from Xero...');
    const allContacts = await xeroApi.getContacts();
    console.log(`Found ${allContacts.length} contacts in Xero`);

    // Filter to suppliers only (IsSupplier is true)
    const contacts = allContacts.filter(c => c.IsSupplier === true);
    console.log(`Processing ${contacts.length} supplier contacts`);

    // Get existing suppliers with xero_contact_id
    const { data: existingSuppliers } = await supabase
      .from('suppliers')
      .select('id, name, xero_contact_id')
      .eq('user_id', profile.id);

    const existingByXeroId = new Map(
      (existingSuppliers || [])
        .filter(s => s.xero_contact_id)
        .map(s => [s.xero_contact_id, s])
    );
    const existingByName = new Map(
      (existingSuppliers || [])
        .filter(s => !s.xero_contact_id)
        .map(s => [s.name.toLowerCase(), s])
    );

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Process in batches
    const toInsert: Array<{
      user_id: string;
      xero_contact_id: string;
      name: string;
      phone: string | null;
      website: string | null;
      address_line1: string | null;
      suburb: string | null;
      state: string | null;
      postcode: string | null;
      is_active: boolean;
    }> = [];

    for (const contact of contacts) {
      // Get phone number (prefer default, then mobile)
      const phone = contact.Phones?.find(p => p.PhoneType === 'DEFAULT')?.PhoneNumber
        || contact.Phones?.find(p => p.PhoneNumber)?.PhoneNumber
        || null;

      // Get address (prefer POBOX, then STREET)
      const address = contact.Addresses?.find(a => a.AddressType === 'POBOX')
        || contact.Addresses?.find(a => a.AddressType === 'STREET')
        || null;

      const existing = existingByXeroId.get(contact.ContactID);

      if (existing) {
        // Update existing supplier
        await supabase
          .from('suppliers')
          .update({
            name: contact.Name,
            phone,
            website: contact.Website || null,
            address_line1: address?.AddressLine1 || null,
            suburb: address?.City || null,
            state: address?.Region || null,
            postcode: address?.PostalCode || null,
          })
          .eq('id', existing.id);
        updated++;
      } else {
        // Check if supplier exists by name (to link existing suppliers)
        const existingName = existingByName.get(contact.Name.toLowerCase());

        if (existingName) {
          // Link existing supplier to Xero
          await supabase
            .from('suppliers')
            .update({
              xero_contact_id: contact.ContactID,
              phone: phone || undefined,
              website: contact.Website || undefined,
              address_line1: address?.AddressLine1 || undefined,
              suburb: address?.City || undefined,
              state: address?.Region || undefined,
              postcode: address?.PostalCode || undefined,
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
            phone,
            website: contact.Website || null,
            address_line1: address?.AddressLine1 || null,
            suburb: address?.City || null,
            state: address?.Region || null,
            postcode: address?.PostalCode || null,
            is_active: true,
          });
        }
      }
    }

    // Batch insert new suppliers
    if (toInsert.length > 0) {
      console.log(`Inserting ${toInsert.length} new suppliers...`);
      const { error } = await supabase
        .from('suppliers')
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
      message: `Synced ${created + updated} suppliers from Xero`,
      created,
      updated,
      skipped,
      total: contacts.length,
    });
  } catch (error) {
    console.error('Xero supplier sync error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to sync suppliers: ${errorMessage}` },
      { status: 500 }
    );
  }
}
