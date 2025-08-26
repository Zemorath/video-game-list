from functools import wraps
from flask import request, jsonify, g
from datetime import datetime, timedelta
import json
import os
import tempfile

# In-memory rate limiting storage (in production, use Redis)
rate_limit_storage = {}

class RateLimiter:
    def __init__(self, max_requests=10, window_minutes=1, storage_file=None):
        self.max_requests = max_requests
        self.window_minutes = window_minutes
        # Use temp directory for file storage to avoid permission issues
        if storage_file is None:
            temp_dir = tempfile.gettempdir()
            self.storage_file = os.path.join(temp_dir, 'rate_limits.json')
        else:
            self.storage_file = storage_file
        self.load_storage()
    
    def load_storage(self):
        """Load rate limit data from file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    # Convert string timestamps back to datetime objects
                    for ip, requests in data.items():
                        rate_limit_storage[ip] = [
                            datetime.fromisoformat(ts) for ts in requests
                        ]
        except Exception as e:
            print(f"Error loading rate limit storage: {e}")
    
    def save_storage(self):
        """Save rate limit data to file"""
        try:
            # Convert datetime objects to strings for JSON serialization
            data = {}
            for ip, requests in rate_limit_storage.items():
                data[ip] = [ts.isoformat() for ts in requests]
            
            with open(self.storage_file, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            print(f"Error saving rate limit storage: {e}")
    
    def is_rate_limited(self, identifier):
        """Check if the identifier (IP) is rate limited"""
        now = datetime.utcnow()
        window_start = now - timedelta(minutes=self.window_minutes)
        
        # Get existing requests for this identifier
        if identifier not in rate_limit_storage:
            rate_limit_storage[identifier] = []
        
        # Remove old requests outside the window
        rate_limit_storage[identifier] = [
            ts for ts in rate_limit_storage[identifier] if ts > window_start
        ]
        
        # Check if limit exceeded
        if len(rate_limit_storage[identifier]) >= self.max_requests:
            return True
        
        # Add current request
        rate_limit_storage[identifier].append(now)
        self.save_storage()
        
        return False
    
    def get_remaining_requests(self, identifier):
        """Get remaining requests for the identifier"""
        if identifier not in rate_limit_storage:
            return self.max_requests
        
        return max(0, self.max_requests - len(rate_limit_storage[identifier]))

# Rate limiter instances for different endpoints
search_limiter = RateLimiter(max_requests=20, window_minutes=1)  # 20 searches per minute
auth_limiter = RateLimiter(max_requests=5, window_minutes=5)     # 5 auth attempts per 5 minutes
api_limiter = RateLimiter(max_requests=100, window_minutes=1)    # 100 API calls per minute

def rate_limit(limiter):
    """Decorator for rate limiting endpoints"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get client IP
            client_ip = request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
            
            # Check rate limit
            if limiter.is_rate_limited(client_ip):
                return jsonify({
                    'success': False,
                    'message': 'Rate limit exceeded. Please try again later.',
                    'retry_after': limiter.window_minutes * 60
                }), 429
            
            # Add rate limit headers
            g.rate_limit_remaining = limiter.get_remaining_requests(client_ip)
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def add_rate_limit_headers(response):
    """Add rate limit headers to response"""
    if hasattr(g, 'rate_limit_remaining'):
        response.headers['X-RateLimit-Remaining'] = str(g.rate_limit_remaining)
    return response
