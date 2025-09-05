#!/usr/bin/env python3
"""
Production migration script for Railway PostgreSQL
Run this to update your Railway database schema
"""

import os
import sys

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Platform, UserGame
from sqlalchemy import text

def run_production_migration():
    """Add Platform table and platform_id column to UserGame table in production"""
    print("Starting PRODUCTION migration: Add Platform model and platform_id to UserGame")
    
    # Set environment for production
    os.environ['FLASK_ENV'] = 'production'
    
    app = create_app()
    with app.app_context():
        try:
            print("Connected to database:", app.config['SQLALCHEMY_DATABASE_URI'][:50] + "...")
            
            # Check if Platform table exists
            platform_table_exists = db.engine.dialect.has_table(db.engine, 'platforms')
            print(f"Platform table exists: {platform_table_exists}")
            
            # Check if platform_id column exists in user_games
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='user_games' AND column_name='platform_id'
            """)).fetchone()
            platform_column_exists = result is not None
            print(f"platform_id column exists: {platform_column_exists}")
            
            if not platform_table_exists:
                print("Creating Platform table...")
                # Create all tables (this will create the new Platform table)
                db.create_all()
                print("✅ Platform table created")
            else:
                print("✅ Platform table already exists")
            
            if not platform_column_exists:
                print("Adding platform_id column to user_games table...")
                # Add the platform_id column to user_games table
                db.session.execute(text("""
                    ALTER TABLE user_games 
                    ADD COLUMN platform_id INTEGER REFERENCES platforms(id)
                """))
                db.session.commit()
                print("✅ platform_id column added to user_games table")
            else:
                print("✅ platform_id column already exists")
            
            print("\n🎉 Production migration completed successfully!")
            print("\nNext steps:")
            print("1. Call POST /api/platforms/sync-from-api to populate platforms from Giant Bomb API")
            print("2. Users can now select platforms when editing games in their library")
            
        except Exception as e:
            print(f"❌ Migration failed: {e}")
            db.session.rollback()
            return False
    
    return True

if __name__ == "__main__":
    success = run_production_migration()
    if not success:
        sys.exit(1)
    print("🎉 Production migration completed successfully!")
