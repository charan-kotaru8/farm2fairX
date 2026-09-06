-- Farm2Fair Phase 6: Logistics & Storage Schema
-- Run via apply_phase6_schema.py

-- 1. Transport Providers Table
CREATE TABLE IF NOT EXISTS transport_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    provider_type TEXT DEFAULT 'Individual Trucker',
    vehicle_type TEXT NOT NULL,
    vehicle_number TEXT,
    capacity_quintals NUMERIC NOT NULL,
    base_fee NUMERIC DEFAULT 800,
    rate_per_km NUMERIC DEFAULT 35,
    rating NUMERIC DEFAULT 4.8,
    total_trips INT DEFAULT 42,
    phone TEXT,
    district TEXT DEFAULT 'Latur',
    state TEXT DEFAULT 'Maharashtra',
    lat NUMERIC DEFAULT 18.4088,
    lng NUMERIC DEFAULT 76.5604,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Transport Assignments Table
CREATE TABLE IF NOT EXISTS transport_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES lots(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES transport_providers(id) ON DELETE CASCADE,
    assigned_by_id UUID,
    pickup_address TEXT,
    delivery_address TEXT,
    pickup_lat NUMERIC DEFAULT 18.4088,
    pickup_lng NUMERIC DEFAULT 76.5604,
    delivery_lat NUMERIC DEFAULT 18.5204,
    delivery_lng NUMERIC DEFAULT 73.8567,
    estimated_distance_km NUMERIC NOT NULL DEFAULT 25.0,
    estimated_cost NUMERIC NOT NULL DEFAULT 1675.0,
    status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'pickup_scheduled', 'picked_up', 'in_transit', 'delivered')),
    scheduled_pickup_time TIMESTAMPTZ,
    picked_up_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Buyer-Owned Quality Verifications at Pickup Table
CREATE TABLE IF NOT EXISTS lot_quality_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id UUID REFERENCES lots(id) ON DELETE CASCADE,
    transport_assignment_id UUID REFERENCES transport_assignments(id) ON DELETE SET NULL,
    verifier_id UUID,
    verifier_name TEXT NOT NULL,
    verifier_role TEXT DEFAULT 'Buyer Inspector',
    declared_grade TEXT NOT NULL,
    verified_grade TEXT NOT NULL CHECK (verified_grade IN ('A', 'B', 'C')),
    declared_moisture_pct NUMERIC DEFAULT 10.0,
    verified_moisture_pct NUMERIC DEFAULT 9.8,
    declared_foreign_matter_pct NUMERIC DEFAULT 1.5,
    verified_foreign_matter_pct NUMERIC DEFAULT 1.2,
    grain_damage_pct NUMERIC DEFAULT 0.8,
    grade_matched BOOLEAN DEFAULT TRUE,
    notes TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Storage Facilities Table
CREATE TABLE IF NOT EXISTS storage_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    facility_type TEXT DEFAULT 'WDRA Certified Warehouse',
    district TEXT DEFAULT 'Latur',
    state TEXT DEFAULT 'Maharashtra',
    address TEXT,
    lat NUMERIC DEFAULT 18.4088,
    lng NUMERIC DEFAULT 76.5604,
    total_capacity_quintals NUMERIC NOT NULL DEFAULT 5000,
    available_capacity_quintals NUMERIC NOT NULL DEFAULT 2400,
    price_per_quintal_month NUMERIC NOT NULL DEFAULT 45,
    rating NUMERIC DEFAULT 4.7,
    features TEXT[] DEFAULT ARRAY['WDRA Certified', 'CCTV 24/7', 'Fumigation Control', 'Insurance Included'],
    is_available BOOLEAN DEFAULT TRUE,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Storage Bookings Table (Standalone or Lot-Attached)
CREATE TABLE IF NOT EXISTS storage_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_id UUID REFERENCES storage_facilities(id) ON DELETE CASCADE,
    farmer_id UUID,
    lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
    crop_id UUID REFERENCES crops(id),
    quantity_quintals NUMERIC NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months INT DEFAULT 1,
    monthly_rate_per_quintal NUMERIC NOT NULL,
    total_cost NUMERIC NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('requested', 'confirmed', 'active', 'completed', 'cancelled')),
    receipt_number TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enhance Lots table for Unified Status and Quality Parameters
ALTER TABLE lots ADD COLUMN IF NOT EXISTS pickup_lat NUMERIC DEFAULT 18.4088;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS pickup_lng NUMERIC DEFAULT 76.5604;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS pickup_address TEXT DEFAULT 'Farm Gate, Ausa, Latur';
ALTER TABLE lots ADD COLUMN IF NOT EXISTS declared_moisture_pct NUMERIC DEFAULT 10.0;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS declared_foreign_matter_pct NUMERIC DEFAULT 1.5;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS transport_assignment_id UUID;
ALTER TABLE lots ADD COLUMN IF NOT EXISTS storage_booking_id UUID;

-- 7. Update status constraint on lots to support unified transport statuses
ALTER TABLE lots DROP CONSTRAINT IF EXISTS lots_status_check;
ALTER TABLE lots ADD CONSTRAINT lots_status_check CHECK (status IN (
    'draft', 'active', 'offer_received', 'offer_accepted',
    'transport_assigned', 'pickup_scheduled', 'picked_up', 'in_transit', 'delivered', 'completed', 'pooled'
));

-- 8. Enable RLS
ALTER TABLE transport_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE transport_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lot_quality_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_bookings ENABLE ROW LEVEL SECURITY;

-- 9. Public Policies for Prototype Demo
DROP POLICY IF EXISTS "Allow public read transport_providers" ON transport_providers;
CREATE POLICY "Allow public read transport_providers" ON transport_providers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert transport_providers" ON transport_providers;
CREATE POLICY "Allow public insert transport_providers" ON transport_providers FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update transport_providers" ON transport_providers;
CREATE POLICY "Allow public update transport_providers" ON transport_providers FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read transport_assignments" ON transport_assignments;
CREATE POLICY "Allow public read transport_assignments" ON transport_assignments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert transport_assignments" ON transport_assignments;
CREATE POLICY "Allow public insert transport_assignments" ON transport_assignments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update transport_assignments" ON transport_assignments;
CREATE POLICY "Allow public update transport_assignments" ON transport_assignments FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read lot_quality_verifications" ON lot_quality_verifications;
CREATE POLICY "Allow public read lot_quality_verifications" ON lot_quality_verifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert lot_quality_verifications" ON lot_quality_verifications;
CREATE POLICY "Allow public insert lot_quality_verifications" ON lot_quality_verifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update lot_quality_verifications" ON lot_quality_verifications;
CREATE POLICY "Allow public update lot_quality_verifications" ON lot_quality_verifications FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read storage_facilities" ON storage_facilities;
CREATE POLICY "Allow public read storage_facilities" ON storage_facilities FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert storage_facilities" ON storage_facilities;
CREATE POLICY "Allow public insert storage_facilities" ON storage_facilities FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update storage_facilities" ON storage_facilities;
CREATE POLICY "Allow public update storage_facilities" ON storage_facilities FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read storage_bookings" ON storage_bookings;
CREATE POLICY "Allow public read storage_bookings" ON storage_bookings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert storage_bookings" ON storage_bookings;
CREATE POLICY "Allow public insert storage_bookings" ON storage_bookings FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update storage_bookings" ON storage_bookings;
CREATE POLICY "Allow public update storage_bookings" ON storage_bookings FOR UPDATE USING (true);
