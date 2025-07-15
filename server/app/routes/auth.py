from flask import Blueprint, request, jsonify, make_response
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, unset_jwt_cookies
from marshmallow import Schema, fields, ValidationError, validates, validates_schema
from email_validator import validate_email, EmailNotValidError
from app import db, bcrypt
from app.models import User
import re

auth_bp = Blueprint('auth', __name__)

class UserRegistrationSchema(Schema):
    username = fields.Str(required=True, validate=lambda x: len(x.strip()) >= 3)
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=lambda x: len(x) >= 8)
    confirm_password = fields.Str(required=True)
    first_name = fields.Str(required=False, allow_none=True, validate=lambda x: len(x.strip()) <= 50 if x else True)
    last_name = fields.Str(required=False, allow_none=True, validate=lambda x: len(x.strip()) <= 50 if x else True)
    
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
def register():
    """Register a new user"""
    try:
        # Validate input data
        schema = UserRegistrationSchema()
        data = schema.load(request.get_json())
        
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
            secure=False,  # Set to True in production with HTTPS
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
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': 'Registration failed',
            'error': str(e)
        }), 500

@auth_bp.route('/login', methods=['POST'])
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
            secure=False,  # Set to True in production with HTTPS
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
        
        return jsonify({
            'success': True,
            'user': user.to_dict()
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
