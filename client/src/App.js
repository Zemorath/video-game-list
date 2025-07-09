import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import axios from 'axios';
import Home from './components/Home';
import Library from './components/Library';
import Profile from './components/Profile';
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
    <Router>
      <div className="min-h-screen bg-dark-bg text-text-primary">
        {/* Floating Left Navigation Bar */}
        <nav className="fixed top-6 left-6 w-14 bg-nav-bg rounded-2xl shadow-2xl flex flex-col items-center py-4 space-y-6 z-50">
          <Link to="/" className="group relative">
            <div className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors duration-200">
              {/* House Icon */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
              </svg>
            </div>
          </Link>
          
          <Link to="/library" className="group relative">
            <div className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors duration-200">
              {/* Three horizontal bars */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
              </svg>
            </div>
          </Link>
          
          <Link to="/profile" className="group relative">
            <div className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors duration-200">
              {/* Person Icon */}
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
          </Link>
        </nav>

        {/* Main Content Area */}
        <div className="ml-20 min-h-screen">
          {/* Top Right Search Bar */}
          <div className="fixed top-6 right-6 z-40">
            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={searchGuid}
                onChange={(e) => setSearchGuid(e.target.value)}
                placeholder="Search games..."
                className="w-64 px-4 py-2 bg-card-bg text-text-primary placeholder-text-secondary border border-accent-gray rounded-xl focus:outline-none focus:border-text-secondary transition-colors duration-200"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-accent-gray hover:bg-hover-gray text-text-primary rounded-xl transition-colors duration-200 font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Page Content */}
          <div className="pt-20 px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library games={games} removeGame={removeGame} />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;