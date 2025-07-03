import React, { useState, useEffect } from 'react';
import axios from 'axios';
import GameList from './components/GameList';
import './styles/App.css';

function App() {
  const [games, setGames] = useState([]);
  const [searchGuid, setSearchGuid] = useState('');
  const API_KEY = '[YOUR API KEY]'; // Replace with your Giant Bomb API key
  const API_BASE_URL = 'https://www.giantbomb.com/api/game/';

  useEffect(() => {
    // Initial load (optional)
  }, []);

  const fetchGame = async (guid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}${guid}/?api_key=${API_KEY}&format=json`);
      const gameData = response.data.results;
      setGames((prevGames) => [...prevGames, gameData]);
    } catch (error) {
      console.error('Error fetching game:', error);
    }
  };

  const removeGame = (guid) => {
    setGames(games.filter(game => game.guid !== guid));
  };

  const handleSearch = () => {
    if (searchGuid) fetchGame(searchGuid);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Game List</h1>
      <div className="mb-4">
        <input
          type="text"
          value={searchGuid}
          onChange={(e) => setSearchGuid(e.target.value)}
          placeholder="Enter Game GUID"
          className="p-2 border rounded"
        />
        <button
          onClick={handleSearch}
          className="ml-2 p-2 bg-blue-500 text-white rounded"
        >
          Add Game
        </button>
      </div>
      <GameList games={games} removeGame={removeGame} />
    </div>
  );
}

export default App;