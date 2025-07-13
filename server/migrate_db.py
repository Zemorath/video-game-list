#!/usr/bin/env python3
"""
Database migration script to update Game table structure
Run this script to add new columns to existing Game table
"""

import sys
import os

# Add the server directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from sqlalchemy import text
import json

def migrate_database():
    """Add new columns to Game table if they don't exist"""
    app = create_app()
    
    with app.app_context():
        try:
            # Check what columns already exist
            with db.engine.connect() as conn:
                result = conn.execute(text("PRAGMA table_info(games)"))
                existing_columns = {row[1] for row in result}
            
            print(f"Existing columns in games table: {existing_columns}")
            
            # Define new columns to add
            new_columns = {
                'expected_release_year': 'INTEGER',
                'expected_release_quarter': 'INTEGER', 
                'expected_release_month': 'INTEGER',
                'expected_release_day': 'INTEGER',
                'icon_url': 'VARCHAR(500)',
                'small_url': 'VARCHAR(500)',
                'super_url': 'VARCHAR(500)',
                'screen_url': 'VARCHAR(500)',
                'screen_large_url': 'VARCHAR(500)',
                'tiny_url': 'VARCHAR(500)',
                'developers': 'JSON',
                'publishers': 'JSON', 
                'franchises': 'JSON',
                'concepts': 'JSON',
                'themes': 'JSON',
                'api_detail_url': 'VARCHAR(500)',
                'original_game_rating': 'JSON',
                'date_added': 'VARCHAR(30)',
                'date_last_updated': 'VARCHAR(30)'
            }
            
            # Add missing columns
            columns_added = 0
            with db.engine.connect() as conn:
                for column_name, column_type in new_columns.items():
                    if column_name not in existing_columns:
                        try:
                            alter_sql = f"ALTER TABLE games ADD COLUMN {column_name} {column_type}"
                            conn.execute(text(alter_sql))
                            conn.commit()
                            print(f"Added column: {column_name}")
                            columns_added += 1
                        except Exception as e:
                            print(f"Error adding column {column_name}: {e}")
            
            if columns_added == 0:
                print("No new columns needed - database is up to date!")
            else:
                print(f"Successfully added {columns_added} new columns to games table")
                
        except Exception as e:
            print(f"Migration error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == '__main__':
    migrate_database()
