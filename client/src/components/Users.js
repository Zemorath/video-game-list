import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usersAPI } from '../services/api';

const Users = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Restore state from location or use defaults
  const [searchQuery, setSearchQuery] = useState(location.state?.searchQuery || '');
  const [searchResults, setSearchResults] = useState(location.state?.searchResults || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(location.state?.hasSearched || false);

  // Clear location state after restoring to prevent stale data
  useEffect(() => {
    if (location.state) {
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim().length < 2) {
      setError('Search query must be at least 2 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await usersAPI.searchUsers(searchQuery.trim());
      if (response.success) {
        setSearchResults(response.users);
        setHasSearched(true);
      } else {
        setError(response.message || 'Search failed');
      }
    } catch (error) {
      console.error('User search error:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (userId, isCurrentlyFollowing) => {
    try {
      let response;
      if (isCurrentlyFollowing) {
        response = await usersAPI.unfollowUser(userId);
      } else {
        response = await usersAPI.followUser(userId);
      }

      if (response.success) {
        // Update the search results with new follow status
        setSearchResults(prev => prev.map(user => 
          user.id === userId 
            ? { 
                ...user, 
                is_following: !isCurrentlyFollowing,
                follower_count: response.follower_count
              }
            : user
        ));
      } else {
        setError(response.message || 'Failed to update follow status');
      }
    } catch (error) {
      console.error('Follow toggle error:', error);
      setError('Failed to update follow status');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-4">Find Users</h1>
        <p className="text-text-secondary mb-6">
          Search for other users by username to view their game collections and follow them for updates.
        </p>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username..."
                className="w-full px-4 py-3 bg-dark-secondary border border-dark-accent rounded-lg text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={loading || searchQuery.trim().length < 2}
              className="px-6 py-3 bg-accent-primary hover:bg-accent-secondary disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2 focus:ring-offset-dark-primary"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      {hasSearched && (
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-4">
            Search Results ({searchResults.length})
          </h2>

          {searchResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-text-secondary text-lg">
                No users found matching "{searchQuery}"
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((user) => (
                <div key={user.id} className="bg-card-bg rounded-xl p-6 hover:bg-card-bg/80 transition-colors">
                  <div className="text-center">
                    {/* User Avatar Placeholder */}
                    <div className="w-16 h-16 bg-accent-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-accent-primary text-xl font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>

                    {/* User Info */}
                    <h3 className="text-lg font-semibold text-text-primary mb-1">
                      {user.username}
                    </h3>
                    
                    {(user.first_name || user.last_name) && (
                      <p className="text-text-secondary text-sm mb-3">
                        {[user.first_name, user.last_name].filter(Boolean).join(' ')}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex justify-center space-x-4 text-sm text-text-secondary mb-4">
                      <div>
                        <span className="font-medium text-text-primary">{user.follower_count || 0}</span>
                        <div>Followers</div>
                      </div>
                      <div>
                        <span className="font-medium text-text-primary">{user.following_count || 0}</span>
                        <div>Following</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2">
                      <Link
                        to={`/users/${user.id}`}
                        state={{ 
                          returnTo: '/users',
                          searchQuery,
                          searchResults,
                          hasSearched
                        }}
                        className="px-4 py-2 bg-dark-accent hover:bg-dark-accent/80 text-text-primary rounded-lg transition-colors text-sm font-medium"
                      >
                        View Profile
                      </Link>
                      
                      <button
                        onClick={() => handleFollowToggle(user.id, user.is_following)}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                          user.is_following
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-accent-primary hover:bg-accent-secondary text-white'
                        }`}
                      >
                        {user.is_following ? 'Unfollow' : 'Follow'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Users;
