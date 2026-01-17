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

export interface XeroContact {
  id?: string;
  user_id: string;
  xero_contact_id: string;
  name: string;
  email?: string;
  phone?: string;
  is_customer: boolean;
  is_supplier: boolean;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface XeroItem {
  id?: string;
  user_id: string;
  xero_item_id: string;
  code: string;
  name: string;
  description?: string;
  unit_price?: number;
  is_sold: boolean;
  is_purchased: boolean;
  sales_account_code?: string;
  purchase_account_code?: string;
  item_type?: 'labour' | 'materials';
  is_default_labour: boolean;
  is_default_materials: boolean;
  created_at?: string;
  updated_at?: string;
}

// Xero API response types
export interface XeroApiContact {
  ContactID: string;
  Name: string;
  EmailAddress?: string;
  Phones?: Array<{ PhoneNumber?: string; PhoneType?: string }>;
  IsCustomer?: boolean;
  IsSupplier?: boolean;
}

export interface XeroApiItem {
  ItemID: string;
  Code: string;
  Name: string;
  Description?: string;
  SalesDetails?: {
    UnitPrice?: number;
    AccountCode?: string;
  };
  PurchaseDetails?: {
    UnitPrice?: number;
    AccountCode?: string;
  };
  IsSold?: boolean;
  IsPurchased?: boolean;
}

export const DEFAULT_XERO_SCOPE =
  'accounting.transactions accounting.contacts accounting.settings offline_access';

export const CASH_SALES_CONTACT_NAME = 'Cash Sales';
export const BUILDING_LABOUR_ITEM_CODE = 'LABOUR';
export const BUILDING_LABOUR_ITEM_NAME = 'Building Labour';
export const BUILDING_MATERIALS_ITEM_CODE = 'MATERIALS';
export const BUILDING_MATERIALS_ITEM_NAME = 'Building Materials';
