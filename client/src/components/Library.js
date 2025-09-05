import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { gamesAPI, platformsAPI } from '../services/api';

const Library = () => {
  const [userGames, setUserGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingGame, setEditingGame] = useState(null);
  const [editForm, setEditForm] = useState({
    status: '',
    rating: '',
    hours_played: '',
    platform_id: ''
  });
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [sortBy, setSortBy] = useState('title'); // 'title', 'rating', 'status'
  const [searchQuery, setSearchQuery] = useState('');
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated()) {
      fetchUserLibrary();
      fetchPlatforms();
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

  const fetchPlatforms = async () => {
    try {
      const response = await platformsAPI.getAllPlatforms();
      if (response.success) {
        setPlatforms(response.platforms || []);
      }
    } catch (err) {
      console.error('Error fetching platforms:', err);
      // Don't show error for platforms as it's not critical
    }
  };

  // Filter and sort games whenever userGames, searchQuery, or sortBy changes
  useEffect(() => {
    let filtered = [...userGames];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(userGame => {
        const gameName = userGame.game?.name?.toLowerCase() || '';
        const status = userGame.status?.toLowerCase() || '';
        
        // Special case for "collection" search
        if (query === 'collection') {
          return status === 'collection';
        }
        
        return gameName.includes(query) || status.includes(query);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          const nameA = a.game?.name?.toLowerCase() || '';
          const nameB = b.game?.name?.toLowerCase() || '';
          return nameA.localeCompare(nameB);
        
        case 'rating':
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;
          return ratingB - ratingA; // Descending order
        
        case 'status':
          const statusOrder = { 'playing': 0, 'want_to_play': 1, 'completed': 2, 'collection': 3, 'dropped': 4 };
          const statusA = statusOrder[a.status] ?? 5;
          const statusB = statusOrder[b.status] ?? 5;
          return statusA - statusB;
        
        default:
          return 0;
      }
    });

    setFilteredGames(filtered);
  }, [userGames, searchQuery, sortBy]);

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

  const startEditing = (userGame) => {
    setEditingGame(userGame.id);
    setEditForm({
      status: userGame.status || 'want_to_play',
      rating: userGame.rating || '',
      hours_played: userGame.hours_played || '',
      platform_id: userGame.platform_id || ''
    });
  };

  const cancelEditing = () => {
    setEditingGame(null);
    setEditForm({
      status: '',
      rating: '',
      hours_played: '',
      platform_id: ''
    });
  };

  const saveEdit = async (userGameId) => {
    try {
      const response = await gamesAPI.updateUserGame(userGameId, {
        status: editForm.status,
        rating: editForm.rating ? parseInt(editForm.rating) : null,
        hours_played: editForm.hours_played ? parseFloat(editForm.hours_played) : null,
        platform_id: editForm.platform_id ? parseInt(editForm.platform_id) : null
      });
      
      if (response.success) {
        // Update the local state
        const updatedUserGames = userGames.map(userGame => 
          userGame.id === userGameId ? response.user_game : userGame
        );
        setUserGames(updatedUserGames);
        cancelEditing();
      } else {
        alert('Failed to update game');
      }
    } catch (error) {
      console.error('Error updating game:', error);
      alert('Failed to update game');
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
          {filteredGames.length} of {userGames.length} {userGames.length === 1 ? 'game' : 'games'} 
          {searchQuery && ` matching "${searchQuery}"`}
        </p>
      </div>

      {/* Controls Section */}
      {userGames.length > 0 && (
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search games... (try 'Collection' for collection status)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-dark-secondary text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
              />
            </div>
          </div>

          {/* View and Sort Controls */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* View Mode Buttons */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 font-medium">View:</span>
              <div className="flex bg-dark-secondary rounded-lg p-1">
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'cards' 
                      ? 'bg-accent-primary text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-accent-primary text-white' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400 font-medium">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-dark-secondary text-white px-3 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none text-sm"
              >
                <option value="title">Title</option>
                <option value="rating">Rating</option>
                <option value="status">Status</option>
              </select>
            </div>
          </div>
        </div>
      )}

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
      ) : filteredGames.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-card-bg rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="text-xl font-medium text-text-primary mb-2">No games found</h3>
            <p className="text-text-secondary">Try adjusting your search or filters.</p>
          </div>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredGames.map((userGame) => {
            // Get image URL from userGame directly or fallback to game data
            const imageUrl = userGame.image_url || 
                           userGame.game?.image?.medium_url || 
                           userGame.game?.image?.small_url || 
                           userGame.game?.image?.thumb_url ||
                           userGame.game?.image_url;
            
            const isEditing = editingGame === userGame.id;
            
            return (
              <div key={userGame.id} className="bg-card-bg rounded-xl overflow-hidden hover:bg-hover-gray transition-all duration-200 group">
                <div className="aspect-[3/4] bg-dark-secondary relative overflow-hidden">
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt={userGame.game?.name || 'Game'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        // Try fallback images if main image fails
                        if (userGame.game?.image?.thumb_url && e.target.src !== userGame.game.image.thumb_url) {
                          e.target.src = userGame.game.image.thumb_url;
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                    </div>
                  )}
                  
                  {/* Hover overlay with actions */}
                  {!isEditing && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-75 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEditing(userGame)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeGame(userGame.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4">
                  <h3 className="text-white font-medium text-sm leading-tight line-clamp-2 mb-3">
                    {userGame.game?.name || 'Unknown Game'}
                  </h3>
                  
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Status dropdown */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="w-full bg-dark-secondary text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="want_to_play">Want to Play</option>
                          <option value="playing">Playing</option>
                          <option value="completed">Completed</option>
                          <option value="dropped">Dropped</option>
                          <option value="collection">Collection</option>
                        </select>
                      </div>
                      
                      {/* Rating input */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Rating (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editForm.rating}
                          onChange={(e) => setEditForm({...editForm, rating: e.target.value})}
                          className="w-full bg-dark-secondary text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                          placeholder="Rate 1-10"
                        />
                      </div>
                      
                      {/* Hours played input */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Hours Played</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={editForm.hours_played}
                          onChange={(e) => setEditForm({...editForm, hours_played: e.target.value})}
                          className="w-full bg-dark-secondary text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                          placeholder="Hours"
                        />
                      </div>
                      
                      {/* Platform dropdown */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Console/Platform</label>
                        <select
                          value={editForm.platform_id}
                          onChange={(e) => setEditForm({...editForm, platform_id: e.target.value})}
                          className="w-full bg-dark-secondary text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select Platform</option>
                          {platforms.map(platform => (
                            <option key={platform.id} value={platform.id}>
                              {platform.name} {platform.abbreviation ? `(${platform.abbreviation})` : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => saveEdit(userGame.id)}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Game info and status */}
                      <div className="flex items-center justify-between">
                        <p className="text-gray-400 text-xs">
                          {userGame.game?.original_release_date 
                            ? new Date(userGame.game.original_release_date).getFullYear()
                            : 'TBA'
                          }
                        </p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          userGame.status === 'completed' ? 'bg-green-900 text-green-300' :
                          userGame.status === 'playing' ? 'bg-blue-900 text-blue-300' :
                          userGame.status === 'want_to_play' ? 'bg-yellow-900 text-yellow-300' :
                          userGame.status === 'dropped' ? 'bg-red-900 text-red-300' :
                          userGame.status === 'collection' ? 'bg-purple-900 text-purple-300' :
                          'bg-gray-900 text-gray-300'
                        }`}>
                          {userGame.status === 'want_to_play' ? 'Want to Play' :
                           userGame.status === 'playing' ? 'Playing' :
                           userGame.status === 'completed' ? 'Completed' :
                           userGame.status === 'dropped' ? 'Dropped' :
                           userGame.status === 'collection' ? 'Collection' : userGame.status}
                        </span>
                      </div>
                      
                      {/* Rating and hours */}
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>
                          {userGame.rating ? `⭐ ${userGame.rating}/10` : 'No rating'}
                        </span>
                        <span>
                          {userGame.hours_played ? `🕒 ${userGame.hours_played}h` : 'No time logged'}
                        </span>
                      </div>
                      
                      {/* Platform info */}
                      {userGame.platform && (
                        <div className="text-xs text-gray-400">
                          <span>🎮 {userGame.platform.name}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredGames.map((userGame) => {
            const isEditing = editingGame === userGame.id;
            
            return (
              <div key={userGame.id} className="bg-card-bg rounded-xl p-4 hover:bg-hover-gray transition-all duration-200">
                <div className="flex items-center space-x-4">
                  {/* Game image */}
                  <div className="w-16 h-20 bg-dark-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {userGame.image_url || userGame.game?.image?.thumb_url ? (
                      <img 
                        src={userGame.image_url || userGame.game?.image?.thumb_url} 
                        alt={userGame.game?.name || 'Game'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Game details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium text-lg mb-1 truncate">
                      {userGame.game?.name || 'Unknown Game'}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>
                        {userGame.game?.original_release_date 
                          ? new Date(userGame.game.original_release_date).getFullYear()
                          : 'TBA'
                        }
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        userGame.status === 'completed' ? 'bg-green-900 text-green-300' :
                        userGame.status === 'playing' ? 'bg-blue-900 text-blue-300' :
                        userGame.status === 'want_to_play' ? 'bg-yellow-900 text-yellow-300' :
                        userGame.status === 'dropped' ? 'bg-red-900 text-red-300' :
                        userGame.status === 'collection' ? 'bg-purple-900 text-purple-300' :
                        'bg-gray-900 text-gray-300'
                      }`}>
                        {userGame.status === 'want_to_play' ? 'Want to Play' :
                         userGame.status === 'playing' ? 'Playing' :
                         userGame.status === 'completed' ? 'Completed' :
                         userGame.status === 'dropped' ? 'Dropped' :
                         userGame.status === 'collection' ? 'Collection' : userGame.status}
                      </span>
                      <span>
                        {userGame.rating ? `⭐ ${userGame.rating}/10` : 'No rating'}
                      </span>
                      <span>
                        {userGame.hours_played ? `🕒 ${userGame.hours_played}h` : 'No time logged'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action buttons */}
                  {!isEditing ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => startEditing(userGame)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeGame(userGame.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => saveEdit(userGame.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Editing form for list view */}
                {isEditing && (
                  <div className="mt-4 pt-4 border-t border-gray-600">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Status dropdown */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Status</label>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="w-full bg-dark-secondary text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="want_to_play">Want to Play</option>
                          <option value="playing">Playing</option>
                          <option value="completed">Completed</option>
                          <option value="dropped">Dropped</option>
                          <option value="collection">Collection</option>
                        </select>
                      </div>
                      
                      {/* Rating input */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Rating (1-10)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={editForm.rating}
                          onChange={(e) => setEditForm({...editForm, rating: e.target.value})}
                          className="w-full bg-dark-secondary text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                          placeholder="Rate 1-10"
                        />
                      </div>
                      
                      {/* Hours played input */}
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Hours Played</label>
                        <input
                          type="number"
                          min="0"
                          step="0.5"
                          value={editForm.hours_played}
                          onChange={(e) => setEditForm({...editForm, hours_played: e.target.value})}
                          className="w-full bg-dark-secondary text-white text-sm px-3 py-2 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                          placeholder="Hours"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Library;