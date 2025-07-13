import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { gamesAPI } from '../services/api';
import axios from 'axios';

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addedGames, setAddedGames] = useState(new Set()); // Track added games
  const [showConfirmation, setShowConfirmation] = useState({}); // Track confirmation animations
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const query = searchParams.get('q');
  const API_KEY = process.env.REACT_APP_GIANT_BOMB_API_KEY;
  const API_BASE_URL = process.env.REACT_APP_GIANT_BOMB_API_URL;

  useEffect(() => {
    const searchGamesEffect = async (searchQuery) => {
      if (!searchQuery.trim()) return;

      console.log('Search Query:', searchQuery);
      
      try {
        setLoading(true);
        setError('');
        setGames([]);
        
        // First, search local database
        console.log('Searching local database for:', searchQuery);
        const localResults = await gamesAPI.searchLocalGames(searchQuery, 50);
        
        if (localResults.success && localResults.games.length > 0) {
          console.log(`Found ${localResults.games.length} games in local database`);
          setGames(localResults.games);
          setLoading(false);
          return;
        }
        
        console.log('No local results found, searching Giant Bomb API...');
        
        // If no local results, search Giant Bomb API
        const apiUrl = `${API_BASE_URL}/search/?api_key=${API_KEY}&format=json&query=${encodeURIComponent(searchQuery)}&resources=game&limit=20`;
        
        console.log('API URL:', apiUrl);
        console.log('API_KEY available:', !!API_KEY);
        console.log('API_BASE_URL:', API_BASE_URL);
        
        // Try multiple CORS proxy services with increased timeout
        const proxies = [
          'https://corsproxy.io/?',
          'https://cors-anywhere.herokuapp.com/',
          'https://api.allorigins.win/get?url=',
          'https://api.codetabs.com/v1/proxy?quest=',
          'https://thingproxy.freeboard.io/fetch/',
          '' // Direct attempt (will likely fail due to CORS but worth trying)
        ];
        
        for (let i = 0; i < proxies.length; i++) {
          try {
            const proxy = proxies[i];
            let url;
            
            if (proxy.includes('allorigins.win')) {
              url = `${proxy}${encodeURIComponent(apiUrl)}`;
            } else if (proxy.includes('corsproxy.io')) {
              url = `${proxy}${encodeURIComponent(apiUrl)}`;
            } else if (proxy.includes('cors-anywhere.herokuapp.com')) {
              url = `${proxy}${apiUrl}`;
            } else if (proxy === '') {
              // Direct attempt without proxy
              url = apiUrl;
            } else {
              url = `${proxy}${apiUrl}`;
            }
            
            console.log(`Trying proxy ${i + 1}:`, url);
            
            const response = await axios.get(url, {
              timeout: 30000, // 30 second timeout for large result sets
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
              }
            });
            
            let data;
            if (proxy.includes('allorigins.win')) {
              data = JSON.parse(response.data.contents);
            } else if (proxy.includes('corsproxy.io')) {
              data = response.data;
            } else {
              data = response.data;
            }
            
            console.log('Giant Bomb search results:', data);
            
            const searchResults = data.results || [];
            if (searchResults.length > 0) {
              // Cache the results to local database
              try {
                console.log(`Caching ${searchResults.length} games to local database...`);
                const cacheResponse = await gamesAPI.cacheSearchResults(searchResults);
                if (cacheResponse.success) {
                  console.log(`Successfully cached ${cacheResponse.cached_count} games`);
                  // Use the cached games (which have local IDs and proper structure)
                  setGames(cacheResponse.games);
                } else {
                  console.warn('Failed to cache results, using API results directly');
                  setGames(searchResults);
                }
              } catch (cacheError) {
                console.error('Error caching results:', cacheError);
                // Fall back to using API results directly
                setGames(searchResults);
              }
            } else {
              setGames([]);
            }
            return; // Success, exit the loop
            
          } catch (proxyError) {
            console.error(`Proxy ${i + 1} failed:`, proxyError.message);
            if (i === proxies.length - 1) {
              throw new Error(`All ${proxies.length} CORS proxies failed. This may be due to network issues or proxy service outages.`);
            }
          }
        }
        
      } catch (error) {
        console.error('Error searching games:', error);
        setError(`Failed to search games: ${error.message}. Please try again later.`);
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      searchGamesEffect(query);
    }
  }, [query, API_KEY, API_BASE_URL]);

  const addToCollection = async (game) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }

    try {
      console.log('Adding game to collection:', game);
      
      let response;
      
      // Check if this game came from our local database (has local id) or from Giant Bomb API
      if (game.id && typeof game.id === 'number') {
        // Game is already in our database, use the simpler add endpoint
        console.log('Using local database game with ID:', game.id);
        response = await gamesAPI.addExistingGameToLibrary(game.guid, 'want_to_play');
      } else {
        // Game came directly from Giant Bomb API, use add-external endpoint
        console.log('Adding external game from Giant Bomb API');
        const gameData = {
          guid: game.guid,
          name: game.name,
          description: game.description || '',
          original_release_date: game.original_release_date,
          image: game.image,
          platforms: game.platforms,
          status: 'want_to_play'
        };
        response = await gamesAPI.addGameToLibrary(gameData);
      }
      
      if (response.success) {
        // Add to added games set
        setAddedGames(prev => new Set([...prev, game.guid]));
        
        // Show confirmation animation
        setShowConfirmation(prev => ({ ...prev, [game.guid]: true }));
        
        // Hide confirmation after animation
        setTimeout(() => {
          setShowConfirmation(prev => ({ ...prev, [game.guid]: false }));
        }, 2000);
      } else {
        alert(response.message || 'Failed to add game to collection');
      }
    } catch (error) {
      console.error('Error adding game to collection:', error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert('Failed to add game to collection');
      }
    }
  };

  const viewGameDetail = (game) => {
    navigate(`/game/${game.guid}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-primary mx-auto mb-4"></div>
            <p className="text-white text-lg">Searching for "{query}"...</p>
            <p className="text-gray-400 text-sm mt-2">This may take a moment for large result sets</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-light text-white mb-2">
            Search Results
          </h1>
          <p className="text-gray-400 text-lg">
            {query ? `Results for "${query}"` : 'Enter a search term to find games'}
            {games.length > 0 && ` (${games.length} games found)`}
          </p>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            <div className="font-medium mb-2">Search Error</div>
            <div className="text-sm">{error}</div>
            {error.includes('proxies failed') && (
              <div className="mt-3 text-xs text-red-300">
                <strong>Possible solutions:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Check your internet connection</li>
                  <li>Try searching for a different game</li>
                  <li>The Giant Bomb API or proxy services may be temporarily down</li>
                </ul>
              </div>
            )}
          </div>
        )}

        {!query ? (
          <div className="text-center py-12">
            <div className="bg-card-bg rounded-2xl p-8 max-w-md mx-auto">
              <h3 className="text-xl font-medium text-white mb-2">No search query</h3>
              <p className="text-gray-400 mb-4">
                Use the search bar above to find games, or try some popular searches:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => navigate('/search?q=zelda')}
                  className="bg-accent-primary hover:bg-accent-secondary text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  Zelda
                </button>
                <button
                  onClick={() => navigate('/search?q=mario')}
                  className="bg-accent-primary hover:bg-accent-secondary text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  Mario
                </button>
                <button
                  onClick={() => navigate('/search?q=final fantasy')}
                  className="bg-accent-primary hover:bg-accent-secondary text-white px-3 py-1 rounded-lg text-sm transition-colors"
                >
                  Final Fantasy
                </button>
              </div>
            </div>
          </div>
        ) : games.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {games.map((game) => (
              <div
                key={game.guid}
                className="bg-card-bg rounded-xl overflow-hidden hover:bg-hover-gray transition-all duration-200 group relative"
              >
                {/* Added confirmation popup */}
                {showConfirmation[game.guid] && (
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-20 animate-bounce-in">
                    <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                      Added!
                    </div>
                  </div>
                )}
                
                <div className="aspect-square bg-dark-secondary relative overflow-hidden">
                  {game.image ? (
                    <img
                      src={game.image.medium_url || game.image.small_url || game.image.thumb_url}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        e.target.src = game.image.thumb_url;
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* Green checkmark for added games */}
                  {addedGames.has(game.guid) && (
                    <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => viewGameDetail(game)}
                        className="bg-accent-primary hover:bg-accent-secondary text-white px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        View
                      </button>
                      <button
                        onClick={() => addToCollection(game)}
                        disabled={addedGames.has(game.guid)}
                        className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                          addedGames.has(game.guid)
                            ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {addedGames.has(game.guid) ? 'Added' : 'Add'}
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-3">
                  <h3 className="text-white font-medium text-sm leading-tight line-clamp-2">
                    {game.name}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">
                    {game.original_release_date 
                      ? new Date(game.original_release_date).getFullYear()
                      : 'TBA'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && query && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-lg">
                No games found for "{query}"
              </div>
              <p className="text-gray-500 text-sm mt-2">
                Try adjusting your search terms or check spelling
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default SearchResults;
