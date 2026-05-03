"""
Script de inițializare a bazei de date.

Creează tabelele users și training_sessions în baza de date SQLite.
Rulează o singură dată la început.
"""

import sys
sys.path.insert(0, '.')

# IMPORTANT: Import models BEFORE calling init_db()
# so SQLAlchemy knows about them
from database import init_db, Base
from app.models.orm import User, TrainingSession

if __name__ == "__main__":
    print("🔧 Inițializez baza de date...")
    try:
        init_db()
        print("✓ Baza de date a fost creată cu succes!")
        print("  - Tabelul 'users' creat")
        print("  - Tabelul 'training_sessions' creat")
        print("\nFișier: ml_app.db")
    except Exception as e:
        print(f"✗ Eroare la crearea bazei de date: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
