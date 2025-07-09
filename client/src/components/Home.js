import React from 'react';

const Home = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-light text-text-primary mb-4">Welcome to Your Game Library</h1>
        <p className="text-lg text-text-secondary font-light">Discover, organize, and track your gaming journey.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-card-bg rounded-2xl p-6 hover:bg-hover-gray transition-colors duration-200">
          <h3 className="text-xl font-medium text-text-primary mb-2">Recent Games</h3>
          <p className="text-text-secondary">View your recently added games</p>
        </div>
        
        <div className="bg-card-bg rounded-2xl p-6 hover:bg-hover-gray transition-colors duration-200">
          <h3 className="text-xl font-medium text-text-primary mb-2">Statistics</h3>
          <p className="text-text-secondary">Track your gaming progress</p>
        </div>
        
        <div className="bg-card-bg rounded-2xl p-6 hover:bg-hover-gray transition-colors duration-200">
          <h3 className="text-xl font-medium text-text-primary mb-2">Wishlist</h3>
          <p className="text-text-secondary">Games you want to play</p>
        </div>
      </div>
    </div>
  );
};

export default Home;