#!/usr/bin/env python3
"""
Minimal WSGI app for testing EB deployment
"""

def application(environ, start_response):
    """Minimal WSGI application"""
    status = '200 OK'
    headers = [('Content-type', 'text/plain')]
    start_response(status, headers)
    return [b'Hello from minimal WSGI app - EB is working!']

# Also create a Flask version for testing
try:
    from flask import Flask
    app = Flask(__name__)
    
    @app.route('/')
    @app.route('/health')
    def hello():
        return 'Hello from minimal Flask app - working!'
        
except Exception as e:
    print(f"Flask import failed: {e}")
    # Fall back to raw WSGI
    app = application
