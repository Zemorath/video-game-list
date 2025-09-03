import React, { useState, useEffect } from 'react';
import { youtubeAPI } from '../services/api';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    const fetchDailyReviews = async () => {
      try {
        const response = await youtubeAPI.getDailyReviews();
        if (response.success) {
          setVideos(response.videos);
        } else {
          setError(response.message || 'Failed to load videos');
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        setError('Failed to load daily reviews');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyReviews();
  }, []);

  const openVideoModal = (video) => {
    setSelectedVideo(video);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 lg:py-8">
      {/* Welcome Section */}
      <div className="mb-8 lg:mb-12 text-center">
        <h1 className="text-2xl lg:text-4xl font-light text-text-primary mb-4">Welcome to Your Game Library</h1>
        <p className="text-base lg:text-lg text-text-secondary font-light">Discover, organize, and track your gaming journey.</p>
      </div>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-8 lg:mb-12">
        <div className="bg-card-bg rounded-2xl p-4 lg:p-6 hover:bg-card-bg/80 transition-colors duration-200">
          <h3 className="text-lg lg:text-xl font-medium text-text-primary mb-2">Recent Games</h3>
          <p className="text-sm lg:text-base text-text-secondary">View your recently added games</p>
        </div>
        
        <div className="bg-card-bg rounded-2xl p-4 lg:p-6 hover:bg-card-bg/80 transition-colors duration-200">
          <h3 className="text-lg lg:text-xl font-medium text-text-primary mb-2">Statistics</h3>
          <p className="text-sm lg:text-base text-text-secondary">Track your gaming progress</p>
        </div>
        
        <div className="bg-card-bg rounded-2xl p-4 lg:p-6 hover:bg-card-bg/80 transition-colors duration-200">
          <h3 className="text-lg lg:text-xl font-medium text-text-primary mb-2">Community</h3>
          <p className="text-sm lg:text-base text-text-secondary">Connect with other gamers</p>
        </div>
      </div>

      {/* Daily Gaming Reviews Section */}
      <div className="bg-card-bg rounded-2xl p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6">
          <h2 className="text-xl lg:text-2xl font-semibold text-text-primary mb-2 sm:mb-0">Daily Gaming Reviews</h2>
          <span className="text-text-secondary text-xs lg:text-sm">
            Fresh content updated daily
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-text-secondary">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-text-secondary">{error}</p>
              <p className="text-text-secondary text-sm mt-2">
                Gaming reviews will appear here when available
              </p>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-text-secondary">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
              </svg>
              <p>No gaming reviews available today</p>
              <p className="text-sm mt-2">Check back tomorrow for fresh content!</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-dark-secondary rounded-xl overflow-hidden hover:bg-dark-secondary/80 transition-colors cursor-pointer"
                onClick={() => openVideoModal(video)}
              >
                {/* Video thumbnail */}
                <div className="relative aspect-video">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-text-primary mb-2 line-clamp-2">{video.title}</h3>
                  <p className="text-sm text-text-secondary mb-3 line-clamp-2">{video.description}</p>
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{video.channel_title}</span>
                    <span>{new Date(video.published_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Video Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-primary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-dark-secondary">
              <h3 className="text-lg font-medium text-text-primary line-clamp-1">
                {selectedVideo.title}
              </h3>
              <button
                onClick={closeVideoModal}
                className="text-text-secondary hover:text-text-primary transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="aspect-video">
              <iframe
                src={selectedVideo.embed_url}
                title={selectedVideo.title}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
            <div className="p-4">
              <p className="text-text-secondary text-sm mb-2">{selectedVideo.description}</p>
              <div className="flex items-center justify-between text-xs text-text-secondary">
                <span>{selectedVideo.channel_title}</span>
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary hover:text-accent-primary/80 transition-colors"
                >
                  Watch on YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
