from app import db
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=True)
    last_name = db.Column(db.String(50), nullable=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user_games = db.relationship('UserGame', backref='user', lazy=True, cascade='all, delete-orphan')
    
    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Check if provided password matches the hash"""
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        """Convert user object to dictionary (excluding password)"""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<User {self.username}>'

class Game(db.Model):
    __tablename__ = 'games'
    
    id = db.Column(db.Integer, primary_key=True)
    guid = db.Column(db.String(50), unique=True, nullable=False, index=True)  # Giant Bomb GUID
    name = db.Column(db.String(255), nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    deck = db.Column(db.Text, nullable=True)  # Brief summary
    original_release_date = db.Column(db.String(20), nullable=True)
    expected_release_year = db.Column(db.Integer, nullable=True)
    expected_release_quarter = db.Column(db.Integer, nullable=True)
    expected_release_month = db.Column(db.Integer, nullable=True)
    expected_release_day = db.Column(db.Integer, nullable=True)
    
    # Image URLs - Giant Bomb provides multiple sizes
    image_url = db.Column(db.String(500), nullable=True)  # medium_url
    thumb_url = db.Column(db.String(500), nullable=True)  # thumb_url
    icon_url = db.Column(db.String(500), nullable=True)   # icon_url
    small_url = db.Column(db.String(500), nullable=True)  # small_url
    super_url = db.Column(db.String(500), nullable=True)  # super_url
    screen_url = db.Column(db.String(500), nullable=True) # screen_url
    screen_large_url = db.Column(db.String(500), nullable=True) # screen_large_url
    tiny_url = db.Column(db.String(500), nullable=True)   # tiny_url
    
    # Related data stored as JSON
    platforms = db.Column(db.JSON, nullable=True)  # Store as JSON array
    genres = db.Column(db.JSON, nullable=True)  # Store as JSON array
    developers = db.Column(db.JSON, nullable=True)  # Store as JSON array
    publishers = db.Column(db.JSON, nullable=True)  # Store as JSON array
    franchises = db.Column(db.JSON, nullable=True)  # Store as JSON array
    concepts = db.Column(db.JSON, nullable=True)  # Store as JSON array
    themes = db.Column(db.JSON, nullable=True)  # Store as JSON array
    
    # Text fields
    aliases = db.Column(db.Text, nullable=True)
    
    # URLs
    site_detail_url = db.Column(db.String(500), nullable=True)
    api_detail_url = db.Column(db.String(500), nullable=True)
    
    # Additional metadata
    number_of_user_reviews = db.Column(db.Integer, default=0)
    original_game_rating = db.Column(db.JSON, nullable=True)  # ESRB, PEGI, etc.
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Timestamps from Giant Bomb
    date_added = db.Column(db.String(30), nullable=True)  # Giant Bomb date_added
    date_last_updated = db.Column(db.String(30), nullable=True)  # Giant Bomb date_last_updated
    
    # Relationships
    user_games = db.relationship('UserGame', backref='game', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert game object to dictionary"""
        return {
            'id': self.id,
            'guid': self.guid,
            'name': self.name,
            'description': self.description,
            'deck': self.deck,
            'original_release_date': self.original_release_date,
            'expected_release_year': self.expected_release_year,
            'expected_release_quarter': self.expected_release_quarter,
            'expected_release_month': self.expected_release_month,
            'expected_release_day': self.expected_release_day,
            'image': {
                'medium_url': self.image_url,
                'thumb_url': self.thumb_url,
                'icon_url': self.icon_url,
                'small_url': self.small_url,
                'super_url': self.super_url,
                'screen_url': self.screen_url,
                'screen_large_url': self.screen_large_url,
                'tiny_url': self.tiny_url
            } if any([self.image_url, self.thumb_url, self.icon_url, self.small_url, self.super_url, self.screen_url, self.screen_large_url, self.tiny_url]) else None,
            'platforms': self.platforms,
            'genres': self.genres,
            'developers': self.developers,
            'publishers': self.publishers,
            'franchises': self.franchises,
            'concepts': self.concepts,
            'themes': self.themes,
            'aliases': self.aliases,
            'site_detail_url': self.site_detail_url,
            'api_detail_url': self.api_detail_url,
            'number_of_user_reviews': self.number_of_user_reviews,
            'original_game_rating': self.original_game_rating,
            'date_added': self.date_added,
            'date_last_updated': self.date_last_updated,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def __repr__(self):
        return f'<Game {self.name}>'

class UserGame(db.Model):
    __tablename__ = 'user_games'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    game_id = db.Column(db.Integer, db.ForeignKey('games.id'), nullable=False)
    status = db.Column(db.String(20), default='want_to_play', nullable=True)  # want_to_play, playing, completed, dropped
    rating = db.Column(db.Integer, nullable=True)  # 1-10 rating
    review = db.Column(db.Text, nullable=True)
    hours_played = db.Column(db.Float, nullable=True)
    image_url = db.Column(db.String(500), nullable=True)  # Store game image for quick access
    date_added = db.Column(db.DateTime, default=datetime.utcnow)
    date_started = db.Column(db.DateTime, nullable=True)
    date_completed = db.Column(db.DateTime, nullable=True)
    
    # Ensure user can't add same game twice
    __table_args__ = (db.UniqueConstraint('user_id', 'game_id', name='unique_user_game'),)
    
    def to_dict(self):
        """Convert user_game object to dictionary"""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'game_id': self.game_id,
            'status': self.status,
            'rating': self.rating,
            'review': self.review,
            'hours_played': self.hours_played,
            'image_url': self.image_url,
            'date_added': self.date_added.isoformat() if self.date_added else None,
            'date_started': self.date_started.isoformat() if self.date_started else None,
            'date_completed': self.date_completed.isoformat() if self.date_completed else None,
            'game': self.game.to_dict() if self.game else None
        }
    
    def __repr__(self):
        return f'<UserGame {self.user_id}:{self.game_id}>'
