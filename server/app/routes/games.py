from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from app import db
from app.models import Game, User, UserGame
from sqlalchemy import or_

games_bp = Blueprint('games', __name__)

class GameSearchSchema(Schema):
    query = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 2)
    limit = fields.Int(missing=10, validate=lambda x: 1 <= x <= 50)

class AddGameToLibrarySchema(Schema):
    game_guid = fields.Str(required=True)
    status = fields.Str(missing='want_to_play', validate=lambda x: x in ['want_to_play', 'playing', 'completed', 'dropped'])

@games_bp.route('/search', methods=['GET'])
def search_games():
    """Search games in local database"""
    try:
        query = request.args.get('q', '').strip()
        limit = min(int(request.args.get('limit', 10)), 50)
        
        if len(query) < 2:
            return jsonify({
                'success': False,
                'message': 'Query must be at least 2 characters long'
            }), 400
        
        # Search games by name (case-insensitive)
        games = Game.query.filter(
            Game.name.ilike(f'%{query}%')
        ).limit(limit).all()
        
        return jsonify({
            'success': True,
            'games': [game.to_dict() for game in games],
            'count': len(games)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Search failed',
            'error': str(e)
        }), 500

@games_bp.route('/<game_guid>', methods=['GET'])
def get_game_by_guid(game_guid):
    """Get game details by GUID"""
    try:
        game = Game.query.filter_by(guid=game_guid).first()
        
        if not game:
            return jsonify({
                'success': False,
                'message': 'Game not found'
            }), 404
        
        return jsonify({
            'success': True,
            'game': game.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to get game',
            'error': str(e)
        }), 500

@games_bp.route('/library', methods=['GET'])
@jwt_required()
def get_user_library():
    """Get current user's game library"""
    try:
        user_id = get_jwt_identity()
        
        # Get user's games with game details
        user_games = UserGame.query.filter_by(user_id=user_id).all()
        
        return jsonify({
            'success': True,
            'library': [user_game.to_dict() for user_game in user_games],
            'count': len(user_games)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to get library',
            'error': str(e)
        }), 500

@games_bp.route('/library/add', methods=['POST'])
@jwt_required()
def add_game_to_library():
    """Add game to user's library"""
    try:
        user_id = get_jwt_identity()
        
        # Validate input data
        schema = AddGameToLibrarySchema()
        data = schema.load(request.get_json())
        
        # Check if game exists
        game = Game.query.filter_by(guid=data['game_guid']).first()
        if not game:
            return jsonify({
                'success': False,
                'message': 'Game not found'
            }), 404
        
        # Check if game is already in user's library
        existing = UserGame.query.filter_by(user_id=user_id, game_id=game.id).first()
        if existing:
            return jsonify({
                'success': False,
                'message': 'Game already in library'
            }), 400
        
        # Add game to library
        user_game = UserGame(
            user_id=user_id,
            game_id=game.id,
            status=data['status']
        )
        
        db.session.add(user_game)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Game added to library',
            'user_game': user_game.to_dict()
        }), 201
        
    except ValidationError as e:
        return jsonify({
            'success': False,
            'message': 'Validation error',
            'errors': e.messages
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to add game to library',
            'error': str(e)
        }), 500

@games_bp.route('/library/<int:user_game_id>', methods=['DELETE'])
@jwt_required()
def remove_game_from_library(user_game_id):
    """Remove game from user's library"""
    try:
        user_id = get_jwt_identity()
        
        # Find the user's game entry
        user_game = UserGame.query.filter_by(id=user_game_id, user_id=user_id).first()
        if not user_game:
            return jsonify({
                'success': False,
                'message': 'Game not found in library'
            }), 404
        
        db.session.delete(user_game)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Game removed from library'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Failed to remove game from library',
            'error': str(e)
        }), 500
