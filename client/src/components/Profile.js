import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI, gamesAPI } from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [gameStats, setGameStats] = useState({
    totalGames: 0,
    completed: 0,
    playing: 0,
    wantToPlay: 0,
    collection: 0,
    dropped: 0,
    averageRating: 0,
    totalHoursPlayed: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile data
        const profileResponse = await authAPI.getProfile();
        if (profileResponse.success) {
          setUserProfile(profileResponse.user);
        } else {
          setError('Failed to load profile');
        }

        // Fetch game library data to calculate statistics
        const libraryResponse = await gamesAPI.getUserLibrary();
        if (libraryResponse.success) {
          const games = libraryResponse.library || [];
          
          // Calculate statistics
          const stats = {
            totalGames: games.length,
            completed: games.filter(g => g.status === 'completed').length,
            playing: games.filter(g => g.status === 'playing').length,
            wantToPlay: games.filter(g => g.status === 'want_to_play').length,
            collection: games.filter(g => g.status === 'collection').length,
            dropped: games.filter(g => g.status === 'dropped').length,
            averageRating: 0,
            totalHoursPlayed: 0
          };

          // Calculate average rating (only for rated games)
          const ratedGames = games.filter(g => g.rating && g.rating > 0);
          if (ratedGames.length > 0) {
            stats.averageRating = ratedGames.reduce((sum, g) => sum + g.rating, 0) / ratedGames.length;
          }

          // Calculate total hours played
          stats.totalHoursPlayed = games.reduce((sum, g) => sum + (g.hours_played || 0), 0);

          setGameStats(stats);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
        </div>
      </div>
    );
  }

  const profileData = userProfile || user;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-light text-text-primary mb-4">Profile</h1>
        <p className="text-lg text-text-secondary font-light">Manage your account and preferences</p>
      </div>
      
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}
      
      <div className="space-y-6">
        {/* Account Information and Preferences Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card-bg rounded-2xl p-6">
            <h3 className="text-xl font-medium text-text-primary mb-4">Account Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-text-secondary text-sm mb-1">Username</label>
              <div className="text-text-primary">{profileData?.username || 'Not available'}</div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Email</label>
              <div className="text-text-primary">{profileData?.email || 'Not available'}</div>
            </div>
            {(profileData?.first_name || profileData?.last_name) && (
              <div>
                <label className="block text-text-secondary text-sm mb-1">Name</label>
                <div className="text-text-primary">
                  {[profileData?.first_name, profileData?.last_name].filter(Boolean).join(' ') || 'Not provided'}
                </div>
              </div>
            )}
            <div>
              <label className="block text-text-secondary text-sm mb-1">Member Since</label>
              <div className="text-text-primary">
                {profileData?.created_at 
                  ? new Date(profileData.created_at).toLocaleDateString()
                  : 'Not available'
                }
              </div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Account Status</label>
              <div className="text-green-400">
                {profileData?.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div className="pt-2 border-t border-dark-accent">
              <label className="block text-text-secondary text-sm mb-2">Social Stats</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-text-primary text-lg font-semibold">
                    {profileData?.follower_count || 0}
                  </div>
                  <div className="text-text-secondary text-xs">Followers</div>
                </div>
                <div>
                  <div className="text-text-primary text-lg font-semibold">
                    {profileData?.following_count || 0}
                  </div>
                  <div className="text-text-secondary text-xs">Following</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-dark-accent">
            <h4 className="text-lg font-medium text-text-primary mb-4">Account Actions</h4>
            <div className="space-y-3">
              <button
                onClick={handleLogout}
                className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Sign Out
              </button>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.')) {
                    // TODO: Implement account deletion
                    alert('Account deletion feature will be implemented soon.');
                  }
                }}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-lg transition-colors border border-gray-600"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
        
        {/* Game Statistics - Full Width */}
        <div className="bg-card-bg rounded-2xl p-6">
          <h3 className="text-xl font-medium text-text-primary mb-4">Game Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">Total Games</label>
              <div className="text-text-primary text-2xl font-bold">
                {gameStats.totalGames}
              </div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Completed</label>
              <div className="text-green-400 text-2xl font-bold">
                {gameStats.completed}
              </div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Currently Playing</label>
              <div className="text-blue-400 text-xl font-bold">
                {gameStats.playing}
              </div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Want to Play</label>
              <div className="text-yellow-400 text-xl font-bold">
                {gameStats.wantToPlay}
              </div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Collection</label>
              <div className="text-purple-400 text-xl font-bold">
                {gameStats.collection}
              </div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Dropped</label>
              <div className="text-red-400 text-xl font-bold">
                {gameStats.dropped}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-dark-accent grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-text-secondary text-sm mb-1">Average Rating</label>
              <div className="text-text-primary text-lg">
                {gameStats.averageRating > 0 ? (
                  <>⭐ {gameStats.averageRating.toFixed(1)}/10</>
                ) : (
                  'No ratings yet'
                )}
              </div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Total Hours Played</label>
              <div className="text-text-primary text-lg">
                {gameStats.totalHoursPlayed > 0 ? (
                  <>🕒 {gameStats.totalHoursPlayed.toFixed(1)} hours</>
                ) : (
                  'No time logged'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
        
        <div className="bg-card-bg rounded-2xl p-6">
          <h3 className="text-xl font-medium text-text-primary mb-4">Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-text-secondary text-sm mb-2">Theme</label>
              <select className="w-full bg-accent-gray text-text-primary rounded-lg px-3 py-2 focus:outline-none">
                <option>Dark Mode</option>
                <option>Light Mode</option>
              </select>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-2">Privacy</label>
              <select className="w-full bg-accent-gray text-text-primary rounded-lg px-3 py-2 focus:outline-none">
                <option>Public Profile</option>
                <option>Private Profile</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;