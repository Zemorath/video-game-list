from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from dotenv import load_dotenv
import os
from datetime import timedelta

# Load environment variables
load_dotenv()

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///game_library.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # JWT Cookie Configuration for security
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
    app.config['JWT_COOKIE_SECURE'] = os.getenv('FLASK_ENV') == 'production'  # HTTPS only in production
    app.config['JWT_COOKIE_HTTPONLY'] = True  # Prevent XSS attacks
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax'  # CSRF protection
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)  # 30 day expiration
    app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Disable CSRF for development
    # app.config['JWT_ACCESS_CSRF_HEADER_NAME'] = "X-CSRF-TOKEN"
    # app.config['JWT_ACCESS_CSRF_FIELD_NAME'] = "csrf_token"
    
    # Initialize extensions with app
    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    
    # CORS configuration with credentials support
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS(app, origins=cors_origins, supports_credentials=True)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.games import games_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(games_bp, url_prefix='/api/games')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app
