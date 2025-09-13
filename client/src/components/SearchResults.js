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
  const [flippedCards, setFlippedCards] = useState(new Set()); // Track which cards are flipped
  const [gameDetails, setGameDetails] = useState({}); // Store game details form data
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const query = searchParams.get('q');
  const API_KEY = process.env.REACT_APP_GIANT_BOMB_API_KEY;
  const API_BASE_URL = process.env.REACT_APP_GIANT_BOMB_API_URL;

  useEffect(() => {
    const searchGamesEffect = async (searchQuery) => {
      if (!searchQuery.trim()) return;

      console.log('Search Query:', searchQuery);
      
      let localGames = []; // Declare outside try block for broader scope
      
      try {
        setLoading(true);
        setError('');
        setGames([]);
        
        // Search both local database and Giant Bomb API for comprehensive results
        console.log('Searching local database for:', searchQuery);
        const localResults = await gamesAPI.searchLocalGames(searchQuery, 50);
        
        if (localResults.success && localResults.games.length > 0) {
          console.log(`Found ${localResults.games.length} games in local database`);
          localGames = localResults.games;
        }
        
        // Always also search Giant Bomb API for additional results
        console.log('Searching Giant Bomb API for additional results...');
        
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
            
            // Combine local results with API results, removing duplicates
            let combinedResults = [...localGames];
            
            if (searchResults.length > 0) {
              // Cache the API results to local database
              try {
                console.log(`Caching ${searchResults.length} games to local database...`);
                const cacheResponse = await gamesAPI.cacheSearchResults(searchResults);
                if (cacheResponse.success) {
                  console.log(`Successfully cached ${cacheResponse.cached_count} games`);
                  
                  // Add new cached games to combined results, avoiding duplicates
                  const existingGuids = new Set(localGames.map(game => game.guid));
                  const newGames = cacheResponse.games.filter(game => !existingGuids.has(game.guid));
                  combinedResults = [...combinedResults, ...newGames];
                } else {
                  console.warn('Failed to cache results, using API results directly');
                  // Add API results directly, avoiding duplicates
                  const existingGuids = new Set(localGames.map(game => game.guid));
                  const newGames = searchResults.filter(game => !existingGuids.has(game.guid));
                  combinedResults = [...combinedResults, ...newGames];
                }
              } catch (cacheError) {
                console.error('Error caching results:', cacheError);
                // Fall back to using API results directly, avoiding duplicates
                const existingGuids = new Set(localGames.map(game => game.guid));
                const newGames = searchResults.filter(game => !existingGuids.has(game.guid));
                combinedResults = [...combinedResults, ...newGames];
              }
            }
            
            console.log(`Combined results: ${localGames.length} local + ${combinedResults.length - localGames.length} new = ${combinedResults.length} total`);
            setGames(combinedResults);
            return; // Success, exit the loop
            
          } catch (proxyError) {
            console.error(`Proxy ${i + 1} failed:`, proxyError.message);
            if (i === proxies.length - 1) {
              // All proxies failed, but we might still have local results
              if (localGames.length > 0) {
                console.log(`API search failed, but showing ${localGames.length} local results`);
                setGames(localGames);
                setError('API search unavailable, showing local results only. Some games may not appear in search.');
                return;
              } else {
                throw new Error(`All ${proxies.length} CORS proxies failed. This may be due to network issues or proxy service outages.`);
              }
            }
          }
        }
        
      } catch (error) {
        console.error('Error searching games:', error);
        
        // If we have local results, show them even if API failed
        if (localGames.length > 0) {
          console.log(`Search error occurred, but showing ${localGames.length} local results`);
          setGames(localGames);
          setError('API search unavailable, showing local results only. Some games may not appear in search.');
        } else {
          setError(`Failed to search games: ${error.message}. Please try again later.`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (query) {
      searchGamesEffect(query);
    }
  }, [query, API_KEY, API_BASE_URL]);

  // Handle card flip to show details form
  const flipCard = (gameGuid) => {
    setFlippedCards(prev => new Set([...prev, gameGuid]));
    // Initialize form data for this game
    if (!gameDetails[gameGuid]) {
      setGameDetails(prev => ({
        ...prev,
        [gameGuid]: {
          status: 'want_to_play',
          rating: '',
          hours_played: '',
          platform_id: ''
        }
      }));
    }
  };

  // Handle form input changes
  const updateGameDetails = (gameGuid, field, value) => {
    setGameDetails(prev => ({
      ...prev,
      [gameGuid]: {
        ...prev[gameGuid],
        [field]: value
      }
    }));
  };

  // Handle form submission with details
  const submitGameWithDetails = async (game) => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    
    const details = gameDetails[game.guid] || {};
    
    try {
      let response;
      
      // Prepare game data with details
      if (game.id && typeof game.id === 'number') {
        response = await gamesAPI.addExistingGameToLibrary(game.guid, details.status || 'want_to_play');
      } else {
        const gameData = {
          guid: game.guid,
          name: game.name,
          description: game.description || '',
          original_release_date: game.original_release_date,
          image: game.image,
          platforms: game.platforms,
          status: details.status || 'want_to_play'
        };
        response = await gamesAPI.addGameToLibrary(gameData);
      }
      
      if (response.success) {
        // If we have additional details, update the game
        if ((details.rating && details.rating !== '') || 
            (details.hours_played && details.hours_played !== '') || 
            (details.platform_id && details.platform_id !== '')) {
          
          const updateData = {
            status: details.status || 'want_to_play',
            rating: details.rating ? parseInt(details.rating) : null,
            hours_played: details.hours_played ? parseFloat(details.hours_played) : null,
            platform_id: details.platform_id || null
          };
          
          // Update the game with additional details
          await gamesAPI.updateUserGame(response.user_game.id, updateData);
        }
        
        // Mark as added and show confirmation
        setAddedGames(prev => new Set([...prev, game.guid]));
        setShowConfirmation(prev => ({ ...prev, [game.guid]: true }));
        setFlippedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(game.guid);
          return newSet;
        });
        
        // Hide confirmation after animation
        setTimeout(() => {
          setShowConfirmation(prev => ({ ...prev, [game.guid]: false }));
        }, 2000);
      } else {
        alert(response.message || 'Failed to add game to collection');
      }
    } catch (error) {
      console.error('Error adding game with details:', error);
      alert('Failed to add game to collection');
    }
  };

  // Cancel card flip
  const cancelFlip = (gameGuid) => {
    setFlippedCards(prev => {
      const newSet = new Set(prev);
      newSet.delete(gameGuid);
      return newSet;
    });
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
          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6">
            {games.map((game) => (
              <div
                key={game.guid}
                className="bg-card-bg rounded-xl overflow-hidden hover:bg-hover-gray transition-all duration-200 group relative"
              >
                {/* Added confirmation popup */}
                {showConfirmation[game.guid] && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-50 animate-bounce-in pointer-events-none">
                    <div className="bg-green-500 text-white px-3 py-2 rounded-full text-sm font-medium shadow-xl border-2 border-white">
                      Added!
                    </div>
                  </div>
                )}
                
                {!flippedCards.has(game.guid) ? (
                  // Front of card - Game display
                  <>
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
                            onClick={() => flipCard(game.guid)}
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
                    
                    <div className="p-2 sm:p-3">
                      <h3 className="text-white font-medium text-xs sm:text-sm leading-tight line-clamp-2">
                        {game.name}
                      </h3>
                      <p className="text-gray-400 text-xs mt-1">
                        {game.original_release_date 
                          ? new Date(game.original_release_date).getFullYear()
                          : 'TBA'
                        }
                      </p>
                    </div>
                  </>
                ) : (
                  // Back of card - Details form
                  <div className="aspect-square bg-dark-secondary p-2 sm:p-4 flex flex-col">
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      <h3 className="text-white font-medium text-xs sm:text-sm leading-tight line-clamp-2 mb-1 sm:mb-2">
                        {game.name}
                      </h3>
                      
                      {/* Status dropdown */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Status</label>
                        <select
                          value={gameDetails[game.guid]?.status || 'want_to_play'}
                          onChange={(e) => updateGameDetails(game.guid, 'status', e.target.value)}
                          className="w-full bg-gray-700 text-white text-xs px-1 sm:px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="want_to_play">Want to Play</option>
                          <option value="playing">Playing</option>
                          <option value="completed">Completed</option>
                          <option value="collection">Collection</option>
                          <option value="dropped">Dropped</option>
                        </select>
                      </div>
                      
                      {/* Rating input */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Rating (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={gameDetails[game.guid]?.rating || ''}
                          onChange={(e) => updateGameDetails(game.guid, 'rating', e.target.value)}
                          className="w-full bg-gray-700 text-white text-xs px-1 sm:px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                          placeholder="Optional"
                        />
                      </div>
                      
                      {/* Hours played input */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Hours</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={gameDetails[game.guid]?.hours_played || ''}
                          onChange={(e) => updateGameDetails(game.guid, 'hours_played', e.target.value)}
                          className="w-full bg-gray-700 text-white text-xs px-1 sm:px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                          placeholder="Optional"
                        />
                      </div>
                      
                      {/* Platform dropdown */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Platform</label>
                        <select
                          value={gameDetails[game.guid]?.platform_id || ''}
                          onChange={(e) => updateGameDetails(game.guid, 'platform_id', e.target.value)}
                          className="w-full bg-gray-700 text-white text-xs px-1 sm:px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select Platform</option>
                          {game.platforms?.map(platform => (
                            <option key={platform.guid || platform.id} value={platform.guid || platform.id}>
                              {platform.name} {platform.abbreviation ? `(${platform.abbreviation})` : ''}
                            </option>
                          ))}
                          <option value="not_listed">Not Listed</option>
                        </select>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex space-x-1 sm:space-x-2 mt-2 sm:mt-3">
                      <button
                        onClick={() => submitGameWithDetails(game)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs transition-colors"
                      >
                        Submit
                      </button>
                      <button
                        onClick={() => cancelFlip(game.guid)}
                        className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-2 sm:px-3 py-1 sm:py-2 rounded text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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
