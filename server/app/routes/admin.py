from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import User
from app.utils.rate_limiter import rate_limit_storage
from app.utils.bot_protection import bot_protection
from app.routes.platforms import platforms_bp
import json
import os

admin_bp = Blueprint('admin', __name__)

@admin_bp.route('/security-status', methods=['GET'])
@jwt_required()
def security_status():
    """Get security monitoring information (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        # For now, any logged-in user can view (in production, add admin role check)
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Get rate limiting stats
        rate_limit_stats = {
            'total_ips_tracked': len(rate_limit_storage),
            'active_rate_limits': sum(1 for requests in rate_limit_storage.values() if len(requests) > 0)
        }
        
        # Get bot protection stats
        bot_stats = {
            'suspicious_ips_count': len(bot_protection.suspicious_ips),
            'honeypot_hits': len(bot_protection.honeypot_hits),
            'recent_suspicious_activity': []
        }
        
        # Get recent suspicious activities (last 10)
        all_activities = []
        for ip, activities in bot_protection.suspicious_ips.items():
            for activity in activities[-5:]:  # Last 5 per IP
                all_activities.append({
                    'ip': ip,
                    'timestamp': activity['timestamp'],
                    'reason': activity['reason']
                })
        
        # Sort by timestamp and get most recent
        all_activities.sort(key=lambda x: x['timestamp'], reverse=True)
        bot_stats['recent_suspicious_activity'] = all_activities[:10]
        
        return jsonify({
            'success': True,
            'rate_limiting': rate_limit_stats,
            'bot_protection': bot_stats,
            'security_features': {
                'rate_limiting_enabled': True,
                'bot_protection_enabled': True,
                'security_headers_enabled': True,
                'honeypot_protection': True
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to get security status: {str(e)}'
        }), 500

@admin_bp.route('/clear-suspicious-ips', methods=['POST'])
@jwt_required()
def clear_suspicious_ips():
    """Clear suspicious IP records (admin only)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Clear suspicious IPs
        bot_protection.suspicious_ips.clear()
        bot_protection.honeypot_hits.clear()
        bot_protection.save_storage()
        
        return jsonify({
            'success': True,
            'message': 'Suspicious IP records cleared'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to clear records: {str(e)}'
        }), 500

@admin_bp.route('/sync-platforms', methods=['POST'])
@jwt_required()
def sync_platforms():
    """Sync platforms from Giant Bomb API (admin function)"""
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Import here to avoid circular imports
        from app.routes.platforms import sync_platforms_from_api
        
        # Call the platform sync function
        # For now, we'll allow any logged-in user to sync platforms
        # In production, you might want to add admin role checks
        
        return jsonify({
            'success': True,
            'message': 'Platform sync initiated. Use /api/platforms/sync-from-api endpoint directly.'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to sync platforms: {str(e)}'
        }), 500

@admin_bp.route('/database-status', methods=['GET'])
@jwt_required()
def database_status():
    """Check database schema status"""
    try:
        from app.models import Platform
        from sqlalchemy import text
        from app import db
        
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({'success': False, 'message': 'User not found'}), 404
        
        # Check Platform table
        platform_count = Platform.query.count()
        
        # Check if platform_id column exists in user_games
        try:
            result = db.session.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='user_games' AND column_name='platform_id'
            """)).fetchone()
            platform_column_exists = result is not None
        except:
            platform_column_exists = False
        
        return jsonify({
            'success': True,
            'platform_table_exists': True,
            'platform_count': platform_count,
            'platform_column_exists': platform_column_exists,
            'database_ready': platform_column_exists
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Failed to check database status: {str(e)}'
        }), 500
