import React from 'react';

const Profile = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-light text-text-primary mb-4">Profile</h1>
        <p className="text-lg text-text-secondary font-light">Manage your account and preferences</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card-bg rounded-2xl p-6">
          <h3 className="text-xl font-medium text-text-primary mb-4">Account Information</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-text-secondary text-sm mb-1">Username</label>
              <div className="text-text-primary">GameCollector</div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Member Since</label>
              <div className="text-text-primary">January 2024</div>
            </div>
            <div>
              <label className="block text-text-secondary text-sm mb-1">Games Collected</label>
              <div className="text-text-primary">42 Games</div>
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