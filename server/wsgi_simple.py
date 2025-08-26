from flask import Flask

# Ultra simple Flask app
app = Flask(__name__)

@app.route('/')
def root():
    return "OK"

@app.route('/health')  
def health():
    return "OK"

if __name__ == "__main__":
    app.run(debug=False)
