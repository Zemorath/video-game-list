#!/usr/bin/env python3
"""
Simple script to populate platforms table from Giant Bomb API
Run this with: railway run python3 populate_platforms.py
"""

import os
import requests
import psycopg2
from urllib.parse import urlparse

def populate_platforms():
    # Get database URL from Railway environment
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        print("ERROR: DATABASE_URL not found")
        return False
    
    # Get Giant Bomb API key
    api_key = os.getenv('GIANT_BOMB_API_KEY')
    if not api_key:
        print("ERROR: GIANT_BOMB_API_KEY not found")
        return False
    
    print(f"Connecting to database...")
    print(f"API Key: {api_key[:10]}...")
    
    # Connect to database
    conn = psycopg2.connect(database_url)
    cur = conn.cursor()
    
    try:
        # Fetch platforms from Giant Bomb API
        print("Fetching platforms from Giant Bomb API...")
        
        url = f"https://www.giantbomb.com/api/platforms/?api_key={api_key}&format=json&limit=100"
        
        # Try direct request first, then CORS proxy if needed
        try:
            response = requests.get(url, timeout=30)
            if response.status_code != 200:
                raise Exception(f"Direct request failed: {response.status_code}")
        except:
            print("Direct request failed, trying CORS proxy...")
            proxy_url = f"https://corsproxy.io/?{url}"
            response = requests.get(proxy_url, timeout=30)
        
        response.raise_for_status()
        data = response.json()
        
        platforms = data.get('results', [])
        print(f"Found {len(platforms)} platforms")
        
        # Insert platforms into database
        inserted = 0
        for platform in platforms:
            try:
                # Extract image URL
                image_url = None
                icon_url = None
                if platform.get('image'):
                    image_url = platform['image'].get('medium_url')
                    icon_url = platform['image'].get('icon_url')
                
                # Insert platform
                cur.execute("""
                    INSERT INTO platforms 
                    (guid, name, abbreviation, deck, description, image_url, icon_url, 
                     release_date, site_detail_url, api_detail_url, date_added, date_last_updated)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (guid) DO NOTHING
                """, (
                    platform.get('guid'),
                    platform.get('name'),
                    platform.get('abbreviation'),
                    platform.get('deck'),
                    platform.get('description'),
                    image_url,
                    icon_url,
                    platform.get('release_date'),
                    platform.get('site_detail_url'),
                    platform.get('api_detail_url'),
                    platform.get('date_added'),
                    platform.get('date_last_updated')
                ))
                
                if cur.rowcount > 0:
                    inserted += 1
                    if inserted % 10 == 0:
                        print(f"Inserted {inserted} platforms...")
                        
            except Exception as e:
                print(f"Error inserting platform {platform.get('name', 'Unknown')}: {e}")
        
        # Commit changes
        conn.commit()
        print(f"✅ Successfully inserted {inserted} platforms!")
        
        # Verify count
        cur.execute("SELECT COUNT(*) FROM platforms")
        total_count = cur.fetchone()[0]
        print(f"Total platforms in database: {total_count}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
        return False
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    success = populate_platforms()
    if success:
        print("🎉 Platform population completed!")
    else:
        print("💥 Platform population failed!")
        exit(1)
