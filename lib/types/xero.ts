export interface XeroToken {
  id?: string;
  user_id: string;
  client_id: string | null;
  client_secret: string | null;
  access_token: string | null;
  refresh_token: string | null;
  scope: string | null;
  expires_at: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_type: string | null;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_XERO_SCOPE =
  'accounting.transactions accounting.contacts accounting.settings offline_access';
