import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';

const UserProfile = () => {
  const { userId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [library, setLibrary] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('cards');
  const [sortBy, setSortBy] = useState('date_added');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSharedOnly, setShowSharedOnly] = useState(false);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await usersAPI.getUserProfile(userId);
        if (response.success) {
          setUser(response.user);
          setLibrary(response.library);
          setStats(response.stats);
        } else {
          setError(response.message || 'Failed to load user profile');
        }
      } catch (error) {
        console.error('User profile error:', error);
        setError('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const handleFollowToggle = async () => {
    try {
      let response;
      if (user.is_following) {
        response = await usersAPI.unfollowUser(userId);
      } else {
        response = await usersAPI.followUser(userId);
      }

      if (response.success) {
        setUser(prev => ({
          ...prev,
          is_following: !prev.is_following,
          follower_count: response.follower_count
        }));
      } else {
        setError(response.message || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      setError('Failed to update follow status');
    }
  };

  // Filter and sort library
  const filteredLibrary = library
    .filter(game => {
      const matchesSearch = game.game?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || '';
      const matchesSharedFilter = showSharedOnly ? game.is_shared : true;
      return matchesSearch && matchesSharedFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.game?.name || '').localeCompare(b.game?.name || '');
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'date_added':
        default:
          return new Date(b.date_added || 0) - new Date(a.date_added || 0);
      }
    });

  const handleBack = () => {
    if (location.state?.returnTo && location.state?.searchQuery) {
      // Return to users page with search state
      navigate(location.state.returnTo, {
        state: {
          searchQuery: location.state.searchQuery,
          searchResults: location.state.searchResults,
          hasSearched: location.state.hasSearched
        }
      });
    } else {
      // Default back navigation
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="text-red-400 text-lg">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={handleBack}
        className="mb-4 flex items-center text-text-secondary hover:text-text-primary transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* User Header */}
      <div className="bg-card-bg rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
          {/* Avatar */}
          <div className="w-20 h-20 bg-accent-primary/20 rounded-full flex items-center justify-center">
            <span className="text-accent-primary text-2xl font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {user?.username}
            </h1>
            
            {(user?.first_name || user?.last_name) && (
              <p className="text-text-secondary mb-2">
                {[user?.first_name, user?.last_name].filter(Boolean).join(' ')}
              </p>
            )}

            <p className="text-text-secondary text-sm mb-4">
              Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </p>

            {/* Stats */}
            <div className="flex justify-center md:justify-start space-x-6 text-sm">
              <div>
                <span className="font-medium text-text-primary">{user?.follower_count || 0}</span>
                <span className="text-text-secondary ml-1">Followers</span>
              </div>
              <div>
                <span className="font-medium text-text-primary">{user?.following_count || 0}</span>
                <span className="text-text-secondary ml-1">Following</span>
              </div>
              <div>
                <span className="font-medium text-text-primary">{stats?.total_games || 0}</span>
                <span className="text-text-secondary ml-1">Games</span>
              </div>
              <div>
                <span className="font-medium text-accent-primary">{stats?.shared_games || 0}</span>
                <span className="text-text-secondary ml-1">Shared</span>
              </div>
            </div>
          </div>

          {/* Follow Button */}
          <button
            onClick={handleFollowToggle}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              user?.is_following
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-accent-primary hover:bg-accent-secondary text-white'
            }`}
          >
            {user?.is_following ? 'Unfollow' : 'Follow'}
          </button>
        </div>
      </div>

      {/* Game Stats */}
      <div className="bg-card-bg rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-text-primary mb-4">Game Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-text-primary">{stats?.total_games || 0}</div>
            <div className="text-text-secondary text-sm">Total</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{stats?.completed || 0}</div>
            <div className="text-text-secondary text-sm">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{stats?.currently_playing || 0}</div>
            <div className="text-text-secondary text-sm">Playing</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{stats?.want_to_play || 0}</div>
            <div className="text-text-secondary text-sm">Want to Play</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{stats?.collection || 0}</div>
            <div className="text-text-secondary text-sm">Collection</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{stats?.dropped || 0}</div>
            <div className="text-text-secondary text-sm">Dropped</div>
          </div>
        </div>

        {stats?.average_rating > 0 && (
          <div className="mt-4 pt-4 border-t border-dark-accent text-center">
            <div className="text-lg text-text-primary">
              ⭐ Average Rating: {stats.average_rating.toFixed(1)}/10
            </div>
            {stats?.total_hours > 0 && (
              <div className="text-text-secondary mt-1">
                🕒 Total Hours: {stats.total_hours.toFixed(1)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Library Controls */}
      <div className="bg-card-bg rounded-xl p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-xl font-semibold text-text-primary">{user?.username}'s Game Library</h2>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Shared Games Filter */}
            {stats?.shared_games > 0 && (
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="sharedGames"
                  checked={showSharedOnly}
                  onChange={(e) => setShowSharedOnly(e.target.checked)}
                  className="w-4 h-4 text-accent-primary bg-dark-secondary border-dark-accent rounded focus:ring-accent-primary focus:ring-2"
                />
                <label htmlFor="sharedGames" className="text-text-primary text-sm">
                  Show only shared games ({stats.shared_games})
                </label>
              </div>
            )}
            
            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search games..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-4 py-2 bg-dark-secondary border border-dark-accent rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              />
              <svg className="absolute left-2 top-2.5 h-4 w-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-dark-secondary border border-dark-accent rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
            >
              <option value="date_added">Date Added</option>
              <option value="name">Name</option>
              <option value="rating">Rating</option>
              <option value="status">Status</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-dark-secondary rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-2 text-sm ${viewMode === 'cards' ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 text-sm ${viewMode === 'list' ? 'bg-accent-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Library */}
      {filteredLibrary.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-text-secondary text-lg">
            {searchQuery ? `No games found matching "${searchQuery}"` : 'No games in library'}
          </div>
        </div>
      ) : (
        <div className={viewMode === 'cards' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {filteredLibrary.map((userGame) => (
            <div key={userGame.id} className={viewMode === 'cards' ? 'bg-card-bg rounded-xl overflow-hidden hover:bg-card-bg/80 transition-colors' : 'bg-card-bg rounded-lg p-4 flex items-center space-x-4 hover:bg-card-bg/80 transition-colors'}>
              {viewMode === 'cards' ? (
                <>
                  {/* Game Image */}
                  <div className="relative aspect-3/4 bg-dark-accent">
                    {userGame.image_url ? (
                      <img
                        src={userGame.image_url}
                        alt={userGame.game?.name || 'Game'}
                        className="absolute inset-0 w-full h-full object-cover rounded-t-xl"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-text-secondary rounded-t-xl">
                        No Image
                      </div>
                    )}
                    {/* Shared Game Badge */}
                    {userGame.is_shared && (
                      <div className="absolute top-2 right-2 bg-accent-primary text-white text-xs px-2 py-1 rounded-full font-medium">
                        Shared
                      </div>
                    )}
                  </div>

                  {/* Game Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-text-primary mb-2 line-clamp-2">
                      {userGame.game?.name || 'Unknown Game'}
                    </h3>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-text-secondary">Status:</span>
                        <span className={`capitalize ${
                          userGame.status === 'completed' ? 'text-green-400' :
                          userGame.status === 'playing' ? 'text-blue-400' :
                          userGame.status === 'want_to_play' ? 'text-yellow-400' :
                          userGame.status === 'collection' ? 'text-purple-400' :
                          userGame.status === 'dropped' ? 'text-red-400' :
                          'text-text-primary'
                        }`}>
                          {userGame.status === 'want_to_play' ? 'Want to Play' : 
                           userGame.status?.replace('_', ' ') || 'Unknown'}
                        </span>
                      </div>
                      
                      {userGame.rating && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Rating:</span>
                          <span className="text-text-primary">⭐ {userGame.rating}/10</span>
                        </div>
                      )}
                      
                      {userGame.hours_played && (
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Hours:</span>
                          <span className="text-text-primary">{userGame.hours_played}h</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List View */}
                  <div className="w-16 h-16 bg-dark-accent rounded-lg flex-shrink-0 overflow-hidden relative">
                    {userGame.image_url ? (
                      <img
                        src={userGame.image_url}
                        alt={userGame.game?.name || 'Game'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs">
                        No Image
                      </div>
                    )}
                    {/* Shared Game Badge */}
                    {userGame.is_shared && (
                      <div className="absolute -top-1 -right-1 bg-accent-primary text-white text-xs w-3 h-3 rounded-full flex items-center justify-center">
                        ✓
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-text-primary truncate">
                        {userGame.game?.name || 'Unknown Game'}
                      </h3>
                      {userGame.is_shared && (
                        <span className="text-accent-primary text-xs font-medium">SHARED</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm">
                      <span className={`capitalize ${
                        userGame.status === 'completed' ? 'text-green-400' :
                        userGame.status === 'playing' ? 'text-blue-400' :
                        userGame.status === 'want_to_play' ? 'text-yellow-400' :
                        userGame.status === 'collection' ? 'text-purple-400' :
                        userGame.status === 'dropped' ? 'text-red-400' :
                        'text-text-primary'
                      }`}>
                        {userGame.status === 'want_to_play' ? 'Want to Play' : 
                         userGame.status?.replace('_', ' ') || 'Unknown'}
                      </span>
                      {userGame.rating && (
                        <span className="text-text-primary">⭐ {userGame.rating}/10</span>
                      )}
                      {userGame.hours_played && (
                        <span className="text-text-primary">{userGame.hours_played}h</span>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserProfile;
