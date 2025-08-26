import traceback
import sys

try:
    print("Starting WSGI app initialization...")
    from app import create_app
    print("Successfully imported create_app")
    
    app = create_app()
    print("Successfully created Flask app")
    
except Exception as e:
    print(f"ERROR during app creation: {e}")
    traceback.print_exc()
    # Create a minimal error app so we can see what's wrong
    from flask import Flask
    app = Flask(__name__)
    
    @app.route('/')
    def error_info():
        return {
            'error': str(e),
            'message': 'App creation failed - check logs'
        }, 500

if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=5000)
