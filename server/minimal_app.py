from flask import Flask
import os

def create_minimal_app():
    """Minimal app factory for testing"""
    app = Flask(__name__)
    
    # Basic config only
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'test-secret')
    
    @app.route('/')
    @app.route('/health')
    def health_check():
        return {'status': 'healthy', 'service': 'minimal-game-list-api'}, 200
    
    return app
