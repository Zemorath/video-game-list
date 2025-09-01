import re
import hashlib
import time
from datetime import datetime, timedelta
from flask import request
import json
import os
import tempfile

class BotProtection:
    def __init__(self):
        self.suspicious_ips = {}
        self.honeypot_hits = {}
        # Use temp directory for file storage to avoid permission issues
        temp_dir = tempfile.gettempdir()
        self.storage_file = os.path.join(temp_dir, 'bot_protection.json')
        self.load_storage()
    
    def load_storage(self):
        """Load bot protection data from file"""
        try:
            if os.path.exists(self.storage_file):
                with open(self.storage_file, 'r') as f:
                    data = json.load(f)
                    self.suspicious_ips = data.get('suspicious_ips', {})
                    self.honeypot_hits = data.get('honeypot_hits', {})
        except Exception as e:
            print(f"Error loading bot protection storage: {e}")
    
    def save_storage(self):
        """Save bot protection data to file"""
        try:
            data = {
                'suspicious_ips': self.suspicious_ips,
                'honeypot_hits': self.honeypot_hits
            }
            with open(self.storage_file, 'w') as f:
                json.dump(data, f)
        except Exception as e:
            print(f"Error saving bot protection storage: {e}")
    
    def is_suspicious_user_agent(self, user_agent):
        """Check if user agent looks like a bot"""
        if not user_agent:
            return True
        
        # Common bot patterns
        bot_patterns = [
            r'bot', r'crawler', r'spider', r'scraper', r'curl', r'wget',
            r'python-requests', r'python-urllib', r'automated', r'headless'
        ]
        
        user_agent_lower = user_agent.lower()
        
        for pattern in bot_patterns:
            if re.search(pattern, user_agent_lower):
                return True
        
        # Check for very short or very long user agents
        if len(user_agent) < 20 or len(user_agent) > 500:
            return True
        
        return False
    
    def check_form_timing(self, form_timestamp):
        """Check if form was filled too quickly (likely bot)"""
        try:
            submitted_time = float(form_timestamp)
            current_time = time.time()
            fill_time = current_time - submitted_time
            
            # If form was filled in less than 3 seconds, it's suspicious
            if fill_time < 3:
                return False
            
            # If form was kept open for more than 30 minutes, regenerate
            if fill_time > 1800:
                return False
            
            return True
        except (ValueError, TypeError):
            return False
    
    def validate_email_pattern(self, email):
        """Check for suspicious email patterns"""
        if not email:
            return False
        
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return False
        
        # Check for truly suspicious patterns (made less restrictive)
        suspicious_patterns = [
            r'test.*@',    # test emails
            r'temp.*@',    # temporary emails
            r'^\d{10,}@',  # emails starting with many numbers (10+)
            r'@fake',      # fake domains
            r'@temp',      # temporary domains
        ]
        
        for pattern in suspicious_patterns:
            if re.search(pattern, email.lower()):
                return False
        
        # Check for disposable email domains
        disposable_domains = [
            '10minutemail.com', 'tempmail.org', 'guerrillamail.com',
            'mailinator.com', 'yopmail.com', 'temp-mail.org'
        ]
        
        domain = email.split('@')[1].lower()
        if domain in disposable_domains:
            return False
        
        return True
    
    def generate_honeypot_field(self):
        """Generate a honeypot field name"""
        # Generate a field name that looks legitimate but should be left empty
        honeypot_names = ['company', 'phone_number', 'website_url', 'referrer']
        timestamp = str(int(time.time()))
        field_name = f"{honeypot_names[int(timestamp[-1]) % len(honeypot_names)]}_{timestamp[-4:]}"
        return field_name
    
    def check_honeypot(self, form_data, expected_honeypot_field):
        """Check if honeypot field was filled (indicating bot)"""
        if expected_honeypot_field in form_data:
            value = form_data.get(expected_honeypot_field, '').strip()
            if value:  # If honeypot field has any value, it's a bot
                return False
        return True
    
    def mark_suspicious_ip(self, ip_address, reason):
        """Mark an IP as suspicious"""
        if ip_address not in self.suspicious_ips:
            self.suspicious_ips[ip_address] = []
        
        self.suspicious_ips[ip_address].append({
            'timestamp': datetime.utcnow().isoformat(),
            'reason': reason
        })
        
        self.save_storage()
    
    def is_ip_blocked(self, ip_address):
        """Check if IP should be blocked based on suspicious activity"""
        if ip_address not in self.suspicious_ips:
            return False
        
        # Block if more than 5 suspicious activities in the last hour
        recent_activities = []
        cutoff_time = datetime.utcnow() - timedelta(hours=1)
        
        for activity in self.suspicious_ips[ip_address]:
            activity_time = datetime.fromisoformat(activity['timestamp'])
            if activity_time > cutoff_time:
                recent_activities.append(activity)
        
        return len(recent_activities) >= 5
    
    def validate_registration_form(self, form_data, ip_address, user_agent):
        """Comprehensive bot validation for registration"""
        errors = []
        
        # Check user agent
        if self.is_suspicious_user_agent(user_agent):
            self.mark_suspicious_ip(ip_address, 'Suspicious user agent')
            errors.append('Invalid browser detected')
        
        # Check form timing
        if 'form_timestamp' in form_data:
            if not self.check_form_timing(form_data['form_timestamp']):
                self.mark_suspicious_ip(ip_address, 'Suspicious form timing')
                errors.append('Form submitted too quickly')
        
        # Check email pattern
        email = form_data.get('email', '')
        if not self.validate_email_pattern(email):
            self.mark_suspicious_ip(ip_address, 'Suspicious email pattern')
            errors.append('Invalid email address')
        
        # Check honeypot
        honeypot_field = form_data.get('honeypot_field', '')
        if honeypot_field and not self.check_honeypot(form_data, honeypot_field):
            self.mark_suspicious_ip(ip_address, 'Honeypot field filled')
            errors.append('Automated submission detected')
        
        # Check if IP is blocked
        if self.is_ip_blocked(ip_address):
            errors.append('Too many suspicious activities detected')
        
        return len(errors) == 0, errors

# Global bot protection instance
bot_protection = BotProtection()
