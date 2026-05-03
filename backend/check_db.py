import sqlite3
import os

db_path = 'ml_app.db'

if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    conn.close()
    
    if tables:
        print("✓ Database exists and contains tables:")
        for table in tables:
            print(f"  - {table[0]}")
    else:
        print("✗ Database exists but is EMPTY (no tables created yet)")
else:
    print("✗ Database file does not exist yet")
