from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import os
from datetime import datetime, timedelta
from app import db
import json

games_upcoming_bp = Blueprint('games_upcoming', __name__)

# RAWG API configuration
RAWG_API_KEY = os.getenv('RAWG_API_KEY')
RAWG_API_BASE_URL = 'https://api.rawg.io/api'

# Cache for storing daily upcoming games
upcoming_games_cache = {
    'games': [],
    'last_updated': None,
    'cache_duration': 86400  # 24 hours in seconds
}

def search_upcoming_games(max_results=8):
    """Search for upcoming games with release dates"""
    if not RAWG_API_KEY:
        # Return mock data for testing when API key is not configured
        return {
            'games': [
                {
                    'id': 1,
                    'name': 'Example Upcoming Game',
                    'slug': 'example-upcoming-game',
                    'description': 'This is a placeholder for upcoming games. Please configure your RAWG API key to see real upcoming games.',
                    'background_image': 'https://via.placeholder.com/600x400/333/fff?text=Game+Image',
                    'release_date': '2025-12-25',
                    'rating': 4.5,
                    'ratings_count': 1000,
                    'metacritic': 85,
                    'platforms': ['PC', 'PlayStation 5', 'Xbox Series X'],
                    'genres': ['Action', 'Adventure'],
                    'publishers': ['Example Publisher'],
                    'website': 'https://example.com',
                    'youtube_trailer': None,
                    'rawg_url': 'https://rawg.io/games/example-upcoming-game',
                    'esrb_rating': 'M'
                }
            ]
        }
    
    # Calculate date range (next 12 months for upcoming games)
    now = datetime.utcnow()
    next_year = now + timedelta(days=365)
    
    # Format dates for RAWG API (YYYY-MM-DD)
    start_date = now.strftime('%Y-%m-%d')
    end_date = next_year.strftime('%Y-%m-%d')
    
    # Search parameters for upcoming games
    search_params = {
        'key': RAWG_API_KEY,
        'dates': f'{start_date},{end_date}',
        'ordering': '-added',  # Most anticipated (by community interest)
        'page_size': max_results * 2,  # Get more to filter better ones
        'metacritic': '70,100',  # High-rated games only
    }
    
    try:
        # Search for upcoming games
        search_response = requests.get(f'{RAWG_API_BASE_URL}/games', params=search_params)
        search_response.raise_for_status()
        search_data = search_response.json()
        
        if 'results' not in search_data:
            return {'error': 'No games found'}
        
        # Process and format game data
        formatted_games = []
        for game in search_data.get('results', []):
            # Skip games without release dates or that are already released
            if not game.get('released') or game.get('released') <= start_date:
                continue
                
            # Get additional game details for website/trailer links
            game_details = get_game_details(game['id'])
            
            formatted_game = {
                'id': game['id'],
                'name': game['name'],
                'slug': game['slug'],
                'description': game.get('description_raw', '')[:300] + '...' if game.get('description_raw') and len(game.get('description_raw', '')) > 300 else game.get('description_raw', ''),
                'background_image': game.get('background_image'),
                'release_date': game.get('released'),
                'rating': game.get('rating', 0),
                'ratings_count': game.get('ratings_count', 0),
                'metacritic': game.get('metacritic'),
                'platforms': [platform['platform']['name'] for platform in game.get('platforms', [])],
                'genres': [genre['name'] for genre in game.get('genres', [])],
                'publishers': [pub['name'] for pub in game.get('publishers', [])],
                'website': game_details.get('website'),
                'youtube_trailer': game_details.get('youtube_trailer'),
                'rawg_url': f'https://rawg.io/games/{game["slug"]}',
                'esrb_rating': game.get('esrb_rating', {}).get('name') if game.get('esrb_rating') else None
            }
            formatted_games.append(formatted_game)
            
            # Stop when we have enough games
            if len(formatted_games) >= max_results:
                break
        
        # Sort by release date (closest first)
        formatted_games.sort(key=lambda x: x['release_date'] if x['release_date'] else '9999-12-31')
        
        return {'games': formatted_games[:max_results]}
        
    except requests.exceptions.RequestException as e:
        return {'error': f'RAWG API request failed: {str(e)}'}
    except Exception as e:
        return {'error': f'Failed to fetch upcoming games: {str(e)}'}

def get_game_details(game_id):
    """Get additional details for a specific game"""
    try:
        detail_params = {
            'key': RAWG_API_KEY
        }
        
        detail_response = requests.get(f'{RAWG_API_BASE_URL}/games/{game_id}', params=detail_params)
        detail_response.raise_for_status()
        detail_data = detail_response.json()
        
        # Extract website and YouTube trailer
        website = detail_data.get('website')
        youtube_trailer = None
        
        # Look for YouTube trailer in clips
        for clip in detail_data.get('clip', {}).get('clips', []):
            if 'youtube' in clip.get('video', '').lower():
                youtube_trailer = clip.get('video')
                break
        
        # If no trailer in clips, check if there's a trailer in the main data
        if not youtube_trailer and detail_data.get('clip', {}).get('clip'):
            clip_url = detail_data.get('clip', {}).get('clip')
            if 'youtube' in clip_url.lower():
                youtube_trailer = clip_url
        
        return {
            'website': website,
            'youtube_trailer': youtube_trailer
        }
        
    except Exception as e:
        print(f"Error getting game details for {game_id}: {str(e)}")
        return {'website': None, 'youtube_trailer': None}

def should_refresh_upcoming_cache():
    """Check if we should refresh the upcoming games cache"""
    if not upcoming_games_cache['last_updated']:
        return True
    
    try:
        last_updated = datetime.fromisoformat(upcoming_games_cache['last_updated'])
        now = datetime.utcnow()
        
        # Refresh if it's been more than cache_duration seconds
        return (now - last_updated).total_seconds() > upcoming_games_cache['cache_duration']
    except (ValueError, TypeError):
        # If there's any issue with the timestamp, refresh
        return True

@games_upcoming_bp.route('/upcoming', methods=['GET'])
def get_upcoming_games():
    """Get upcoming games with release dates"""
    try:
        print(f"Upcoming games cache status: {len(upcoming_games_cache['games'])} games, last updated: {upcoming_games_cache['last_updated']}")
        print(f"Should refresh: {should_refresh_upcoming_cache()}")
        
        # Check if we need to refresh the cache
        if should_refresh_upcoming_cache():
            print("Refreshing upcoming games cache...")
            result = search_upcoming_games()
            
            if 'error' not in result:
                upcoming_games_cache['games'] = result['games']
                upcoming_games_cache['last_updated'] = datetime.utcnow().isoformat()
                print(f"Cache refreshed with {len(result['games'])} upcoming games")
            else:
                print(f"API error: {result['error']}")
                # If API fails, return cached games if available
                if upcoming_games_cache['games']:
                    return jsonify({
                        'success': True,
                        'games': upcoming_games_cache['games'],
                        'cached': True,
                        'message': 'Using cached games due to API error'
                    }), 200
                else:
                    return jsonify({
                        'success': False,
                        'message': result['error']
                    }), 500
        else:
            print("Using cached upcoming games")
        
        return jsonify({
            'success': True,
            'games': upcoming_games_cache['games'],
            'last_updated': upcoming_games_cache['last_updated'],
            'cached': not should_refresh_upcoming_cache()
        }), 200
        
    except Exception as e:
        print(f"Error in get_upcoming_games: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to get upcoming games: {str(e)}'
        }), 500

@games_upcoming_bp.route('/refresh-upcoming', methods=['POST'])
@jwt_required()
def refresh_upcoming_games():
    """Manually refresh the upcoming games (admin only)"""
    try:
        result = search_upcoming_games()
        
        if 'error' not in result:
            upcoming_games_cache['games'] = result['games']
            upcoming_games_cache['last_updated'] = datetime.utcnow().isoformat()
            
            return jsonify({
                'success': True,
                'message': 'Upcoming games refreshed successfully',
                'games': result['games']
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result['error']
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to refresh upcoming games: {str(e)}'
        }), 500
