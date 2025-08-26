#!/usr/bin/env python3
"""
Test script to identify startup issues
"""
import sys
import os

print("=== STARTUP TEST ===")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

try:
    print("1. Testing basic Flask import...")
    from flask import Flask
    print("✓ Flask import successful")
    
    print("2. Testing app creation...")
    from app import create_app
    print("✓ App factory import successful")
    
    print("3. Creating app instance...")
    app = create_app()
    print("✓ App creation successful")
    
    print("4. Testing app context...")
    with app.app_context():
        print("✓ App context successful")
    
    print("5. All tests passed!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
