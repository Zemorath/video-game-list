import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const GameDetail = () => {
  const { guid } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_KEY = process.env.REACT_APP_GIANT_BOMB_API_KEY;
  const API_BASE_URL = process.env.REACT_APP_GIANT_BOMB_API_URL;

  useEffect(() => {
    const fetchGameDetail = async () => {
      try {
        setLoading(true);
        const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
        const apiUrl = `${API_BASE_URL}/game/${guid}/?api_key=${API_KEY}&format=json`;
        const url = `${CORS_PROXY}${encodeURIComponent(apiUrl)}`;
        
        const response = await axios.get(url);
        setGame(response.data.results);
        setError(null);
      } catch (err) {
        console.error('Error fetching game details:', err);
        setError('Failed to load game details');
      } finally {
        setLoading(false);
      }
    };

    if (guid) {
      fetchGameDetail();
    }
  }, [guid, API_KEY, API_BASE_URL]);

  const formatDate = (dateString) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPlatforms = (platforms) => {
    if (!platforms || platforms.length === 0) {
      return 'Not specified';
    }
    return platforms.map(platform => platform.name).join(', ');
  };

  const extractOverview = (description) => {
    if (!description) return null;
    
    // Create a temporary div to parse HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = description;
    
    // Look for Overview section in various formats
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6, strong, b');
    
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const headingText = heading.textContent.toLowerCase().trim();
      
      // Check if this heading contains "overview"
      if (headingText.includes('overview')) {
        // Find content after this heading until the next heading or end
        let content = '';
        let currentElement = heading.nextSibling;
        
        while (currentElement) {
          // Stop if we hit another heading
          if (currentElement.nodeType === 1 && // Element node
              ['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(currentElement.tagName)) {
            break;
          }
          
          // Add text content or HTML
          if (currentElement.nodeType === 1) { // Element node
            content += currentElement.outerHTML;
          } else if (currentElement.nodeType === 3) { // Text node
            const text = currentElement.textContent.trim();
            if (text) content += text;
          }
          
          currentElement = currentElement.nextSibling;
        }
        
        // Return cleaned content if we found something substantial
        if (content.trim().length > 20) {
          return content.trim();
        }
      }
    }
    
    // If no Overview section found, return null
    return null;
  };  if (loading) {
    return (
      <div className="max-w-6xl mx-auto flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-text-primary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading game details...</p>
        </div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 px-4 py-2 bg-accent-gray hover:bg-hover-gray text-text-primary rounded-xl transition-colors duration-200"
        >
          ← Back
        </button>
        <div className="bg-card-bg rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-medium text-text-primary mb-2">Game Not Found</h2>
          <p className="text-text-secondary">{error || 'The requested game could not be found.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 px-4 py-2 bg-accent-gray hover:bg-hover-gray text-text-primary rounded-xl transition-colors duration-200 flex items-center space-x-2"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
        <span>Back</span>
      </button>

      {/* Game Header */}
      <div className="bg-card-bg rounded-2xl overflow-hidden mb-8">
        <div className="md:flex">
          {/* Game Image */}
          <div className="md:w-1/3">
            {game.image ? (
              <img 
                src={game.image.screen_large_url || game.image.medium_url} 
                alt={game.name}
                className="w-full h-96 md:h-full object-cover"
              />
            ) : (
              <div className="w-full h-96 md:h-full bg-accent-gray flex items-center justify-center">
                <span className="text-text-secondary">No Image Available</span>
              </div>
            )}
          </div>

          {/* Game Info */}
          <div className="md:w-2/3 p-8">
            <h1 className="text-4xl font-light text-text-primary mb-4">{game.name}</h1>
            
            {game.deck && (
              <p className="text-lg text-text-secondary mb-6 font-light">{game.deck}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-text-primary font-medium mb-2">Release Date</h3>
                <p className="text-text-secondary">{formatDate(game.original_release_date)}</p>
              </div>

              <div>
                <h3 className="text-text-primary font-medium mb-2">Platforms</h3>
                <p className="text-text-secondary">{formatPlatforms(game.platforms)}</p>
              </div>

              {game.number_of_user_reviews > 0 && (
                <div>
                  <h3 className="text-text-primary font-medium mb-2">User Reviews</h3>
                  <p className="text-text-secondary">{game.number_of_user_reviews} reviews</p>
                </div>
              )}

              {game.original_game_rating && (
                <div>
                  <h3 className="text-text-primary font-medium mb-2">Rating</h3>
                  <p className="text-text-secondary">{game.original_game_rating.name}</p>
                </div>
              )}
            </div>

            {game.aliases && (
              <div className="mt-6">
                <h3 className="text-text-primary font-medium mb-2">Also Known As</h3>
                <p className="text-text-secondary">{game.aliases.replace(/\n/g, ', ')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Game Description */}
      {game.description && (() => {
        const overviewContent = extractOverview(game.description);
        return overviewContent ? (
          <div className="bg-card-bg rounded-2xl p-8">
            <h2 className="text-2xl font-light text-text-primary mb-6">About This Game</h2>
            <div 
              className="text-text-secondary leading-relaxed prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: overviewContent }}
            />
          </div>
        ) : null;
      })()}
    </div>
  );
};

export default GameDetail;
