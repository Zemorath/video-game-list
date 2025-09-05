from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import Platform
from sqlalchemy.exc import IntegrityError
import requests
import os

platforms_bp = Blueprint('platforms', __name__)

def cache_platform_from_api_data(platform_data):
    """
    Cache a platform from Giant Bomb API data to local database
    Returns the Platform object (existing or newly created)
    """
    try:
        if not platform_data.get('guid'):
            print("Warning: Platform data missing GUID, skipping cache")
            return None
            
        # Check if platform already exists
        existing_platform = Platform.query.filter_by(guid=platform_data.get('guid')).first()
        if existing_platform:
            print(f"Platform already cached: {existing_platform.name} (GUID: {existing_platform.guid})")
            return existing_platform
        
        print(f"Caching new platform: {platform_data.get('name')} (GUID: {platform_data.get('guid')})")
        
        # Extract image URLs
        image = platform_data.get('image', {}) if platform_data.get('image') else {}
        
        # Create new platform
        new_platform = Platform(
            guid=platform_data.get('guid'),
            name=platform_data.get('name'),
            abbreviation=platform_data.get('abbreviation'),
            deck=platform_data.get('deck'),
            description=platform_data.get('description'),
            
            # Image URLs
            image_url=image.get('medium_url'),
            icon_url=image.get('icon_url'),
            
            # Company info
            company=platform_data.get('company'),
            
            # Dates
            release_date=platform_data.get('release_date'),
            
            # URLs
            site_detail_url=platform_data.get('site_detail_url'),
            api_detail_url=platform_data.get('api_detail_url'),
            
            # Timestamps from Giant Bomb
            date_added=platform_data.get('date_added'),
            date_last_updated=platform_data.get('date_last_updated')
        )
        
        db.session.add(new_platform)
        db.session.commit()
        
        print(f"Successfully cached platform: {new_platform.name}")
        return new_platform
        
    except IntegrityError as e:
        db.session.rollback()
        print(f"Integrity error caching platform {platform_data.get('name', 'Unknown')}: {e}")
        # Try to find existing platform
        existing_platform = Platform.query.filter_by(guid=platform_data.get('guid')).first()
        return existing_platform
    except Exception as e:
        db.session.rollback()
        print(f"Error caching platform {platform_data.get('name', 'Unknown')}: {e}")
        return None

@platforms_bp.route('/', methods=['GET'])
def get_platforms():
    """Get all platforms from local database"""
    try:
        platforms = Platform.query.order_by(Platform.name).all()
        
        return jsonify({
            'success': True,
            'platforms': [platform.to_dict() for platform in platforms],
            'count': len(platforms)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to get platforms',
            'error': str(e)
        }), 500

@platforms_bp.route('/sync-from-api', methods=['POST'])
def sync_platforms_from_api():
    """
    Fetch all platforms from Giant Bomb API and cache them locally
    This should be run once to populate the platforms database
    """
    try:
        # Giant Bomb API configuration
        api_key = os.getenv('REACT_APP_GIANT_BOMB_API_KEY')
        if not api_key:
            return jsonify({
                'success': False,
                'message': 'Giant Bomb API key not configured'
            }), 500
        
        # Fetch platforms from Giant Bomb API
        api_url = os.getenv('REACT_APP_GIANT_BOMB_API_URL', 'https://www.giantbomb.com/api')
        base_url = f'{api_url}/platforms/'
        params = {
            'api_key': api_key,
            'format': 'json',
            'limit': 100,  # Start with 100, might need pagination
            'field_list': 'guid,name,abbreviation,deck,description,image,company,release_date,site_detail_url,api_detail_url,date_added,date_last_updated'
        }
        
        # Use CORS proxy for API call
        platforms_cached = 0
        total_platforms = 0
        
        # Try direct API call first (no CORS issues on server-side)
        try:
            print(f"Fetching platforms from: {base_url}")
            print(f"Using API key: {api_key[:8]}...")
            
            response = requests.get(base_url, params=params, timeout=30)
            response.raise_for_status()
            
            api_data = response.json()
            platforms_data = api_data.get('results', [])
            total_platforms = len(platforms_data)
            
            print(f"Found {total_platforms} platforms from Giant Bomb API")
            
            # Cache each platform
            for platform_data in platforms_data:
                cached_platform = cache_platform_from_api_data(platform_data)
                if cached_platform:
                    platforms_cached += 1
                    
        except Exception as e:
            print(f"Direct API call failed: {e}")
            
            # Fallback to CORS proxies if direct call fails
            proxies = [
                'https://corsproxy.io/?',
                'https://api.allorigins.win/get?url='
            ]
            
            for proxy in proxies:
                try:
                    if 'allorigins.win' in proxy:
                        params_str = '&'.join([f"{k}={v}" for k, v in params.items()])
                        full_url = f"{proxy}{base_url}?{params_str}"
                    else:
                        params_str = '&'.join([f"{k}={v}" for k, v in params.items()])
                        full_url = f"{proxy}{base_url}?{params_str}"
                    
                    print(f"Trying proxy: {full_url}")
                    
                    response = requests.get(full_url, timeout=30)
                    response.raise_for_status()
                    
                    if 'allorigins.win' in proxy:
                        data = response.json()
                        if data.get('status', {}).get('http_code') == 200:
                            api_data = data.get('contents', {})
                            if isinstance(api_data, str):
                                import json
                                api_data = json.loads(api_data)
                        else:
                            continue
                    else:
                        api_data = response.json()
                    
                    platforms_data = api_data.get('results', [])
                    total_platforms = len(platforms_data)
                    
                    print(f"Found {total_platforms} platforms from Giant Bomb API")
                    
                    # Cache each platform
                    for platform_data in platforms_data:
                        cached_platform = cache_platform_from_api_data(platform_data)
                        if cached_platform:
                            platforms_cached += 1
                    
                    break  # Success, exit proxy loop
                    
                except Exception as proxy_error:
                    print(f"Proxy failed: {proxy_error}")
                    continue
        
        if platforms_cached == 0 and total_platforms == 0:
            return jsonify({
                'success': False,
                'message': 'Failed to fetch platforms from Giant Bomb API. All proxies failed.'
            }), 500
        
        return jsonify({
            'success': True,
            'message': f'Successfully cached {platforms_cached} out of {total_platforms} platforms',
            'platforms_cached': platforms_cached,
            'total_platforms': total_platforms
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to sync platforms',
            'error': str(e)
        }), 500

@platforms_bp.route('/<platform_guid>', methods=['GET'])
def get_platform_by_guid(platform_guid):
    """Get platform details by GUID"""
    try:
        platform = Platform.query.filter_by(guid=platform_guid).first()
        
        if not platform:
            return jsonify({
                'success': False,
                'message': 'Platform not found'
            }), 404
        
        return jsonify({
            'success': True,
            'platform': platform.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to get platform',
            'error': str(e)
        }), 500
