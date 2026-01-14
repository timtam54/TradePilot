-- TradePilot Supabase (PostgreSQL) Database Schema
-- Run this script in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles (User accounts)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    trade VARCHAR(50) NOT NULL DEFAULT 'general',
    company_name VARCHAR(255),
    phone VARCHAR(50),
    default_labour_rate DECIMAL(10,2) DEFAULT 75.00,
    default_markup_pct DECIMAL(5,2) DEFAULT 20.00,
    auth_provider VARCHAR(50) NOT NULL, -- 'microsoft' or 'google'
    auth_provider_id VARCHAR(255) NOT NULL, -- ID from auth provider
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_trade CHECK (trade IN ('electrician', 'plumber', 'builder', 'mechanic', 'carpenter', 'hvac', 'painter', 'landscaper', 'general')),
    CONSTRAINT uq_auth_provider UNIQUE (auth_provider, auth_provider_id)
);

-- Customers
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(500),
    notes TEXT,
    last_contacted_at TIMESTAMPTZ,
    follow_up_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_user_id ON customers(user_id);
CREATE INDEX idx_customers_follow_up ON customers(user_id, follow_up_date);

-- Jobs
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'quote',
    address VARCHAR(500),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    scheduled_start TIMESTAMPTZ,
    scheduled_end TIMESTAMPTZ,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    estimated_hours DECIMAL(10,2),
    labour_rate DECIMAL(10,2) NOT NULL,
    notes TEXT,
    weather_risk_score INT,
    weather_summary VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_job_status CHECK (status IN ('quote', 'scheduled', 'in_progress', 'completed', 'invoiced', 'paid'))
);

CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX idx_jobs_status ON jobs(user_id, status);
CREATE INDEX idx_jobs_scheduled ON jobs(user_id, scheduled_start);

-- Materials Catalog
CREATE TABLE materials_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    supplier VARCHAR(255),
    buy_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    markup_pct DECIMAL(5,2) NOT NULL DEFAULT 20,
    sell_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'each',
    trade VARCHAR(50),
    category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materials_catalog_user_id ON materials_catalog(user_id);
CREATE INDEX idx_materials_catalog_name ON materials_catalog(user_id, name);

-- Job Materials
CREATE TABLE job_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    catalog_material_id UUID REFERENCES materials_catalog(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    supplier VARCHAR(255),
    qty DECIMAL(10,2) NOT NULL DEFAULT 1,
    unit VARCHAR(50) NOT NULL DEFAULT 'each',
    buy_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    markup_pct DECIMAL(5,2) NOT NULL DEFAULT 20,
    sell_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_material_source CHECK (source IN ('manual', 'voice', 'import', 'receipt', 'ai'))
);

CREATE INDEX idx_job_materials_job_id ON job_materials(job_id);

-- Job Labour
CREATE TABLE job_labour (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    description VARCHAR(500) NOT NULL,
    hours DECIMAL(10,2) NOT NULL DEFAULT 0,
    rate DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    source VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_labour_job_id ON job_labour(job_id);

-- Job Time Entries
CREATE TABLE job_time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    type VARCHAR(50) NOT NULL DEFAULT 'onsite',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes INT,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    notes VARCHAR(500),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_time_entry_type CHECK (type IN ('driving', 'onsite', 'away')),
    CONSTRAINT chk_time_entry_source CHECK (source IN ('gps', 'manual', 'ai'))
);

CREATE INDEX idx_job_time_entries_job_id ON job_time_entries(job_id);
CREATE INDEX idx_job_time_entries_user_date ON job_time_entries(user_id, start_time);

-- Job Photos
CREATE TABLE job_photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    url VARCHAR(1000) NOT NULL,
    caption VARCHAR(500),
    type VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_job_photos_job_id ON job_photos(job_id);

-- Suppliers
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    phone VARCHAR(50),
    website VARCHAR(500),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    suburb VARCHAR(100),
    state VARCHAR(50),
    postcode VARCHAR(20),
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    place_id VARCHAR(255),
    rating DECIMAL(3,2),
    notes TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_suppliers_user_id ON suppliers(user_id);
CREATE INDEX idx_suppliers_active ON suppliers(user_id, is_active);

-- Invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    invoice_number VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    customer_name VARCHAR(255),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(50),
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_rate DECIMAL(5,2) NOT NULL DEFAULT 10,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    total DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    due_date DATE,
    sent_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_invoice_status CHECK (status IN ('draft', 'sent', 'paid', 'overdue'))
);

CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_job_id ON invoices(job_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(user_id, status);
CREATE UNIQUE INDEX idx_invoices_number ON invoices(user_id, invoice_number);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'system',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    risk_score INT,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_notification_type CHECK (type IN ('job_reminder', 'weather_alert', 'payment_due', 'follow_up', 'system'))
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, read);

-- Materials Log (Audit trail)
CREATE TABLE materials_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    payload_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_materials_log_action CHECK (action IN ('add', 'update', 'remove', 'import', 'ai'))
);

CREATE INDEX idx_materials_log_job_id ON materials_log(job_id);
CREATE INDEX idx_materials_log_user_id ON materials_log(user_id);

-- Time Sessions (Advanced time tracking)
CREATE TABLE time_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    started_at TIMESTAMPTZ NOT NULL,
    finished_at TIMESTAMPTZ,
    phase VARCHAR(50) NOT NULL DEFAULT 'IDLE',
    driving_seconds INT DEFAULT 0,
    onsite_seconds INT DEFAULT 0,
    away_seconds INT DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_manual BOOLEAN NOT NULL DEFAULT false,
    manual_notes VARCHAR(500),
    last_lat DOUBLE PRECISION,
    last_lng DOUBLE PRECISION,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_time_session_phase CHECK (phase IN ('IDLE', 'DRIVING', 'ONSITE', 'AWAY', 'MANUAL'))
);

CREATE INDEX idx_time_sessions_user_id ON time_sessions(user_id);
CREATE INDEX idx_time_sessions_job_id ON time_sessions(job_id);
CREATE INDEX idx_time_sessions_active ON time_sessions(user_id, is_active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_materials_catalog_updated_at BEFORE UPDATE ON materials_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_materials_updated_at BEFORE UPDATE ON job_materials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_labour_updated_at BEFORE UPDATE ON job_labour FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_job_time_entries_updated_at BEFORE UPDATE ON job_time_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_labour ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies allowing service role full access (for API routes)
CREATE POLICY "Service role has full access to profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to jobs" ON jobs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to materials_catalog" ON materials_catalog FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to job_materials" ON job_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to job_labour" ON job_labour FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to job_time_entries" ON job_time_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to job_photos" ON job_photos FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to suppliers" ON suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to invoices" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to materials_log" ON materials_log FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role has full access to time_sessions" ON time_sessions FOR ALL USING (true) WITH CHECK (true);
