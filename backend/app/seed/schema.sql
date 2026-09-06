-- Farm2Fair Phase 2: Database Schema
-- Run this in Supabase Dashboard -> SQL Editor

-- Profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    role TEXT DEFAULT 'farmer' CHECK (role IN ('farmer', 'buyer', 'fpo', 'admin')),
    phone TEXT,
    district TEXT,
    primary_crop TEXT,
    farm_size_acres NUMERIC,
    fpo_id UUID,
    profile_completion INT DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crops table
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    category TEXT,
    unit TEXT DEFAULT 'quintal',
    icon TEXT DEFAULT '🌾',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Markets table
CREATE TABLE IF NOT EXISTS markets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    district TEXT,
    state TEXT DEFAULT 'Maharashtra',
    lat NUMERIC,
    lng NUMERIC,
    type TEXT DEFAULT 'APMC',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Market prices table
CREATE TABLE IF NOT EXISTS market_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id UUID REFERENCES crops(id),
    market_id UUID REFERENCES markets(id),
    date DATE NOT NULL,
    min_price NUMERIC,
    max_price NUMERIC,
    modal_price NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crop_id, market_id, date)
);

-- Market arrivals table
CREATE TABLE IF NOT EXISTS market_arrivals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crop_id UUID REFERENCES crops(id),
    market_id UUID REFERENCES markets(id),
    date DATE NOT NULL,
    quantity NUMERIC,
    demand_level TEXT DEFAULT 'Medium' CHECK (demand_level IN ('Low', 'Medium', 'High')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(crop_id, market_id, date)
);

-- Lots table
CREATE TABLE IF NOT EXISTS lots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID,
    crop_id UUID REFERENCES crops(id),
    quantity NUMERIC NOT NULL,
    quality_grade TEXT DEFAULT 'A' CHECK (quality_grade IN ('A', 'B', 'C')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'offer_received', 'offer_accepted', 'pickup_scheduled', 'delivered', 'completed')),
    harvest_date DATE,
    available_from DATE,
    available_until DATE,
    storage_required BOOLEAN DEFAULT FALSE,
    description TEXT,
    photos TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE markets ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_arrivals ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Allow public read crops" ON crops FOR SELECT USING (true);
CREATE POLICY "Allow public read markets" ON markets FOR SELECT USING (true);
CREATE POLICY "Allow public read market_prices" ON market_prices FOR SELECT USING (true);
CREATE POLICY "Allow public read market_arrivals" ON market_arrivals FOR SELECT USING (true);
CREATE POLICY "Allow public read lots" ON lots FOR SELECT USING (true);
CREATE POLICY "Allow insert lots" ON lots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update lots" ON lots FOR UPDATE USING (true);
CREATE POLICY "Allow insert profiles" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Allow update profiles" ON profiles FOR UPDATE USING (true);

-- Enable RLS on profiles too
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
