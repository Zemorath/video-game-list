from flask import Flask

# Create the simplest possible Flask app
app = Flask(__name__)

@app.route('/')
def hello():
    return {'status': 'ok', 'message': 'Simple Flask app is working'}, 200

@app.route('/health')
def health():
    return {'status': 'healthy'}, 200

if __name__ == '__main__':
    app.run(debug=False)
