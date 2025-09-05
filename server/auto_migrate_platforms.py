#!/usr/bin/env python3
"""
Auto-migration script that runs on startup or via API
This ensures the database schema is always up to date
"""

import os
import sys
from flask import Flask, jsonify
from sqlalchemy import text
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def check_and_run_platform_migration(app, db):
    """Check if platform migration is needed and run it"""
    try:
        with app.app_context():
            logger.info("Checking platform migration status...")
            
            # Check if Platform table exists
            platform_table_exists = db.engine.dialect.has_table(db.engine, 'platforms')
            logger.info(f"Platform table exists: {platform_table_exists}")
            
            # Check if platform_id column exists in user_games
            try:
                result = db.session.execute(text("""
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='user_games' AND column_name='platform_id'
                """)).fetchone()
                platform_column_exists = result is not None
                logger.info(f"platform_id column exists: {platform_column_exists}")
            except Exception as e:
                logger.warning(f"Could not check platform_id column: {e}")
                platform_column_exists = False
            
            migration_needed = not platform_table_exists or not platform_column_exists
            
            if migration_needed:
                logger.info("Running platform migration...")
                
                if not platform_table_exists:
                    logger.info("Creating Platform table...")
                    # Create all tables (this will create the new Platform table)
                    db.create_all()
                    logger.info("✅ Platform table created")
                
                if not platform_column_exists:
                    logger.info("Adding platform_id column to user_games table...")
                    try:
                        # Add the platform_id column to user_games table
                        db.session.execute(text("""
                            ALTER TABLE user_games 
                            ADD COLUMN platform_id INTEGER REFERENCES platforms(id)
                        """))
                        db.session.commit()
                        logger.info("✅ platform_id column added to user_games table")
                    except Exception as e:
                        logger.error(f"Failed to add platform_id column: {e}")
                        db.session.rollback()
                        return False
                
                logger.info("🎉 Platform migration completed successfully!")
                return True
            else:
                logger.info("✅ Platform migration not needed - schema is up to date")
                return True
                
    except Exception as e:
        logger.error(f"Platform migration failed: {e}")
        try:
            db.session.rollback()
        except:
            pass
        return False

def create_migration_endpoint(app, db):
    """Create an API endpoint to run migration manually"""
    
    @app.route('/api/admin/run-platform-migration', methods=['POST'])
    def run_platform_migration():
        """Manual migration endpoint"""
        try:
            success = check_and_run_platform_migration(app, db)
            if success:
                return jsonify({
                    'success': True,
                    'message': 'Platform migration completed successfully'
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'message': 'Platform migration failed'
                }), 500
        except Exception as e:
            return jsonify({
                'success': False,
                'message': f'Migration error: {str(e)}'
            }), 500

if __name__ == "__main__":
    # This can be run standalone
    sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from app import create_app, db
    
    app = create_app()
    success = check_and_run_platform_migration(app, db)
    if success:
        print("✅ Migration completed successfully!")
        sys.exit(0)
    else:
        print("❌ Migration failed!")
        sys.exit(1)
