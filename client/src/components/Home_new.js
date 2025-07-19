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

      {/* Content Section with Tabs */}
      <div className="bg-card-bg rounded-2xl p-6">
        {/* Tab Headers */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'bg-accent-primary text-white'
                  : 'bg-dark-secondary text-text-secondary hover:bg-dark-secondary/80'
              }`}
            >
              Video Reviews
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'upcoming'
                  ? 'bg-accent-primary text-white'
                  : 'bg-dark-secondary text-text-secondary hover:bg-dark-secondary/80'
              }`}
            >
              Upcoming Games
            </button>
          </div>
          <span className="text-text-secondary text-sm">
            {activeTab === 'reviews' ? 'Fresh reviews updated daily' : 'Release dates and trailers'}
          </span>
        </div>

        {/* Tab Content */}
        {activeTab === 'reviews' ? (
          // Video Reviews Tab
          videosLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
          ) : videosError ? (
            <div className="text-center py-12">
              <div className="text-text-secondary">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-text-secondary">{videosError}</p>
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
                  {/* Video thumbnail and content */}
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
          )
        ) : (
          // Upcoming Games Tab
          gamesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary"></div>
            </div>
          ) : gamesError ? (
            <div className="text-center py-12">
              <div className="text-text-secondary">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <p className="text-text-secondary">{gamesError}</p>
                <p className="text-text-secondary text-sm mt-2">
                  Upcoming games will appear here when available
                </p>
              </div>
            </div>
          ) : upcomingGames.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-text-secondary">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
                <p>No upcoming games available</p>
                <p className="text-sm mt-2">Check back later for new releases!</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {upcomingGames.map((game) => (
                <div key={game.id} className="bg-dark-secondary rounded-xl overflow-hidden hover:bg-dark-secondary/80 transition-colors">
                  {/* Game image */}
                  <div className="relative aspect-video">
                    <img
                      src={game.background_image || '/placeholder-game.jpg'}
                      alt={game.name}
                      className="w-full h-full object-cover"
                    />
                    {game.metacritic && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {game.metacritic}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium text-text-primary mb-2 line-clamp-2">{game.name}</h3>
                    
                    {/* Release date */}
                    <div className="flex items-center text-sm text-accent-primary mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {game.release_date ? new Date(game.release_date).toLocaleDateString() : 'TBA'}
                    </div>

                    {/* Platforms */}
                    {game.platforms && game.platforms.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {game.platforms.slice(0, 3).map((platform, index) => (
                          <span key={index} className="text-xs bg-dark-primary text-text-secondary px-2 py-1 rounded">
                            {platform}
                          </span>
                        ))}
                        {game.platforms.length > 3 && (
                          <span className="text-xs text-text-secondary">+{game.platforms.length - 3}</span>
                        )}
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2">
                      {game.website && (
                        <a
                          href={game.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-accent-primary hover:bg-accent-primary/80 text-white text-sm py-2 px-3 rounded text-center transition-colors"
                        >
                          Website
                        </a>
                      )}
                      {game.youtube_trailer && (
                        <a
                          href={game.youtube_trailer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm py-2 px-3 rounded text-center transition-colors"
                        >
                          Trailer
                        </a>
                      )}
                      {!game.website && !game.youtube_trailer && (
                        <a
                          href={game.rawg_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-dark-primary hover:bg-dark-primary/80 text-text-secondary text-sm py-2 px-3 rounded text-center transition-colors"
                        >
                          More Info
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
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
