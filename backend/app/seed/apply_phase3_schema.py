"""Apply Phase 3 schema to Supabase Postgres database."""
import psycopg2
from app.core.config import settings

def apply_schema():
    print("Connecting to Supabase PostgreSQL...")
    conn = psycopg2.connect(settings.DATABASE_URL)
    conn.autocommit = True
    cur = conn.cursor()
    
    with open("app/seed/phase3_schema.sql", "r", encoding="utf-8") as f:
        sql = f.read()
    
    print("Executing phase3_schema.sql...")
    cur.execute(sql)
    print("Phase 3 schema applied successfully!")
    cur.close()
    conn.close()

if __name__ == "__main__":
    apply_schema()
