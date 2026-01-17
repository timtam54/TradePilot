import { getSupabase } from '@/lib/db';
import {
  XeroToken,
  XeroApiContact,
  XeroApiItem,
  CASH_SALES_CONTACT_NAME,
  BUILDING_LABOUR_ITEM_CODE,
  BUILDING_LABOUR_ITEM_NAME,
  BUILDING_MATERIALS_ITEM_CODE,
  BUILDING_MATERIALS_ITEM_NAME,
} from '@/lib/types/xero';

const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0';
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token';

interface XeroApiOptions {
  userId: string;
}

export class XeroApi {
  private userId: string;
  private token: XeroToken | null = null;

  constructor(options: XeroApiOptions) {
    this.userId = options.userId;
  }

  private async getToken(): Promise<XeroToken> {
    if (this.token) return this.token;

    const supabase = getSupabase();
    const { data: token, error } = await supabase
      .from('xero_tokens')
      .select('*')
      .eq('user_id', this.userId)
      .single();

    if (error || !token) {
      throw new Error('Xero not connected. Please connect Xero in settings.');
    }

    this.token = token;
    return token;
  }

  private async refreshTokenIfNeeded(): Promise<string> {
    const token = await this.getToken();

    if (!token.access_token || !token.refresh_token) {
      throw new Error('Xero tokens not available. Please reconnect Xero.');
    }

    // Check if token is expired (with 5 minute buffer)
    const expiresAt = token.expires_at ? new Date(token.expires_at) : null;
    const now = new Date();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    if (expiresAt && expiresAt.getTime() - bufferMs > now.getTime()) {
      // Token is still valid
      return token.access_token;
    }

    // Token is expired or about to expire, refresh it
    console.log('Refreshing Xero token...');

    const refreshResponse = await fetch(XERO_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${token.client_id}:${token.client_secret}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refresh_token,
      }),
    });

    if (!refreshResponse.ok) {
      const error = await refreshResponse.text();
      console.error('Token refresh failed:', error);
      throw new Error('Failed to refresh Xero token. Please reconnect Xero.');
    }

    const newTokenData = await refreshResponse.json();
    const newExpiresAt = new Date(Date.now() + newTokenData.expires_in * 1000);

    // Update token in database
    const supabase = getSupabase();
    const { error: updateError } = await supabase
      .from('xero_tokens')
      .update({
        access_token: newTokenData.access_token,
        refresh_token: newTokenData.refresh_token,
        expires_at: newExpiresAt.toISOString(),
      })
      .eq('user_id', this.userId);

    if (updateError) {
      console.error('Failed to save refreshed token:', updateError);
    }

    // Update cached token
    this.token = {
      ...token,
      access_token: newTokenData.access_token,
      refresh_token: newTokenData.refresh_token,
      expires_at: newExpiresAt.toISOString(),
    };

    return newTokenData.access_token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const accessToken = await this.refreshTokenIfNeeded();
    const token = await this.getToken();

    if (!token.tenant_id) {
      throw new Error('Xero tenant not selected. Please reconnect Xero.');
    }

    console.log(`Xero API request: ${options.method || 'GET'} ${endpoint}`);

    const response = await fetch(`${XERO_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Xero-Tenant-Id': token.tenant_id,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Xero API error (${options.method || 'GET'} ${endpoint}):`, response.status, errorText);

      // Try to parse error for more details
      let errorDetail = response.statusText;
      try {
        const errorJson = JSON.parse(errorText);
        errorDetail = errorJson.Message || errorJson.Detail || errorJson.Title || errorText.substring(0, 200);
      } catch {
        errorDetail = errorText.substring(0, 200);
      }

      throw new Error(`Xero: ${errorDetail}`);
    }

    return response.json();
  }

  // ==================== CONTACTS ====================

  async getContacts(): Promise<XeroApiContact[]> {
    const response = await this.request<{ Contacts: XeroApiContact[] }>('/Contacts');
    return response.Contacts || [];
  }

  async getContactByName(name: string): Promise<XeroApiContact | null> {
    try {
      // Xero where clause needs the whole expression URL encoded
      const whereClause = encodeURIComponent(`Name=="${name}"`);
      const response = await this.request<{ Contacts: XeroApiContact[] }>(
        `/Contacts?where=${whereClause}`
      );
      return response.Contacts?.[0] || null;
    } catch (error) {
      console.error('Error finding contact by name:', error);
      return null;
    }
  }

  async createContact(contact: Partial<XeroApiContact>): Promise<XeroApiContact> {
    const response = await this.request<{ Contacts: XeroApiContact[] }>('/Contacts', {
      method: 'POST',
      body: JSON.stringify({ Contacts: [contact] }),
    });
    return response.Contacts[0];
  }

  async getOrCreateCashSalesContact(): Promise<XeroApiContact> {
    // First try to find existing Cash Sales contact
    let contact = await this.getContactByName(CASH_SALES_CONTACT_NAME);

    if (!contact) {
      // Create Cash Sales contact
      console.log('Creating Cash Sales contact in Xero...');
      contact = await this.createContact({
        Name: CASH_SALES_CONTACT_NAME,
        IsCustomer: true,
        IsSupplier: false,
      });
    }

    return contact;
  }

  // ==================== ITEMS ====================

  async getItems(): Promise<XeroApiItem[]> {
    const response = await this.request<{ Items: XeroApiItem[] }>('/Items');
    return response.Items || [];
  }

  async getItemByCode(code: string): Promise<XeroApiItem | null> {
    try {
      const response = await this.request<{ Items: XeroApiItem[] }>(
        `/Items/${encodeURIComponent(code)}`
      );
      return response.Items?.[0] || null;
    } catch {
      // Item not found returns 404
      return null;
    }
  }

  async createItem(item: Partial<XeroApiItem>): Promise<XeroApiItem> {
    const response = await this.request<{ Items: XeroApiItem[] }>('/Items', {
      method: 'POST',
      body: JSON.stringify({ Items: [item] }),
    });
    return response.Items[0];
  }

  async getOrCreateBuildingLabourItem(defaultRate: number = 85): Promise<XeroApiItem> {
    let item = await this.getItemByCode(BUILDING_LABOUR_ITEM_CODE);

    if (!item) {
      console.log('Creating Building Labour item in Xero...');
      item = await this.createItem({
        Code: BUILDING_LABOUR_ITEM_CODE,
        Name: BUILDING_LABOUR_ITEM_NAME,
        Description: 'Labour charges',
        IsSold: true,
        IsPurchased: false,
      });
    }

    return item;
  }

  async getOrCreateBuildingMaterialsItem(): Promise<XeroApiItem> {
    let item = await this.getItemByCode(BUILDING_MATERIALS_ITEM_CODE);

    if (!item) {
      console.log('Creating Building Materials item in Xero...');
      item = await this.createItem({
        Code: BUILDING_MATERIALS_ITEM_CODE,
        Name: BUILDING_MATERIALS_ITEM_NAME,
        Description: 'Materials and supplies',
        IsSold: true,
        IsPurchased: true,
      });
    }

    return item;
  }

  // ==================== SYNC TO LOCAL DB ====================

  async syncContactsToLocal(): Promise<{ synced: number; defaultContactId: string }> {
    const supabase = getSupabase();

    console.log('Getting Cash Sales contact...');
    // Just ensure Cash Sales contact exists - don't sync all contacts
    const cashSalesContact = await this.getOrCreateCashSalesContact();
    console.log('Cash Sales contact:', cashSalesContact.ContactID);

    // Only sync the Cash Sales contact to local DB
    const { error } = await supabase
      .from('xero_contacts')
      .upsert({
        user_id: this.userId,
        xero_contact_id: cashSalesContact.ContactID,
        name: cashSalesContact.Name,
        email: cashSalesContact.EmailAddress || null,
        is_customer: true,
        is_supplier: false,
        is_default: true,
      }, {
        onConflict: 'user_id,xero_contact_id',
      });

    if (error) {
      console.error('Error upserting contact:', error);
      throw new Error(`Failed to save contact: ${error.message}`);
    }

    return { synced: 1, defaultContactId: cashSalesContact.ContactID };
  }

  async syncItemsToLocal(defaultLabourRate: number = 85): Promise<{
    synced: number;
    labourItemId: string;
    materialsItemId: string;
  }> {
    const supabase = getSupabase();

    console.log('Getting Building Labour item...');
    // Just ensure default items exist - don't sync all items
    const labourItem = await this.getOrCreateBuildingLabourItem(defaultLabourRate);
    console.log('Labour item:', labourItem.ItemID);

    console.log('Getting Building Materials item...');
    const materialsItem = await this.getOrCreateBuildingMaterialsItem();
    console.log('Materials item:', materialsItem.ItemID);

    // Sync labour item
    const { error: labourError } = await supabase
      .from('xero_items')
      .upsert({
        user_id: this.userId,
        xero_item_id: labourItem.ItemID,
        code: labourItem.Code,
        name: labourItem.Name,
        description: labourItem.Description || null,
        unit_price: null,
        is_sold: true,
        is_purchased: false,
        sales_account_code: null,
        item_type: 'labour',
        is_default_labour: true,
        is_default_materials: false,
      }, {
        onConflict: 'user_id,xero_item_id',
      });

    if (labourError) {
      console.error('Error upserting labour item:', labourError);
      throw new Error(`Failed to save labour item: ${labourError.message}`);
    }

    // Sync materials item
    const { error: materialsError } = await supabase
      .from('xero_items')
      .upsert({
        user_id: this.userId,
        xero_item_id: materialsItem.ItemID,
        code: materialsItem.Code,
        name: materialsItem.Name,
        description: materialsItem.Description || null,
        unit_price: null,
        is_sold: true,
        is_purchased: true,
        sales_account_code: null,
        purchase_account_code: null,
        item_type: 'materials',
        is_default_labour: false,
        is_default_materials: true,
      }, {
        onConflict: 'user_id,xero_item_id',
      });

    if (materialsError) {
      console.error('Error upserting materials item:', materialsError);
      throw new Error(`Failed to save materials item: ${materialsError.message}`);
    }

    return {
      synced: 2,
      labourItemId: labourItem.ItemID,
      materialsItemId: materialsItem.ItemID,
    };
  }

  // Full sync of contacts and items
  async syncAll(defaultLabourRate: number = 85): Promise<{
    contacts: { synced: number; defaultContactId: string };
    items: { synced: number; labourItemId: string; materialsItemId: string };
  }> {
    const contacts = await this.syncContactsToLocal();
    const items = await this.syncItemsToLocal(defaultLabourRate);

    return { contacts, items };
  }
}

// Factory function to create XeroApi instance
export function createXeroApi(userId: string): XeroApi {
  return new XeroApi({ userId });
}
