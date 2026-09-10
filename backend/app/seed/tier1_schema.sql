-- Farm2Fair Tier 1: FPO Join Requests Schema
CREATE TABLE IF NOT EXISTS fpo_join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fpo_id UUID REFERENCES fpos(id) ON DELETE CASCADE,
    farmer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    farmer_name TEXT NOT NULL,
    phone TEXT,
    village TEXT,
    district TEXT DEFAULT 'Latur',
    primary_crop TEXT DEFAULT 'Soybean',
    farm_size_acres NUMERIC DEFAULT 0,
    notes TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by TEXT,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure profiles table has fpo_id column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fpo_id UUID REFERENCES fpos(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE fpo_join_requests ENABLE ROW LEVEL SECURITY;

-- Policies for Prototype Demo
DROP POLICY IF EXISTS "Allow public read fpo_join_requests" ON fpo_join_requests;
CREATE POLICY "Allow public read fpo_join_requests" ON fpo_join_requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert fpo_join_requests" ON fpo_join_requests;
CREATE POLICY "Allow public insert fpo_join_requests" ON fpo_join_requests FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update fpo_join_requests" ON fpo_join_requests;
CREATE POLICY "Allow public update fpo_join_requests" ON fpo_join_requests FOR UPDATE USING (true);
