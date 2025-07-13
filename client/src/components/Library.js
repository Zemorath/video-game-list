import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { gamesAPI } from '../services/api';

const Library = () => {
  const [userGames, setUserGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated()) {
      fetchUserLibrary();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const fetchUserLibrary = async () => {
    try {
      setLoading(true);
      const response = await gamesAPI.getUserLibrary();
      
      if (response.success) {
        setUserGames(response.library || []);
      } else {
        setError('Failed to load your library');
      }
    } catch (err) {
      console.error('Error fetching library:', err);
      setError('Failed to load your library');
    } finally {
      setLoading(false);
    }
  };

  const removeGame = async (userGameId) => {
    try {
      const response = await gamesAPI.removeGameFromLibrary(userGameId);
      
      if (response.success) {
        setUserGames(userGames.filter(userGame => userGame.id !== userGameId));
      } else {
        alert('Failed to remove game from library');
      }
    } catch (error) {
      console.error('Error removing game:', error);
      alert('Failed to remove game from library');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="text-center py-12">
          <div className="bg-card-bg rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-xl font-medium text-text-primary mb-2">Sign in Required</h3>
            <p className="text-text-secondary">Please sign in to view your game library.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-light text-text-primary mb-4">Your Game Library</h1>
        <p className="text-lg text-text-secondary font-light">
          {userGames.length} {userGames.length === 1 ? 'game' : 'games'} in your collection
        </p>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {userGames.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-card-bg rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-xl font-medium text-text-primary mb-2">No games yet</h3>
            <p className="text-text-secondary mb-4">Start building your library by searching for games.</p>
            <a 
              href="/search?q=popular" 
              className="inline-block bg-accent-primary hover:bg-accent-secondary text-white px-4 py-2 rounded-lg transition-colors"
            >
              Browse Games
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {userGames.map((userGame) => (
            <div key={userGame.id} className="bg-card-bg rounded-2xl overflow-hidden hover:bg-hover-gray transition-colors duration-200">
              {userGame.game?.image_url && (
                <img 
                  src={userGame.game.image_url} 
                  alt={userGame.game?.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="font-medium text-text-primary mb-2 line-clamp-2">
                  {userGame.game?.name || 'Unknown Game'}
                </h3>
                <p className="text-text-secondary text-sm mb-2">
                  {userGame.game?.original_release_date 
                    ? new Date(userGame.game.original_release_date).getFullYear()
                    : 'Release date unknown'
                  }
                </p>
                <div className="mb-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    userGame.status === 'completed' ? 'bg-green-900 text-green-300' :
                    userGame.status === 'playing' ? 'bg-blue-900 text-blue-300' :
                    userGame.status === 'want_to_play' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-gray-900 text-gray-300'
                  }`}>
                    {userGame.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </div>
                <button
                  onClick={() => removeGame(userGame.id)}
                  className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Library;