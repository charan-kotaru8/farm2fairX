-- Farm2Fair Phase 7: Admin & Grievances Schema
-- Run via apply_phase7_schema.py

-- 1. Grievances Table (§7.2, §7.3, §7.6)
CREATE TABLE IF NOT EXISTS grievances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_role TEXT DEFAULT 'farmer' CHECK (user_role IN ('farmer', 'buyer', 'fpo')),
    user_phone TEXT,
    lot_id UUID REFERENCES lots(id) ON DELETE SET NULL,
    offer_id UUID REFERENCES buyer_offers(id) ON DELETE SET NULL,
    category TEXT NOT NULL CHECK (category IN ('Delayed Payment', 'Quality Dispute', 'Pickup Delay', 'Price Mismatch', 'Platform Issue')),
    subject TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_review', 'resolved', 'rejected')),
    sla_deadline TIMESTAMPTZ NOT NULL,
    resolution_notes TEXT,
    resolved_by TEXT,
    resolved_at TIMESTAMPTZ,
    satisfaction_rating INT CHECK (satisfaction_rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Notifications Table (§7.5)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    category TEXT DEFAULT 'transaction' CHECK (category IN ('transaction', 'verification', 'price_alert', 'grievance', 'system')),
    link_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE grievances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Public Policies for Prototype Demo
DROP POLICY IF EXISTS "Allow public read grievances" ON grievances;
CREATE POLICY "Allow public read grievances" ON grievances FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert grievances" ON grievances;
CREATE POLICY "Allow public insert grievances" ON grievances FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update grievances" ON grievances;
CREATE POLICY "Allow public update grievances" ON grievances FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public read notifications" ON notifications;
CREATE POLICY "Allow public read notifications" ON notifications FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow public insert notifications" ON notifications;
CREATE POLICY "Allow public insert notifications" ON notifications FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update notifications" ON notifications;
CREATE POLICY "Allow public update notifications" ON notifications FOR UPDATE USING (true);
