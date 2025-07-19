from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from app import db
from app.models import User, Follow, UserGame
from app.utils.rate_limiter import rate_limit, search_limiter, api_limiter
import re

users_bp = Blueprint('users', __name__)

class UserSearchSchema(Schema):
    query = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 2)
    limit = fields.Int(missing=10, validate=lambda x: 1 <= x <= 50)

@users_bp.route('/search', methods=['GET'])
@jwt_required()
@rate_limit(search_limiter)
def search_users():
    """Search for users by username or name"""
    try:
        query = request.args.get('q', '').strip()
        limit = min(int(request.args.get('limit', 10)), 50)
        
        if len(query) < 2:
            return jsonify({
                'success': False,
                'message': 'Query must be at least 2 characters long'
            }), 400
        
        current_user_id = int(get_jwt_identity())
        
        # Search users by username only
        users = User.query.filter(
            User.is_active == True,
            User.id != current_user_id,  # Exclude current user
            User.username.ilike(f'%{query}%')
        ).limit(limit).all()
        
        # Get current user's following list
        current_user = User.query.get(current_user_id)
        
        # Format results with follow status
        results = []
        for user in users:
            user_data = user.to_public_dict()
            user_data['is_following'] = current_user.is_following(user)
            user_data['follower_count'] = user.get_follower_count()
            user_data['following_count'] = user.get_following_count()
            results.append(user_data)
        
        return jsonify({
            'success': True,
            'users': results,
            'total': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Search failed',
            'error': str(e)
        }), 500

@users_bp.route('/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user_profile(user_id):
    """Get a user's public profile"""
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        current_user = User.query.get(current_user_id)
        
        # Get user's public profile data
        profile_data = user.to_public_dict()
        profile_data['is_following'] = current_user.is_following(user) if current_user_id != user_id else False
        profile_data['follower_count'] = user.get_follower_count()
        profile_data['following_count'] = user.get_following_count()
        
        # Get user's game library (public view)
        user_games = UserGame.query.filter_by(user_id=user_id).all()
        library = [game.to_dict() for game in user_games]
        
        # Get current user's library to find shared games
        current_user_games = UserGame.query.filter_by(user_id=current_user_id).all()
        current_user_game_ids = {game.game_id for game in current_user_games}
        
        # Mark shared games
        shared_count = 0
        for game in library:
            if game['game_id'] in current_user_game_ids:
                game['is_shared'] = True
                shared_count += 1
            else:
                game['is_shared'] = False
        
        # Calculate some stats
        stats = {
            'total_games': len(library),
            'completed': len([g for g in library if g['status'] == 'completed']),
            'currently_playing': len([g for g in library if g['status'] == 'playing']),
            'want_to_play': len([g for g in library if g['status'] == 'want_to_play']),
            'collection': len([g for g in library if g['status'] == 'collection']),
            'dropped': len([g for g in library if g['status'] == 'dropped']),
            'average_rating': sum([g['rating'] for g in library if g['rating']]) / len([g for g in library if g['rating']]) if any(g['rating'] for g in library) else 0,
            'total_hours': sum([g['hours_played'] for g in library if g['hours_played']]) if any(g['hours_played'] for g in library) else 0,
            'shared_games': shared_count
        }
        
        return jsonify({
            'success': True,
            'user': profile_data,
            'library': library,
            'stats': stats
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to get user profile',
            'error': str(e)
        }), 500

@users_bp.route('/<int:user_id>/follow', methods=['POST'])
@jwt_required()
def follow_user(user_id):
    """Follow a user"""
    try:
        current_user_id = int(get_jwt_identity())
        
        if current_user_id == user_id:
            return jsonify({
                'success': False,
                'message': 'Cannot follow yourself'
            }), 400
        
        current_user = User.query.get(current_user_id)
        target_user = User.query.get(user_id)
        
        if not target_user or not target_user.is_active:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        if current_user.follow(target_user):
            db.session.commit()
            return jsonify({
                'success': True,
                'message': f'You are now following {target_user.username}',
                'is_following': True,
                'follower_count': target_user.get_follower_count()
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Already following this user'
            }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to follow user',
            'error': str(e)
        }), 500

@users_bp.route('/<int:user_id>/unfollow', methods=['POST'])
@jwt_required()
def unfollow_user(user_id):
    """Unfollow a user"""
    try:
        current_user_id = int(get_jwt_identity())
        
        current_user = User.query.get(current_user_id)
        target_user = User.query.get(user_id)
        
        if not target_user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        if current_user.unfollow(target_user):
            db.session.commit()
            return jsonify({
                'success': True,
                'message': f'You have unfollowed {target_user.username}',
                'is_following': False,
                'follower_count': target_user.get_follower_count()
            }), 200
        else:
            return jsonify({
                'success': False,
                'message': 'Not following this user'
            }), 400
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to unfollow user',
            'error': str(e)
        }), 500

@users_bp.route('/me/followers', methods=['GET'])
@jwt_required()
def get_my_followers():
    """Get current user's followers"""
    try:
        current_user_id = int(get_jwt_identity())
        
        followers = Follow.query.filter_by(followed_id=current_user_id).all()
        followers_data = []
        
        for follow in followers:
            follower_data = follow.follower.to_public_dict()
            follower_data['followed_since'] = follow.created_at.isoformat()
            followers_data.append(follower_data)
        
        return jsonify({
            'success': True,
            'followers': followers_data,
            'total': len(followers_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to get followers',
            'error': str(e)
        }), 500

@users_bp.route('/me/following', methods=['GET'])
@jwt_required()
def get_my_following():
    """Get users that current user is following"""
    try:
        current_user_id = int(get_jwt_identity())
        
        following = Follow.query.filter_by(follower_id=current_user_id).all()
        following_data = []
        
        for follow in following:
            followed_data = follow.followed.to_public_dict()
            followed_data['following_since'] = follow.created_at.isoformat()
            following_data.append(followed_data)
        
        return jsonify({
            'success': True,
            'following': following_data,
            'total': len(following_data)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to get following list',
            'error': str(e)
        }), 500
