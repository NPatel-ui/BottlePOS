-- ==============================================================================
-- BOTTLEPOS — FULL SUPABASE POSTGRESQL SCHEMA & INITIAL DATA
-- ==============================================================================
-- Run this script in your Supabase Dashboard:
-- 1. Go to https://supabase.com -> Open your project
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New query", paste this entire script, and click "Run"
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ORGANIZATIONS & STORES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS organizations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 2. EMPLOYEES & STAFF
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS employees (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'CASHIER',
    password_hash TEXT,
    active_status BOOLEAN DEFAULT true,
    permissions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_org_store ON employees(organization_id, store_id);

CREATE TABLE IF NOT EXISTS email_verifications (
    email TEXT PRIMARY KEY,
    code TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    is_verified BOOLEAN DEFAULT false
);

-- -----------------------------------------------------------------------------
-- 3. POS REGISTERS & TERMINALS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pos_registers (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    pin TEXT NOT NULL DEFAULT '1234',
    location TEXT DEFAULT 'Main Counter',
    device_type TEXT DEFAULT 'Touchscreen Counter Terminal',
    opening_float NUMERIC(10, 2) DEFAULT 200.00,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registers_org_store ON pos_registers(organization_id, store_id);

-- -----------------------------------------------------------------------------
-- 4. PRODUCTS & LIQUOR CATALOG
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    brand TEXT,
    category TEXT NOT NULL DEFAULT 'Spirits',
    subcategory TEXT,
    description TEXT,
    size TEXT DEFAULT '750ml',
    unit TEXT DEFAULT 'bottle',
    bottle_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    case_price NUMERIC(10, 2),
    pack_price NUMERIC(10, 2),
    tax_category TEXT DEFAULT 'STANDARD',
    alcohol_category TEXT DEFAULT 'LIQUOR',
    active_status BOOLEAN DEFAULT true,
    age_restricted BOOLEAN DEFAULT true,
    reorder_threshold INT DEFAULT 5,
    preferred_vendor_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_org_store ON products(organization_id, store_id);

-- -----------------------------------------------------------------------------
-- 5. INVENTORY & STOCK TRACKING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity_bottles INT NOT NULL DEFAULT 0,
    quantity_packs INT NOT NULL DEFAULT 0,
    quantity_cases INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_product_store ON inventory(store_id, product_id);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    quantity_bottles_change INT NOT NULL DEFAULT 0,
    quantity_packs_change INT NOT NULL DEFAULT 0,
    quantity_cases_change INT NOT NULL DEFAULT 0,
    employee_id TEXT NOT NULL,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 6. SHIFTS & CASH DRAWER EVENTS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shifts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id),
    opening_cash NUMERIC(10, 2) NOT NULL DEFAULT 200.00,
    closing_cash NUMERIC(10, 2),
    expected_cash NUMERIC(10, 2),
    cash_variance NUMERIC(10, 2),
    status TEXT NOT NULL DEFAULT 'OPEN',
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cash_drawer_events (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shift_id TEXT NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id),
    event_type TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    reference_id TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 7. TRANSACTIONS & SALES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL REFERENCES employees(id),
    shift_id TEXT REFERENCES shifts(id),
    customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING',
    subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    change_due NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    void_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_org_store ON transactions(organization_id, store_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

CREATE TABLE IF NOT EXISTS transaction_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    item_type TEXT NOT NULL DEFAULT 'BOTTLE',
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    original_price NUMERIC(10, 2),
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_reason TEXT,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    is_voided BOOLEAN DEFAULT false,
    is_refunded BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tx_items_transaction_id ON transaction_items(transaction_id);

CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'CASH',
    status TEXT NOT NULL DEFAULT 'COMPLETED',
    reference_id TEXT,
    card_last_four TEXT,
    card_brand TEXT,
    auth_code TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 8. CUSTOMERS & LOYALTY
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT,
    phone TEXT,
    loyalty_points INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 9. VENDORS & PURCHASING
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    active_status BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    vendor_id TEXT NOT NULL REFERENCES vendors(id),
    employee_id TEXT NOT NULL REFERENCES employees(id),
    status TEXT NOT NULL DEFAULT 'DRAFT',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ordered_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS purchase_order_items (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    po_id TEXT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id),
    expected_quantity INT NOT NULL DEFAULT 1,
    expected_cost NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    received_quantity INT NOT NULL DEFAULT 0
);

-- -----------------------------------------------------------------------------
-- 10. SHIELD AI FRAUD & LOSS PREVENTION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS shield_alerts (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    alert_type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    risk_score INT NOT NULL DEFAULT 50,
    severity TEXT NOT NULL DEFAULT 'MODERATE',
    employee_id TEXT,
    reasons JSONB DEFAULT '[]'::jsonb,
    related_events JSONB DEFAULT '[]'::jsonb,
    related_transactions JSONB DEFAULT '[]'::jsonb,
    potential_exposure NUMERIC(10, 2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shield_investigations (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    alert_id TEXT NOT NULL REFERENCES shield_alerts(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    outcome TEXT,
    notes JSONB DEFAULT '[]'::jsonb,
    resolved_by_employee_id TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -----------------------------------------------------------------------------
-- 11. AUDIT TRAIL LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    organization_id TEXT NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id TEXT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    before_state JSONB,
    after_state JSONB,
    metadata JSONB,
    request_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- -----------------------------------------------------------------------------
-- 12. ENABLE REALTIME & ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------
-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_drawer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shield_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE shield_investigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Allow service_role key full access to all tables (for FastAPI backend operations)
CREATE POLICY "service_role_org" ON organizations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_stores" ON stores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_employees" ON employees FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_registers" ON pos_registers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_products" ON products FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_inventory" ON inventory FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_inv_tx" ON inventory_transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_shifts" ON shifts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_drawer" ON cash_drawer_events FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_tx" ON transactions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_tx_items" ON transaction_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_payments" ON payments FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_customers" ON customers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_vendors" ON vendors FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_po" ON purchase_orders FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_po_items" ON purchase_order_items FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_shield" ON shield_alerts FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_shield_inv" ON shield_investigations FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_audit" ON audit_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_email_verifications" ON email_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow anon and authenticated users read/write for local POS operations
CREATE POLICY "public_read_registers" ON pos_registers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_write_registers" ON pos_registers FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "public_read_products" ON products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "public_read_inventory" ON inventory FOR SELECT TO anon, authenticated USING (true);

-- Enable Supabase Realtime for live POS synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE pos_registers;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE shield_alerts;

-- -----------------------------------------------------------------------------
-- 13. SEED DEFAULT STORE DATA
-- -----------------------------------------------------------------------------
INSERT INTO organizations (id, name)
VALUES ('org_default', 'BottlePOS Liquors Inc.')
ON CONFLICT (id) DO NOTHING;

INSERT INTO stores (id, organization_id, name, address, phone)
VALUES ('store_default', 'org_default', 'Downtown Spirits & Wine', '101 Main St, Suite 4', '+1-555-0199')
ON CONFLICT (id) DO NOTHING;

-- Initial default POS register
INSERT INTO pos_registers (id, organization_id, store_id, name, pin, location, device_type, opening_float, status)
VALUES ('REG-101', 'org_default', 'store_default', 'Counter 1 - Front Lane', '1234', 'Front Checkout Lanes', 'Touchscreen Counter Terminal', 200.00, 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample popular products for immediate testing
INSERT INTO products (id, organization_id, store_id, sku, barcode, name, brand, category, subcategory, bottle_price, cost, size, unit)
VALUES 
  ('prod_jd_01', 'org_default', 'store_default', 'SKU-JD-750', '082184090466', 'Jack Daniels Old No. 7 Tennessee Whiskey', 'Jack Daniels', 'Spirits', 'Whiskey', 32.99, 21.50, '750ml', 'bottle'),
  ('prod_gw_01', 'org_default', 'store_default', 'SKU-JW-BLK', '088076161116', 'Johnnie Walker Black Label Scotch', 'Johnnie Walker', 'Spirits', 'Scotch', 42.99, 28.00, '750ml', 'bottle'),
  ('prod_tl_01', 'org_default', 'store_default', 'SKU-TITOS-1L', '619947000020', 'Titos Handmade Vodka 1.0L', 'Titos', 'Spirits', 'Vodka', 29.99, 18.50, '1L', 'bottle'),
  ('prod_cb_01', 'org_default', 'store_default', 'SKU-CR-01', '087000003011', 'Caymus Napa Valley Cabernet Sauvignon', 'Caymus', 'Wine', 'Red Wine', 89.99, 58.00, '750ml', 'bottle'),
  ('prod_vc_01', 'org_default', 'store_default', 'SKU-VC-BRUT', '3049610004104', 'Veuve Clicquot Yellow Label Brut Champagne', 'Veuve Clicquot', 'Wine', 'Champagne', 68.99, 44.00, '750ml', 'bottle'),
  ('prod_cr_01', 'org_default', 'store_default', 'SKU-COR-6PK', '080660956157', 'Corona Extra Beer 6-Pack Bottles', 'Corona', 'Beer', 'Lager', 12.99, 8.20, '6x355ml', 'pack')
ON CONFLICT (id) DO NOTHING;

-- Seed inventory for the sample products
INSERT INTO inventory (organization_id, store_id, product_id, quantity_bottles, quantity_packs, quantity_cases)
VALUES
  ('org_default', 'store_default', 'prod_jd_01', 48, 0, 4),
  ('org_default', 'store_default', 'prod_gw_01', 36, 0, 3),
  ('org_default', 'store_default', 'prod_tl_01', 60, 0, 5),
  ('org_default', 'store_default', 'prod_cb_01', 24, 0, 2),
  ('org_default', 'store_default', 'prod_vc_01', 18, 0, 1),
  ('org_default', 'store_default', 'prod_cr_01', 0, 40, 6)
ON CONFLICT DO NOTHING;
