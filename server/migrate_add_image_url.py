#!/usr/bin/env python3
"""
Migration script to add image_url column to user_games table
"""
import sqlite3
import os

def migrate_database():
    """Add image_url column to user_games table"""
    
    # Database path
    db_path = os.path.join('instance', 'game_library.db')
    
    if not os.path.exists(db_path):
        print("Database not found. Creating new database with updated schema.")
        return
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(user_games)")
        columns = [row[1] for row in cursor.fetchall()]
        
        if 'image_url' not in columns:
            print("Adding image_url column to user_games table...")
            cursor.execute('''
                ALTER TABLE user_games 
                ADD COLUMN image_url VARCHAR(500)
            ''')
            
            # Update existing records with image_url from games table
            print("Updating existing records with image URLs...")
            cursor.execute('''
                UPDATE user_games 
                SET image_url = (
                    SELECT games.image_url 
                    FROM games 
                    WHERE games.id = user_games.game_id
                )
                WHERE user_games.image_url IS NULL
            ''')
            
            conn.commit()
            print("Migration completed successfully!")
        else:
            print("Column image_url already exists in user_games table.")
        
        conn.close()
        
    except Exception as e:
        print(f"Migration failed: {str(e)}")
        if conn:
            conn.rollback()
            conn.close()

if __name__ == '__main__':
    migrate_database()
