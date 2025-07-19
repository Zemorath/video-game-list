"""
Migration script to add the follows table for user following functionality
"""

import sqlite3
import os

def migrate():
    # Database path
    db_path = os.path.join(os.path.dirname(__file__), 'instance', 'game_library.db')
    
    # Connect to database
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if follows table already exists
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='follows'")
        if cursor.fetchone():
            print("Follows table already exists")
            return
        
        # Create follows table
        cursor.execute('''
            CREATE TABLE follows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                follower_id INTEGER NOT NULL,
                followed_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (follower_id) REFERENCES users (id),
                FOREIGN KEY (followed_id) REFERENCES users (id),
                UNIQUE (follower_id, followed_id)
            )
        ''')
        
        # Create indexes for better performance
        cursor.execute('CREATE INDEX idx_follows_follower ON follows (follower_id)')
        cursor.execute('CREATE INDEX idx_follows_followed ON follows (followed_id)')
        
        # Commit changes
        conn.commit()
        print("Successfully created follows table with indexes")
        
    except Exception as e:
        print(f"Error during migration: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    migrate()
