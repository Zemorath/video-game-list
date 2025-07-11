import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';

const Profile = () => {
  const { user, logout } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authAPI.getProfile();
        if (response.success) {
          setUserProfile(response.user);
        } else {
          setError('Failed to load profile');
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
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
            </div>
          </div>
        </div>
        
        <div className="bg-card-bg rounded-2xl p-6">
          <h3 className="text-xl font-medium text-text-primary mb-4">Game Statistics</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-text-secondary text-sm mb-1">Games in Library</label>
              <div className="text-text-primary text-2xl font-bold">
                {profileData?.game_count || 0}
              </div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Favorite Genres</label>
              <div className="text-text-primary">Action, RPG, Adventure</div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Most Played Platform</label>
              <div className="text-text-primary">PC</div>
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