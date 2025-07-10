import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import axios from 'axios';
import Home from './components/Home';
import Library from './components/Library';
import Profile from './components/Profile';
import GameDetail from './components/GameDetail';
import './styles/App.css';

function App() {
  const [games, setGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const API_KEY = process.env.REACT_APP_GIANT_BOMB_API_KEY;
  const API_BASE_URL = process.env.REACT_APP_GIANT_BOMB_API_URL;

  useEffect(() => {
    // Debug environment variables
    console.log('Environment check:');
    console.log('API_KEY:', API_KEY ? 'Loaded' : 'Missing');
    console.log('API_BASE_URL:', API_BASE_URL);
  }, [API_KEY, API_BASE_URL]);

  const searchGames = async (query) => {
    console.log('API_KEY:', API_KEY);
    console.log('API_BASE_URL:', API_BASE_URL);
    
    try {
      // Using CORS proxy to bypass browser restrictions
      const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
      const apiUrl = `${API_BASE_URL}/games/?api_key=${API_KEY}&format=json&filter=name:${encodeURIComponent(query)}&limit=10`;
      const url = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
      
      console.log('Making request to:', url);
      
      const response = await axios.get(url);
      console.log('Response:', response.data);
      setSearchResults(response.data.results || []);
    } catch (error) {
      console.error('Error searching games:', error);
      console.error('Error details:', error.response?.data);
    }
  };

  const viewGameDetail = (game) => {
    window.location.href = `/game/${game.guid}`;
  };

  const removeGame = (guid) => {
    setGames(games.filter(game => game.guid !== guid));
  };

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      searchGames(searchQuery);
    }
  };

  return (
    <Router>
      <div className="min-h-screen bg-dark-bg text-text-primary">
        {/* Floating Left Navigation Bar - Centered on left side */}
        <nav className="fixed top-1/2 left-6 transform -translate-y-1/2 w-14 bg-nav-bg rounded-2xl shadow-2xl flex flex-col items-center py-4 space-y-6 z-50">
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
          {/* Centered Search Bar */}
          <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearch}
                placeholder="Search games..."
                className="w-[500px] px-6 py-3 bg-card-bg text-text-primary placeholder-text-secondary border border-accent-gray rounded-xl focus:outline-none focus:border-text-secondary transition-colors duration-200 text-center"
              />
              
              {/* Search Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute top-full mt-2 w-full bg-card-bg border border-accent-gray rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
                  {searchResults.map((game) => (
                    <div
                      key={game.guid}
                      onClick={() => viewGameDetail(game)}
                      className="p-4 hover:bg-hover-gray cursor-pointer border-b border-accent-gray last:border-b-0 flex items-center space-x-3"
                    >
                      {game.image && (
                        <img 
                          src={game.image.thumb_url} 
                          alt={game.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 text-left">
                        <h4 className="text-text-primary font-medium">{game.name}</h4>
                        <p className="text-text-secondary text-sm">
                          {game.original_release_date ? new Date(game.original_release_date).getFullYear() : 'TBA'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Page Content */}
          <div className="pt-32 px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/library" element={<Library games={games} removeGame={removeGame} />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/game/:guid" element={<GameDetail />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;