from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import os
from datetime import datetime, timedelta
from app import db
import json

youtube_bp = Blueprint('youtube', __name__)

# YouTube Data API configuration
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')
YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3'

# Cache for storing daily videos - using JSON serializable format
daily_videos_cache = {
    'videos': [],
    'last_updated': None,
    'cache_duration': 86400  # 24 hours in seconds
}

def search_gaming_review_videos(max_results=12):
    """Search for gaming review videos from specific channels"""
    if not YOUTUBE_API_KEY:
        return {'error': 'YouTube API key not configured'}
    
    # Target channel IDs (Arekkz Gaming, Force Gaming, and IGN)
    target_channels = {
        'UC-zjH-e5XBzMpy_VtwIGRxQ': 'Arekkz Gaming',  # Official Arekkz Gaming
        'UCGhs9S33RAeT5DEuKTO4Oew': 'Force Gaming',    # Force Gaming
        'UCKy1dAqELo0zrOtPkf0eTMw': 'IGN'             # IGN Official
    }
    all_videos = []
    
    # Calculate date range (last 14 days for better content availability)
    now = datetime.utcnow()
    two_weeks_ago = now - timedelta(days=14)
    
    # Search each channel for recent videos
    for channel_id, channel_name in target_channels.items():
        search_params = {
            'part': 'snippet',
            'channelId': channel_id,
            'type': 'video',
            'order': 'date',
            'publishedAfter': two_weeks_ago.isoformat() + 'Z',
            'publishedBefore': now.isoformat() + 'Z',
            'maxResults': 8,  # Get more videos per channel to ensure we have enough total
            'key': YOUTUBE_API_KEY
        }
        
        try:
            # Search for videos from this channel
            search_response = requests.get(f'{YOUTUBE_API_BASE_URL}/search', params=search_params)
            search_response.raise_for_status()
            search_data = search_response.json()
            
            if 'items' in search_data:
                # Get video IDs from this channel
                video_ids = [item['id']['videoId'] for item in search_data['items'] if item['id']['kind'] == 'youtube#video']
                
                if video_ids:
                    # Get detailed video information
                    video_params = {
                        'part': 'snippet,statistics,contentDetails',
                        'id': ','.join(video_ids),
                        'key': YOUTUBE_API_KEY
                    }
                    
                    video_response = requests.get(f'{YOUTUBE_API_BASE_URL}/videos', params=video_params)
                    video_response.raise_for_status()
                    video_data = video_response.json()
                    
                    # Add videos from this channel to our collection
                    for video in video_data.get('items', []):
                        # Special filtering for IGN content to focus on gaming
                        if channel_name == 'IGN':
                            title = video['snippet']['title'].lower()
                            description = video['snippet']['description'].lower()
                            
                            # IGN gaming keywords
                            gaming_keywords = [
                                'trailer', 'gameplay', 'review', 'preview', 'game', 'gaming',
                                'xbox', 'playstation', 'nintendo', 'pc', 'steam', 'epic',
                                'shooter', 'rpg', 'action', 'adventure', 'indie', 'aaa',
                                'multiplayer', 'singleplayer', 'beta', 'alpha', 'demo',
                                'release date', 'coming soon', 'announcement'
                            ]
                            
                            # Skip if it doesn't contain gaming keywords
                            if not any(keyword in title or keyword in description for keyword in gaming_keywords):
                                continue
                                
                            # Skip IGN Daily Fix and other non-gaming content
                            skip_keywords = ['daily fix', 'movie', 'tv show', 'series', 'comic', 'anime']
                            if any(keyword in title for keyword in skip_keywords):
                                continue
                        
                        all_videos.append(video)
                        
        except requests.exceptions.RequestException as e:
            print(f"Error fetching videos from {channel_name}: {str(e)}")
            continue
    
    if not all_videos:
        return {'videos': []}
    
    # Process and format video data
    formatted_videos = []
    for video in all_videos:
        # Filter out videos with low engagement or very short/long duration
        view_count = int(video.get('statistics', {}).get('viewCount', 0))
        like_count = int(video.get('statistics', {}).get('likeCount', 0))
        
        # Parse duration (PT15M33S format)
        duration = video.get('contentDetails', {}).get('duration', '')
        
        # Skip videos that are too short (under 3 minutes) or too long (over 30 minutes)
        if 'PT' in duration:
            # Simple duration check - skip if over 30 minutes
            if 'H' in duration:
                continue
        
        formatted_video = {
            'id': video['id'],
            'title': video['snippet']['title'],
            'description': video['snippet']['description'][:200] + '...' if len(video['snippet']['description']) > 200 else video['snippet']['description'],
            'thumbnail': video['snippet']['thumbnails']['high']['url'],
            'channel_title': video['snippet']['channelTitle'],
            'published_at': video['snippet']['publishedAt'],
            'view_count': view_count,
            'like_count': like_count,
            'url': f'https://www.youtube.com/watch?v={video["id"]}',
            'embed_url': f'https://www.youtube.com/embed/{video["id"]}'
        }
        formatted_videos.append(formatted_video)
    
    # Sort by date (most recent first) and return top videos
    formatted_videos.sort(key=lambda x: x['published_at'], reverse=True)
    
    return {'videos': formatted_videos[:max_results]}

def should_refresh_cache():
    """Check if we should refresh the daily video cache"""
    if not daily_videos_cache['last_updated']:
        return True
    
    try:
        last_updated = datetime.fromisoformat(daily_videos_cache['last_updated'])
        now = datetime.utcnow()
        
        # Refresh if it's been more than cache_duration seconds
        return (now - last_updated).total_seconds() > daily_videos_cache['cache_duration']
    except (ValueError, TypeError):
        # If there's any issue with the timestamp, refresh
        return True

@youtube_bp.route('/daily-reviews', methods=['GET'])
def get_daily_reviews():
    """Get daily gaming review videos"""
    try:
        print(f"Cache status: {len(daily_videos_cache['videos'])} videos, last updated: {daily_videos_cache['last_updated']}")
        print(f"Should refresh: {should_refresh_cache()}")
        
        # Check if we need to refresh the cache
        if should_refresh_cache():
            print("Refreshing cache...")
            result = search_gaming_review_videos()
            
            if 'error' not in result:
                daily_videos_cache['videos'] = result['videos']
                daily_videos_cache['last_updated'] = datetime.utcnow().isoformat()
                print(f"Cache refreshed with {len(result['videos'])} videos")
            else:
                print(f"API error: {result['error']}")
                # If API fails, return cached videos if available
                if daily_videos_cache['videos']:
                    return jsonify({
                        'success': True,
                        'videos': daily_videos_cache['videos'],
                        'cached': True,
                        'message': 'Using cached videos due to API error'
                    }), 200
                else:
                    return jsonify({
                        'success': False,
                        'message': result['error']
                    }), 500
        else:
            print("Using cached videos")
        
        return jsonify({
            'success': True,
            'videos': daily_videos_cache['videos'],
            'last_updated': daily_videos_cache['last_updated'],
            'cached': not should_refresh_cache()
        }), 200
        
    except Exception as e:
        print(f"Error in get_daily_reviews: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Failed to get daily reviews: {str(e)}'
        }), 500

@youtube_bp.route('/refresh-reviews', methods=['POST'])
@jwt_required()
def refresh_reviews():
    """Manually refresh the daily reviews (admin only)"""
    try:
        result = search_gaming_review_videos()
        
        if 'error' not in result:
            daily_videos_cache['videos'] = result['videos']
            daily_videos_cache['last_updated'] = datetime.utcnow().isoformat()
            
            return jsonify({
                'success': True,
                'message': 'Reviews refreshed successfully',
                'videos': result['videos']
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': result['error']
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to refresh reviews: {str(e)}'
        }), 500

@youtube_bp.route('/clear-cache', methods=['POST'])
def clear_cache():
    """Clear the video cache for testing"""
    try:
        daily_videos_cache['videos'] = []
        daily_videos_cache['last_updated'] = None
        
        return jsonify({
            'success': True,
            'message': 'Cache cleared successfully'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to clear cache: {str(e)}'
        }), 500
