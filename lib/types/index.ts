// Trade types
export type Trade =
  | 'electrician'
  | 'plumber'
  | 'builder'
  | 'mechanic'
  | 'carpenter'
  | 'hvac'
  | 'painter'
  | 'landscaper'
  | 'roofer'
  | 'tiler'
  | 'glazier'
  | 'other';

// Job status progression
export type JobStatus =
  | 'quote'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'invoiced'
  | 'paid';

// Invoice status
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';

// Notification types
export type NotificationType =
  | 'job_reminder'
  | 'weather_alert'
  | 'payment_due'
  | 'follow_up'
  | 'system';

// Material source
export type MaterialSource = 'manual' | 'voice' | 'import' | 'receipt' | 'ai';

// Time entry type
export type TimeEntryType = 'driving' | 'onsite' | 'away';

// Time entry source
export type TimeEntrySource = 'gps' | 'manual' | 'ai';

// User Profile
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  trade: Trade;
  company_name: string;
  phone?: string;
  default_labour_rate: number;
  default_markup_pct: number;
  created_at: string;
  updated_at: string;
}

// Customer
export interface Customer {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  last_contacted_at?: string;
  follow_up_date?: string;
  xero_contact_id?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  jobs_count?: number;
  total_revenue?: number;
}

// Job
export interface Job {
  id: string;
  user_id: string;
  customer_id?: string;
  title: string;
  description?: string;
  status: JobStatus;
  address?: string;
  latitude?: number;
  longitude?: number;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  estimated_hours?: number;
  labour_rate: number;
  notes?: string;
  weather_risk_score?: number;
  weather_summary?: string;
  created_at: string;
  updated_at: string;
  // Relations
  customer?: Customer;
  materials?: JobMaterial[];
  labour?: JobLabour[];
  time_entries?: JobTimeEntry[];
  photos?: JobPhoto[];
}

// Materials Catalog Item
export interface MaterialCatalog {
  id: string;
  user_id: string;
  name: string;
  sku?: string;
  supplier?: string;
  buy_price: number;
  markup_pct: number;
  sell_price: number;
  unit: string;
  trade?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

// Job Material
export interface JobMaterial {
  id: string;
  job_id: string;
  user_id: string;
  catalog_material_id?: string;
  name: string;
  sku?: string;
  supplier?: string;
  qty: number;
  unit: string;
  buy_price: number;
  markup_pct: number;
  sell_price: number;
  line_total: number;
  source: MaterialSource;
  created_at: string;
  updated_at: string;
}

// Job Labour Entry
export interface JobLabour {
  id: string;
  job_id: string;
  user_id: string;
  description: string;
  hours: number;
  rate: number;
  total: number;
  source?: string;
  created_at: string;
  updated_at: string;
}

// Job Time Entry
export interface JobTimeEntry {
  id: string;
  job_id: string;
  user_id: string;
  type: TimeEntryType;
  start_time: string;
  end_time?: string;
  duration_minutes?: number;
  source: TimeEntrySource;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Job Photo
export interface JobPhoto {
  id: string;
  job_id: string;
  user_id: string;
  url: string;
  caption?: string;
  type?: string;
  created_at: string;
}

// Supplier
export interface Supplier {
  id: string;
  user_id: string;
  name: string;
  category?: string;
  phone?: string;
  website?: string;
  address_line1?: string;
  address_line2?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
  place_id?: string;
  rating?: number;
  notes?: string;
  xero_contact_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Invoice Line Item
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

// Invoice
export interface Invoice {
  id: string;
  job_id?: string;
  user_id: string;
  customer_id?: string;
  invoice_number: string;
  status: InvoiceStatus;
  line_items: InvoiceLineItem[];
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total: number;
  notes?: string;
  due_date?: string;
  sent_at?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  // Relations
  job?: Job;
  customer?: Customer;
}

// Notification
export interface Notification {
  id: string;
  user_id: string;
  job_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  risk_score?: number;
  read: boolean;
  created_at: string;
}

// Dashboard Metrics
export interface DashboardMetrics {
  active_jobs: number;
  completed_this_month: number;
  hours_this_week: number;
  revenue_this_month: number;
}

// Auth User from MSAL or Google
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  provider: 'microsoft' | 'google';
  access_token: string;
  profile?: Profile;
}

// AI Estimate Types
export interface AIEstimateLabour {
  description: string;
  hours: number;
  rate: number;
  total: number;
}

export interface AIEstimateMaterialConfirmed {
  job_material_id: string;
  name: string;
  qty: number;
  unit_price: number;
  total: number;
}

export interface AIEstimateMaterialSuggested {
  name: string;
  qty: number;
  reason: string;
  estimated_price: number;
}

export interface AIEstimateResponse {
  labour: AIEstimateLabour[];
  materials_confirmed: AIEstimateMaterialConfirmed[];
  materials_suggested: AIEstimateMaterialSuggested[];
  confidence: number; // 0-100
  confidence_reasoning: string;
  notes: string;
  totals: {
    labour_total: number;
    materials_total: number;
    subtotal: number;
    tax: number;
    grand_total: number;
  };
}

// AI Job Insights Types
export interface AIJobInsights {
  summary: string;
  estimated_hours: number | null;
  hours_reasoning: string;
  best_arrival_time: string | null;
  arrival_reasoning: string;
  weather_risk_score: number; // 0-100
  weather_factors: string[];
  risks: { title: string; severity: 'low' | 'medium' | 'high' }[];
  suggestions: string[];
}

// API Response wrapper
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
