from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies
from marshmallow import Schema, fields, ValidationError, validates, validates_schema, EXCLUDE
from email_validator import validate_email, EmailNotValidError
from app import db, bcrypt
from app.models import User
from app.utils.rate_limiter import rate_limit, auth_limiter
from app.utils.bot_protection import bot_protection
import re
import time

auth_bp = Blueprint('auth', __name__)

# Temporary test endpoint for debugging
@auth_bp.route('/test-register', methods=['POST'])
def test_register():
    """Test registration without bot protection for debugging"""
    try:
        json_data = request.get_json()
        print(f"Test registration data: {json_data}")
        
        if not json_data:
            return jsonify({'success': False, 'message': 'No data provided'}), 400
            
        # Just validate the schema without bot protection
        schema = UserRegistrationSchema()
        data = schema.load(json_data)
        
        return jsonify({
            'success': True,
            'message': 'Validation passed (test endpoint)',
            'data': data
        }), 200
        
    except ValidationError as e:
        print(f"Test validation error: {e.messages}")
        return jsonify({
            'success': False,
            'message': 'Validation error',
            'errors': e.messages
        }), 400
    except Exception as e:
        print(f"Test registration error: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Test failed',
            'error': str(e)
        }), 500

class UserRegistrationSchema(Schema):
    class Meta:
        unknown = EXCLUDE  # This will ignore unknown fields instead of raising an error
    
    username = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 3)
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=lambda x: len(x) >= 8)
    confirm_password = fields.Str(required=True)
    first_name = fields.Str(required=False, allow_none=True, validate=lambda x: len(x.strip()) <= 50 if x else True)
    last_name = fields.Str(required=False, allow_none=True, validate=lambda x: len(x.strip()) <= 50 if x else True)
    
    # Bot protection fields (optional, will be processed separately)
    form_timestamp = fields.Float(required=False, allow_none=True)
    honeypot_field = fields.Str(required=False, allow_none=True)
    
    @validates('username')
    def validate_username(self, value):
        if not re.match(r'^[a-zA-Z0-9_]+$', value.strip()):
            raise ValidationError('Username can only contain letters, numbers, and underscores')
        
        # Check if username already exists
        if User.query.filter_by(username=value.strip().lower()).first():
            raise ValidationError('Username already exists')
    
    @validates('email')
    def validate_email_unique(self, value):
        # Check if email already exists
        if User.query.filter_by(email=value.lower()).first():
            raise ValidationError('Email already registered')
    
    @validates('password')
    def validate_password_strength(self, value):
        if not re.search(r'[A-Z]', value):
            raise ValidationError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', value):
            raise ValidationError('Password must contain at least one lowercase letter')
        if not re.search(r'\d', value):
            raise ValidationError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', value):
            raise ValidationError('Password must contain at least one special character')
    
    @validates_schema
    def validate_passwords_match(self, data, **kwargs):
        if data.get('password') != data.get('confirm_password'):
            raise ValidationError('Passwords do not match', field_name='confirm_password')

class UserLoginSchema(Schema):
    username_or_email = fields.Str(required=True)
    password = fields.Str(required=True)

@auth_bp.route('/register', methods=['POST'])
@rate_limit(auth_limiter)
def register():
    """Register a new user with bot protection"""
    try:
        # Get client info
        client_ip = request.environ.get('HTTP_X_REAL_IP', request.remote_addr)
        user_agent = request.headers.get('User-Agent', '')
        
        # Get form data
        json_data = request.get_json()
        print(f"Registration attempt from {client_ip} with data: {json_data}")
        
        if not json_data:
            print("No JSON data provided in registration request")
            return jsonify({
                'success': False,
                'message': 'No data provided'
            }), 400
        
        # Bot protection validation
        is_valid, bot_errors = bot_protection.validate_registration_form(
            json_data, client_ip, user_agent
        )
        
        if not is_valid:
            print(f"Bot protection failed: {bot_errors}")
            return jsonify({
                'success': False,
                'message': 'Registration validation failed',
                'errors': bot_errors
            }), 400
        
        # Validate input data
        schema = UserRegistrationSchema()
        data = schema.load(json_data)
        
        # Create new user
        user = User(
            username=data['username'].strip().lower(),
            email=data['email'].lower(),
            first_name=data.get('first_name', '').strip() if data.get('first_name') else None,
            last_name=data.get('last_name', '').strip() if data.get('last_name') else None
        )
        user.set_password(data['password'])
        
        # Save to database
        db.session.add(user)
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        # Create response with cookie
        response = make_response(jsonify({
            'success': True,
            'message': 'User registered successfully',
            'user': user.to_dict()
        }), 201)
        
        # Set the JWT cookie
        response.set_cookie(
            'access_token',
            access_token,
            max_age=30*24*60*60,  # 30 days
            httponly=True,
            secure=True,  # Set to True in production with HTTPS
            samesite='Lax'
        )
        
        return response
        
    except ValidationError as e:
        print(f"Validation error in registration: {e.messages}")
        return jsonify({
            'success': False,
            'message': 'Validation error',
            'errors': e.messages
        }), 400
    except Exception as e:
        print(f"Registration error: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Registration failed',
            'error': str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
@rate_limit(auth_limiter)
def login():
    """Login user"""
    try:
        # Validate input data
        schema = UserLoginSchema()
        data = schema.load(request.get_json())
        
        username_or_email = data['username_or_email'].strip().lower()
        password = data['password']
        
        # Find user by username or email
        user = User.query.filter(
            (User.username == username_or_email) | 
            (User.email == username_or_email)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({
                'success': False,
                'message': 'Invalid credentials'
            }), 401
        
        if not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Account is deactivated'
            }), 401
        
        # Create access token
        access_token = create_access_token(identity=str(user.id))
        
        # Create response with cookie
        response = make_response(jsonify({
            'success': True,
            'message': 'Login successful',
            'user': user.to_dict()
        }), 200)
        
        # Set the JWT cookie
        response.set_cookie(
            'access_token',
            access_token,
            max_age=30*24*60*60,  # 30 days
            httponly=True,
            secure=True,  # Set to True in production with HTTPS
            samesite='Lax'
        )
        
        return response
        
    except ValidationError as e:
        return jsonify({
            'success': False,
            'message': 'Validation error',
            'errors': e.messages
        }), 400
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Login failed',
            'error': str(e)
        }), 500

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'message': 'User not found'
            }), 404
        
        profile_data = user.to_dict()
        profile_data['follower_count'] = user.get_follower_count()
        profile_data['following_count'] = user.get_following_count()
        
        return jsonify({
            'success': True,
            'user': profile_data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Failed to get profile',
            'error': str(e)
        }), 500

@auth_bp.route('/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify if token is valid"""
    try:
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        
        if not user or not user.is_active:
            return jsonify({
                'success': False,
                'message': 'Invalid token'
            }), 401
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Token verification failed'
        }), 401

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user and clear cookies"""
    try:
        response = make_response(jsonify({
            'success': True,
            'message': 'Logged out successfully'
        }), 200)
        
        # Clear the JWT cookies
        unset_jwt_cookies(response)
        
        return response
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': 'Logout failed'
        }), 500
