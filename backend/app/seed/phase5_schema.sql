-- Farm2Fair Phase 5: FPO Aggregation Schema
-- Run via apply_phase5_schema.py

-- 1. FPOs Table
CREATE TABLE IF NOT EXISTS fpos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    registration_number TEXT,
    district TEXT DEFAULT 'Latur',
    state TEXT DEFAULT 'Maharashtra',
    contact_person TEXT,
    phone TEXT,
    total_members INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FPO Members Table
CREATE TABLE IF NOT EXISTS fpo_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpo_id UUID REFERENCES fpos(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    farmer_name TEXT NOT NULL,
    village TEXT,
    district TEXT DEFAULT 'Latur',
    phone TEXT,
    primary_crop TEXT DEFAULT 'Soybean',
    farm_size_acres NUMERIC DEFAULT 4.5,
    avatar_initials TEXT DEFAULT 'FM',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enhance Lots table for FPO Aggregation
ALTER TABLE lots ADD COLUMN IF NOT EXISTS is_aggregated BOOLEAN DEFAULT FALSE;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS fpo_id UUID REFERENCES fpos(id) ON DELETE SET NULL;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS fpo_member_id UUID REFERENCES fpo_members(id) ON DELETE SET NULL;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS parent_aggregated_lot_id UUID REFERENCES lots(id) ON DELETE SET NULL;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS member_count INT DEFAULT 1;

-- 4. FPO Transaction Members (per-member payout split breakdown)
CREATE TABLE IF NOT EXISTS fpo_transaction_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES lots(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES buyer_offers(id) ON DELETE SET NULL,
    fpo_member_id UUID REFERENCES fpo_members(id) ON DELETE SET NULL,
    farmer_name TEXT NOT NULL,
    contributed_quantity NUMERIC NOT NULL,
    share_percentage NUMERIC NOT NULL,
    price_per_quintal NUMERIC DEFAULT 0,
    share_amount NUMERIC DEFAULT 0,
    payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'escrow', 'paid')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE fpos ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpo_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE fpo_transaction_members ENABLE ROW LEVEL SECURITY;

-- Public Policies for Prototype Demo
DROP POLICY IF EXISTS "Allow public read fpos" ON fpos;
CREATE POLICY "Allow public read fpos" ON fpos FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert fpos" ON fpos;
CREATE POLICY "Allow public insert fpos" ON fpos FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update fpos" ON fpos;
CREATE POLICY "Allow public update fpos" ON fpos FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read fpo_members" ON fpo_members;
CREATE POLICY "Allow public read fpo_members" ON fpo_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert fpo_members" ON fpo_members;
CREATE POLICY "Allow public insert fpo_members" ON fpo_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update fpo_members" ON fpo_members;
CREATE POLICY "Allow public update fpo_members" ON fpo_members FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read fpo_transaction_members" ON fpo_transaction_members;
CREATE POLICY "Allow public read fpo_transaction_members" ON fpo_transaction_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert fpo_transaction_members" ON fpo_transaction_members;
CREATE POLICY "Allow public insert fpo_transaction_members" ON fpo_transaction_members FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update fpo_transaction_members" ON fpo_transaction_members;
CREATE POLICY "Allow public update fpo_transaction_members" ON fpo_transaction_members FOR UPDATE USING (true);

