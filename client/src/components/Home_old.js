import React, { useState, useEffect } from 'react';
import { youtubeAPI, upcomingGamesAPI } from '../services/api';

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [upcomingGames, setUpcomingGames] = useState([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [videosError, setVideosError] = useState('');
  const [gamesError, setGamesError] = useState('');
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('reviews'); // 'reviews' or 'upcoming'

  useEffect(() => {
    const fetchDailyReviews = async () => {
      try {
        const response = await youtubeAPI.getDailyReviews();
        if (response.success) {
          setVideos(response.videos);
        } else {
          setVideosError(response.message || 'Failed to load videos');
        }
      } catch (error) {
        console.error('Failed to fetch videos:', error);
        setVideosError('Failed to load daily reviews');
      } finally {
        setVideosLoading(false);
      }
    };

    const fetchUpcomingGames = async () => {
      try {
        const response = await upcomingGamesAPI.getUpcomingGames();
        if (response.success) {
          setUpcomingGames(response.games);
        } else {
          setGamesError(response.message || 'Failed to load upcoming games');
        }
      } catch (error) {
        console.error('Failed to fetch upcoming games:', error);
        setGamesError('Failed to load upcoming games');
      } finally {
        setGamesLoading(false);
      }
    };

    fetchDailyReviews();
    fetchUpcomingGames();
  }, []);

  const openVideoModal = (video) => {
    setSelectedVideo(video);
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-light text-text-primary mb-4">Welcome to Your Game Library</h1>
        <p className="text-lg text-text-secondary font-light">Discover, organize, and track your gaming journey.</p>
      </div>
      
      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-card-bg rounded-2xl p-6 hover:bg-card-bg/80 transition-colors duration-200">
          <h3 className="text-xl font-medium text-text-primary mb-2">Recent Games</h3>
          <p className="text-text-secondary">View your recently added games</p>
        </div>
        
        <div className="bg-card-bg rounded-2xl p-6 hover:bg-card-bg/80 transition-colors duration-200">
          <h3 className="text-xl font-medium text-text-primary mb-2">Statistics</h3>
          <p className="text-text-secondary">Track your gaming progress</p>
        </div>
        
        <div className="bg-card-bg rounded-2xl p-6 hover:bg-card-bg/80 transition-colors duration-200">
          <h3 className="text-xl font-medium text-text-primary mb-2">Community</h3>
          <p className="text-text-secondary">Connect with other gamers</p>
        </div>
      </div>

      {/* Daily Gaming Reviews Section */}
      <div className="bg-card-bg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-text-primary">Daily Gaming Reviews</h2>
          <span className="text-text-secondary text-sm">
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
                {/* Thumbnail */}
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

                {/* Video Info */}
                <div className="p-4">
                  <h3 className="font-medium text-text-primary mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-text-secondary text-sm mb-2">
                    {video.channel_title}
                  </p>
                  <div className="flex items-center justify-between text-xs text-text-secondary">
                    <span>{video.view_count?.toLocaleString()} views</span>
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
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-primary rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-accent">
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

            {/* Video Player */}
            <div className="aspect-video">
              <iframe
                src={selectedVideo.embed_url}
                title={selectedVideo.title}
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Video Details */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-text-secondary text-sm">{selectedVideo.channel_title}</span>
                <div className="flex space-x-4 text-xs text-text-secondary">
                  <span>{selectedVideo.view_count?.toLocaleString()} views</span>
                  <span>{selectedVideo.like_count?.toLocaleString()} likes</span>
                </div>
              </div>
              <p className="text-text-secondary text-sm">
                {selectedVideo.description}
              </p>
              <div className="mt-4">
                <a
                  href={selectedVideo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
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