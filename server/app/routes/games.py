from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from app import db
from app.models import Game, User, UserGame
from sqlalchemy import or_
from sqlalchemy.exc import IntegrityError

games_bp = Blueprint('games', __name__)

def cache_game_from_api_data(game_data):
    """
    Cache a game from Giant Bomb API data to local database
    Returns the Game object (existing or newly created)
    """
    try:
        if not game_data.get('guid'):
            print("Warning: Game data missing GUID, skipping cache")
            return None
            
        # Check if game already exists
        existing_game = Game.query.filter_by(guid=game_data.get('guid')).first()
        if existing_game:
            print(f"Game already cached: {existing_game.name} (GUID: {existing_game.guid})")
            return existing_game
        
        print(f"Caching new game: {game_data.get('name')} (GUID: {game_data.get('guid')})")
        
        # Extract image URLs
        image = game_data.get('image', {}) if game_data.get('image') else {}
        
        # Create new game
        new_game = Game(
            guid=game_data.get('guid'),
            name=game_data.get('name'),
            description=game_data.get('description'),
            deck=game_data.get('deck'),
            original_release_date=game_data.get('original_release_date'),
            expected_release_year=game_data.get('expected_release_year'),
            expected_release_quarter=game_data.get('expected_release_quarter'),
            expected_release_month=game_data.get('expected_release_month'),
            expected_release_day=game_data.get('expected_release_day'),
            
            # Image URLs
            image_url=image.get('medium_url'),
            thumb_url=image.get('thumb_url'),
            icon_url=image.get('icon_url'),
            small_url=image.get('small_url'),
            super_url=image.get('super_url'),
            screen_url=image.get('screen_url'),
            screen_large_url=image.get('screen_large_url'),
            tiny_url=image.get('tiny_url'),
            
            # JSON fields
            platforms=game_data.get('platforms'),
            genres=game_data.get('genres'),
            developers=game_data.get('developers'),
            publishers=game_data.get('publishers'),
            franchises=game_data.get('franchises'),
            concepts=game_data.get('concepts'),
            themes=game_data.get('themes'),
            
            # Text fields
            aliases=game_data.get('aliases'),
            
            # URLs
            site_detail_url=game_data.get('site_detail_url'),
            api_detail_url=game_data.get('api_detail_url'),
            
            # Metadata
            number_of_user_reviews=game_data.get('number_of_user_reviews', 0),
            original_game_rating=game_data.get('original_game_rating'),
            
            # Giant Bomb timestamps
            date_added=game_data.get('date_added'),
            date_last_updated=game_data.get('date_last_updated')
        )
        
        db.session.add(new_game)
        db.session.commit()
        
        print(f"Successfully cached new game: {new_game.name} (ID: {new_game.id}, GUID: {new_game.guid})")
        return new_game
        
    except Exception as e:
        db.session.rollback()
        print(f"Error caching game {game_data.get('name', 'Unknown')}: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

class GameSearchSchema(Schema):
    query = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 2)
    limit = fields.Int(missing=10, validate=lambda x: 1 <= x <= 50)

class AddGameToLibrarySchema(Schema):
    game_guid = fields.Str(required=True)
    status = fields.Str(missing='want_to_play', validate=lambda x: x in ['want_to_play', 'playing', 'completed', 'dropped', 'collection'])
    platform_id = fields.Int(allow_none=True)

class UpdateUserGameSchema(Schema):
    status = fields.Str(validate=lambda x: x in ['want_to_play', 'playing', 'completed', 'dropped', 'collection'])
    rating = fields.Int(validate=lambda x: x is None or (1 <= x <= 10), allow_none=True)
    hours_played = fields.Float(validate=lambda x: x is None or x >= 0, allow_none=True)
    platform_id = fields.Int(allow_none=True)

@games_bp.route('/search', methods=['GET'])
def search_games():
    """Search games in local database first, then external APIs if needed"""
    try:
        query = request.args.get('q', '').strip()
        limit = min(int(request.args.get('limit', 10)), 50)
        
        if len(query) < 2:
            return jsonify({
                'success': False,
                'message': 'Query must be at least 2 characters long'
            }), 400
        
        # Search games by name (case-insensitive)
        local_games = Game.query.filter(
            Game.name.ilike(f'%{query}%')
        ).limit(limit).all()
        
        return jsonify({
            'success': True,
            'games': [game.to_dict() for game in local_games],
            'count': len(local_games),
            'source': 'local_database'
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
        user_id = int(get_jwt_identity())
        
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
    """Add game to user's library (for games already in database)"""
    try:
        user_id = int(get_jwt_identity())
        
        # Validate input data
        schema = AddGameToLibrarySchema()
        data = schema.load(request.get_json())
        
        print(f"add_game_to_library called by user {user_id} for game GUID: {data['game_guid']}")
        
        # Check if game exists
        game = Game.query.filter_by(guid=data['game_guid']).first()
        if not game:
            print(f"Game with GUID {data['game_guid']} not found in database")
            return jsonify({
                'success': False,
                'message': 'Game not found in database. Please search for the game first.'
            }), 404
        
        print(f"Found game in database: {game.name} (ID: {game.id})")
        
        # Check if game is already in user's library
        existing = UserGame.query.filter_by(user_id=user_id, game_id=game.id).first()
        if existing:
            print(f"Game already in user's library: {existing.id}")
            return jsonify({
                'success': False,
                'message': 'Game already in library'
            }), 400
        
        # Add game to library
        user_game = UserGame(
            user_id=user_id,
            game_id=game.id,
            status=data['status'],
            platform_id=data.get('platform_id'),
            image_url=game.image_url  # Store the image URL for quick access
        )
        
        db.session.add(user_game)
        db.session.commit()
        
        print(f"Successfully added game to user's library: UserGame ID {user_game.id}")
        
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

@games_bp.route('/library/add-external', methods=['POST'])
@jwt_required()
def add_external_game_to_library():
    """Add game from external API (like Giant Bomb) to user's library"""
    try:
        user_id = int(get_jwt_identity())
        data = request.get_json()
        
        print("add-external called with data:", data)
        
        # Required fields from external API
        required_fields = ['guid', 'name']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'message': f'Missing required field: {field}'
                }), 400
        
        # First check if game already exists in our database
        existing_game = Game.query.filter_by(guid=data['guid']).first()
        
        if existing_game:
            print(f"Game {data['name']} already exists in database, using existing entry")
            game = existing_game
        else:
            # Use the cache function to create new game entry
            print(f"Caching new game: {data['name']}")
            game = cache_game_from_api_data(data)
            if not game:
                return jsonify({
                    'success': False,
                    'message': 'Failed to cache game data'
                }), 500
        
        # Check if game is already in user's library
        existing = UserGame.query.filter_by(user_id=user_id, game_id=game.id).first()
        if existing:
            return jsonify({
                'success': False,
                'message': 'Game already in library'
            }), 400
        
        # Add game to user's library
        user_game = UserGame(
            user_id=user_id,
            game_id=game.id,
            status=data.get('status', 'want_to_play'),
            platform_id=data.get('platform_id'),
            image_url=game.image_url  # Store the image URL for quick access
        )
        
        db.session.add(user_game)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Game added to library',
            'user_game': user_game.to_dict()
        }), 201
        
    except IntegrityError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Database constraint error - game may already exist',
            'error': str(e)
        }), 409
    except ValidationError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Validation error',
            'errors': e.messages
        }), 422
    except Exception as e:
        db.session.rollback()
        print(f"Error adding external game: {str(e)}")
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
        user_id = int(get_jwt_identity())
        
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

@games_bp.route('/library/<int:user_game_id>', methods=['PUT'])
@jwt_required()
def update_user_game(user_game_id):
    """Update user's game details (status, rating, hours_played)"""
    try:
        user_id = int(get_jwt_identity())
        
        # Validate input data
        schema = UpdateUserGameSchema()
        data = schema.load(request.get_json())
        
        # Find the user's game entry
        user_game = UserGame.query.filter_by(id=user_game_id, user_id=user_id).first()
        if not user_game:
            return jsonify({
                'success': False,
                'message': 'Game not found in library'
            }), 404
        
        # Update allowed fields
        if 'status' in data:
            user_game.status = data['status']
        
        if 'rating' in data:
            user_game.rating = data['rating']
        
        if 'hours_played' in data:
            user_game.hours_played = data['hours_played']
        
        if 'platform_id' in data:
            user_game.platform_id = data['platform_id']
        
        # Update status-based dates
        if 'status' in data:
            from datetime import datetime
            if data['status'] == 'playing' and not user_game.date_started:
                user_game.date_started = datetime.utcnow()
            elif data['status'] == 'completed' and not user_game.date_completed:
                user_game.date_completed = datetime.utcnow()
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Game updated successfully',
            'user_game': user_game.to_dict()
        }), 200
        
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
            'message': 'Failed to update game',
            'error': str(e)
        }), 500

@games_bp.route('/cache-search-results', methods=['POST'])
def cache_search_results():
    """
    Cache games from Giant Bomb API search results
    Expects: { "results": [array of game objects from Giant Bomb] }
    Returns: { "cached_count": number, "games": [array of cached games] }
    """
    try:
        data = request.get_json()
        search_results = data.get('results', [])
        
        if not search_results:
            return jsonify({
                'success': False,
                'message': 'No search results provided'
            }), 400
        
        cached_games = []
        cached_count = 0
        
        for game_data in search_results:
            if not game_data.get('guid'):
                continue  # Skip games without GUID
                
            cached_game = cache_game_from_api_data(game_data)
            if cached_game:
                cached_games.append(cached_game.to_dict())
                cached_count += 1
        
        return jsonify({
            'success': True,
            'cached_count': cached_count,
            'total_processed': len(search_results),
            'games': cached_games
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to cache search results',
            'error': str(e)
        }), 500
