#!/usr/bin/env python3
"""
Migration script to change platform_id column from integer to string
"""
import sys
import os

# Add the server directory to the path
sys.path.insert(0, os.path.join(os.path.abspath(os.path.dirname(__file__)), 'server'))

from app import create_app, db

def migrate_platform_id():
    """Change platform_id column from integer to string"""
    app = create_app()
    
    with app.app_context():
        try:
            # Drop the foreign key constraint first
            print("Dropping foreign key constraint...")
            db.engine.execute('ALTER TABLE user_games DROP CONSTRAINT IF EXISTS user_games_platform_id_fkey;')
            
            # Change the column type from integer to varchar(50)
            print("Changing platform_id column type to VARCHAR(50)...")
            db.engine.execute('ALTER TABLE user_games ALTER COLUMN platform_id TYPE VARCHAR(50);')
            
            # Clear existing platform_id values since they were integers and we need GUIDs
            print("Clearing existing platform_id values...")
            db.engine.execute('UPDATE user_games SET platform_id = NULL;')
            
            print("Migration completed successfully!")
            
        except Exception as e:
            print(f"Migration failed: {e}")
            print("This might be expected if the database doesn't have the foreign key constraint.")
            
            # Try just changing the column type
            try:
                print("Trying to change column type only...")
                db.engine.execute('ALTER TABLE user_games ALTER COLUMN platform_id TYPE VARCHAR(50);')
                db.engine.execute('UPDATE user_games SET platform_id = NULL;')
                print("Column type change completed successfully!")
            except Exception as e2:
                print(f"Column type change also failed: {e2}")
                return False
                
        return True

if __name__ == '__main__':
    success = migrate_platform_id()
    sys.exit(0 if success else 1)
