from flask import Flask, jsonify
import os
import requests

app = Flask(__name__)

API_KEY = '[YOUR API KEY]'  # Replace with your Giant Bomb API key
API_BASE_URL = 'https://www.giantbomb.com/api/game/'

@app.route('/api/game/<guid>', methods=['GET'])
def get_game(guid):
    url = f'{API_BASE_URL}{guid}/?api_key={API_KEY}&format=json'
    response = requests.get(url)
    if response.status_code == 200:
        return jsonify(response.json())
    else:
        return jsonify({'error': 'Failed to fetch game data'}), response.status_code

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)