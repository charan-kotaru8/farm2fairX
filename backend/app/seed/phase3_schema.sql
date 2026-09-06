-- Farm2Fair Phase 3: Buyer Marketplace & Verification Schema
-- Run this in Supabase Dashboard -> SQL Editor

-- 1. Buyers table
CREATE TABLE IF NOT EXISTS buyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    business_name TEXT NOT NULL,
    business_type TEXT DEFAULT 'Trader',
    gst_number TEXT,
    pan_number TEXT,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    city TEXT,
    district TEXT DEFAULT 'Pune',
    state TEXT DEFAULT 'Maharashtra',
    
    -- Verification fields (Locked specs)
    verification_tier TEXT DEFAULT 'basic' CHECK (verification_tier IN ('basic', 'verified', 'trusted_partner')),
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'more_info_requested', 'approved', 'rejected')),
    admin_note TEXT,
    
    -- Checklist items
    business_info_verified BOOLEAN DEFAULT FALSE,
    location_verified BOOLEAN DEFAULT FALSE,
    document_verified BOOLEAN DEFAULT FALSE,
    
    -- Earned metrics for Trusted Partner
    completed_transactions INT DEFAULT 0,
    avg_rating NUMERIC DEFAULT 0.0,
    
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buyer requirements table
CREATE TABLE IF NOT EXISTS buyer_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES crops(id),
    quantity_quintals NUMERIC NOT NULL,
    quality_grade TEXT DEFAULT 'A' CHECK (quality_grade IN ('A', 'B', 'C')),
    preferred_district TEXT DEFAULT 'Any',
    max_price_per_quintal NUMERIC,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'fulfilled', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Buyer offers table
CREATE TABLE IF NOT EXISTS buyer_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES lots(id) ON DELETE CASCADE,
    buyer_id UUID REFERENCES buyers(id) ON DELETE CASCADE,
    price_per_quintal NUMERIC NOT NULL,
    offered_quantity NUMERIC NOT NULL,
    payment_terms TEXT DEFAULT 'Immediate UPI' CHECK (payment_terms IN ('Immediate UPI', 'Escrow on delivery', 'Net 7 Days', 'Advance 50%')),
    pickup_terms TEXT DEFAULT 'Farmgate Pickup' CHECK (pickup_terms IN ('Farmgate Pickup', 'Delivered to APMC', 'Buyer Warehouse')),
    valid_until DATE,
    notes TEXT,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'accepted', 'rejected', 'expired')),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_offers ENABLE ROW LEVEL SECURITY;

-- Public policies for prototype demo
CREATE POLICY "Allow public read buyers" ON buyers FOR SELECT USING (true);
CREATE POLICY "Allow public insert buyers" ON buyers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update buyers" ON buyers FOR UPDATE USING (true);

CREATE POLICY "Allow public read buyer_requirements" ON buyer_requirements FOR SELECT USING (true);
CREATE POLICY "Allow public insert buyer_requirements" ON buyer_requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update buyer_requirements" ON buyer_requirements FOR UPDATE USING (true);

CREATE POLICY "Allow public read buyer_offers" ON buyer_offers FOR SELECT USING (true);
CREATE POLICY "Allow public insert buyer_offers" ON buyer_offers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update buyer_offers" ON buyer_offers FOR UPDATE USING (true);
