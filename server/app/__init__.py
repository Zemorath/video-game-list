from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from werkzeug.middleware.proxy_fix import ProxyFix
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
    
    # Add ProxyFix to handle headers from load balancer
    app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_port=1)
    
    # Configuration
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret')
    
    # Database configuration - prioritize PostgreSQL for production
    database_url = os.getenv('DATABASE_URL', 'sqlite:///game_library.db')
    # Fix for Railway PostgreSQL URLs (they sometimes use postgres:// instead of postgresql://)
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Production settings
    is_production = os.getenv('FLASK_ENV') == 'production'
    
    # JWT Cookie Configuration for security
    app.config['JWT_TOKEN_LOCATION'] = ['cookies']
    app.config['JWT_ACCESS_COOKIE_NAME'] = 'access_token'
    app.config['JWT_COOKIE_SECURE'] = is_production  # HTTPS only in production
    app.config['JWT_COOKIE_SAMESITE'] = 'Lax' if is_production else None
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
    from app.routes.users import users_bp
    from app.routes.youtube import youtube_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(games_bp, url_prefix='/api/games')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(youtube_bp, url_prefix='/api/youtube')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Health check endpoint for load balancer
    @app.route('/')
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'game-list-api'}, 200
    
    # Add rate limit headers to all responses
    from app.utils.rate_limiter import add_rate_limit_headers
    from app.utils.security_headers import add_security_headers
    app.after_request(add_rate_limit_headers)
    app.after_request(add_security_headers)
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    return app
