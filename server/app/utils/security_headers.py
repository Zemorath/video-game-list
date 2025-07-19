from functools import wraps
from flask import request, make_response
import secrets
import string

def generate_nonce():
    """Generate a random nonce for CSP"""
    return ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))

def add_security_headers(response):
    """Add security headers to all responses"""
    
    # Content Security Policy
    nonce = generate_nonce()
    csp_policy = (
        f"default-src 'self'; "
        f"script-src 'self' 'unsafe-inline' https://www.youtube.com https://www.google.com; "
        f"style-src 'self' 'unsafe-inline'; "
        f"img-src 'self' data: https: http:; "
        f"font-src 'self' data:; "
        f"connect-src 'self' https://api.rawg.io https://www.googleapis.com; "
        f"frame-src 'self' https://www.youtube.com; "
        f"media-src 'self' https:; "
        f"object-src 'none'; "
        f"base-uri 'self'; "
        f"form-action 'self'; "
        f"frame-ancestors 'none'"
    )
    
    # Security Headers
    response.headers['Content-Security-Policy'] = csp_policy
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = (
        'geolocation=(), microphone=(), camera=(), payment=(), '
        'usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
    )
    
    # HSTS (only for HTTPS)
    if request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # Remove server information
    response.headers.pop('Server', None)
    
    return response

def require_https():
    """Decorator to require HTTPS in production"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Only enforce HTTPS in production
            if not request.is_secure and request.headers.get('X-Forwarded-Proto') != 'https':
                # In development, allow HTTP
                import os
                if os.getenv('FLASK_ENV') == 'production':
                    return make_response('HTTPS required', 426)
            return f(*args, **kwargs)
        return decorated_function
    return decorator
