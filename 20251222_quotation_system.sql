-- Create app_settings table for global configuration
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Seed initial settings
INSERT INTO app_settings (key, value, description)
VALUES (
        'quotation.default_terms',
        '"ระยะเวลาการส่งสินค้า 7-14 วันหลังวางมัดจำ 50%. การรับประกันสินค้า 1 ปีตามเงื่อนไขของผู้ผลิต. ราคานี้ยังไม่รวมค่าขนส่ง (ถ้ามี) เว้นแต่ระบุไว้เป็นอย่างอื่น."',
        'Default terms and conditions for new quotations'
    ),
    (
        'quotation.warranty_policy',
        '"รับประกันสินค้า 1 ปี นับจากวันที่ส่งมอบสินค้า การรับประกันไม่ครอบคลุมความเสียหายที่เกิดจากการใช้งานผิดประเภท อุบัติเหตุ ภัยธรรมชาติ"',
        'Standard warranty policy text'
    ),
    (
        'company.primary_address',
        '"เลขที่ 168/166 หมู่ 1 หมู่บ้านเซนโทร พหล-วิภาวดี2 ตำบลคลองหนึ่ง อำเภอคลองหลวง จังหวัดปทุมธานี 12120"',
        'Primary company address for documents'
    ) ON CONFLICT (key) DO NOTHING;
-- Create quotations table to store persistent quotation data linked to orders
CREATE TABLE IF NOT EXISTS quotations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE UNIQUE NOT NULL,
    -- One quotation per order for simplicity
    quotation_number TEXT UNIQUE NOT NULL,
    discount_value NUMERIC DEFAULT 0,
    discount_type TEXT DEFAULT 'percent',
    -- 'percent' or 'amount'
    deposit_percent NUMERIC DEFAULT 50,
    valid_until DATE,
    terms TEXT,
    -- Snapshot of terms for this specific quote
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_quotations_order_id ON quotations(order_id);
CREATE INDEX IF NOT EXISTS idx_quotations_quotation_number ON quotations(quotation_number);
-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ language 'plpgsql';
CREATE TRIGGER update_app_settings_modtime BEFORE
UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quotations_modtime BEFORE
UPDATE ON quotations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();