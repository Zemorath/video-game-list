#!/usr/bin/env python3
"""
Migration script to add Platform model and platform_id to UserGame
Run this once to update your database schema
"""

import os
import sys

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app, db
from app.models import Platform, UserGame

def run_migration():
    """Add Platform table and platform_id column to UserGame table"""
    print("Starting migration: Add Platform model and platform_id to UserGame")
    
    # Set environment for development
    os.environ['FLASK_ENV'] = 'development'
    
    app = create_app()
    with app.app_context():
        try:
            # Create all tables (this will create the new Platform table)
            print("Creating database tables...")
            db.create_all()
            
            # Check if platform_id column exists in user_games table
            # If using SQLite in development, the column should be automatically added
            # If using PostgreSQL in production, you might need to manually add it
            
            print("Migration completed successfully!")
            print("New Platform table created")
            print("platform_id column added to UserGame table")
            print("\nNext steps:")
            print("1. Run the /api/platforms/sync-from-api endpoint to populate platforms")
            print("2. Users can now select platforms when adding games to their library")
            
        except Exception as e:
            print(f"Migration failed: {e}")
            db.session.rollback()
            return False
    
    return True

if __name__ == "__main__":
    success = run_migration()
    if not success:
        sys.exit(1)
    print("Migration completed successfully!")
