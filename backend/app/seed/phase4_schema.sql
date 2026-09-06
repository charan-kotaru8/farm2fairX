-- Farm2Fair Phase 4: AI Intelligence Schema
-- Run this in Supabase Dashboard -> SQL Editor

-- AI Recommendations audit log
-- Every AI call (price recommendation or buyer match) is logged here
-- with frozen input/output snapshots for transparency and validation.
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('price_recommendation', 'buyer_match')),
    crop_id UUID REFERENCES crops(id),
    market_id UUID REFERENCES markets(id),       -- nullable for buyer_match
    lot_id UUID REFERENCES lots(id),             -- nullable for price recs
    input_snapshot JSONB NOT NULL DEFAULT '{}',   -- frozen inputs (prices, arrivals, signals)
    output_snapshot JSONB NOT NULL DEFAULT '{}',  -- full result (verdict, range, confidence, factors)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ai_recommendations ENABLE ROW LEVEL SECURITY;

-- Public read for prototype demo
CREATE POLICY "Allow public read ai_recommendations" ON ai_recommendations FOR SELECT USING (true);
CREATE POLICY "Allow public insert ai_recommendations" ON ai_recommendations FOR INSERT WITH CHECK (true);
