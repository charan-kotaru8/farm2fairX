"""
Create tables in Supabase via the REST API using raw SQL.
Run this BEFORE the seed script.

Usage: cd backend && .\venv\Scripts\python.exe -m app.seed.create_tables
"""
from app.core.supabase_client import get_supabase_admin


def create_tables():
    sb = get_supabase_admin()

    sql_statements = [
        # Profiles table (extends Supabase auth.users)
        """
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
        """,

        # Crops table
        """
        CREATE TABLE IF NOT EXISTS crops (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT UNIQUE NOT NULL,
            category TEXT,
            unit TEXT DEFAULT 'quintal',
            icon TEXT DEFAULT '🌾',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        """,

        # Markets table
        """
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
        """,

        # Market prices table
        """
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
        """,

        # Market arrivals table
        """
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
        """,

        # Lots table
        """
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
        """,

        # Enable Row Level Security (but allow all for prototype)
        "ALTER TABLE crops ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE markets ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE market_arrivals ENABLE ROW LEVEL SECURITY;",
        "ALTER TABLE lots ENABLE ROW LEVEL SECURITY;",

        # Public read policies
        """CREATE POLICY IF NOT EXISTS "Allow public read crops" ON crops FOR SELECT USING (true);""",
        """CREATE POLICY IF NOT EXISTS "Allow public read markets" ON markets FOR SELECT USING (true);""",
        """CREATE POLICY IF NOT EXISTS "Allow public read market_prices" ON market_prices FOR SELECT USING (true);""",
        """CREATE POLICY IF NOT EXISTS "Allow public read market_arrivals" ON market_arrivals FOR SELECT USING (true);""",
        """CREATE POLICY IF NOT EXISTS "Allow public read lots" ON lots FOR SELECT USING (true);""",
        """CREATE POLICY IF NOT EXISTS "Allow insert lots" ON lots FOR INSERT WITH CHECK (true);""",
        """CREATE POLICY IF NOT EXISTS "Allow update lots" ON lots FOR UPDATE USING (true);""",
    ]

    for sql in sql_statements:
        try:
            sb.rpc("exec_sql", {"query": sql}).execute()
            print(f"✓ Executed: {sql[:60].strip()}...")
        except Exception as e:
            # RPC may not exist, try postgrest
            print(f"⚠ RPC not available, will use Supabase Dashboard SQL editor instead.")
            print(f"  Statement: {sql[:80].strip()}...")
            break

    print("\n⚠ If the RPC method failed, please run the SQL below in Supabase Dashboard → SQL Editor:")
    print("=" * 60)
    for sql in sql_statements:
        print(sql)
    print("=" * 60)


if __name__ == "__main__":
    create_tables()
