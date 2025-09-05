import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add requests configuration (no CSRF token needed for development)
api.interceptors.request.use((config) => {
  return config;
});

// Handle responses - no automatic redirects
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't automatically redirect on 401 - let components handle it
    return Promise.reject(error);
  }
);

// Helper function for future CSRF implementation
export const setCsrfToken = (token) => {
  // Not used in development mode
};

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  verifyToken: async () => {
    const response = await api.get('/auth/verify-token');
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

export const gamesAPI = {
  getUserLibrary: async () => {
    const response = await api.get('/games/library');
    return response.data;
  },

  addGameToLibrary: async (gameData) => {
    const response = await api.post('/games/library/add-external', gameData);
    return response.data;
  },

  addExistingGameToLibrary: async (gameGuid, status = 'want_to_play', platformId = null) => {
    const response = await api.post('/games/library/add', {
      game_guid: gameGuid,
      status: status,
      platform_id: platformId
    });
    return response.data;
  },

  removeGameFromLibrary: async (userGameId) => {
    const response = await api.delete(`/games/library/${userGameId}`);
    return response.data;
  },

  updateUserGame: async (userGameId, updateData) => {
    const response = await api.put(`/games/library/${userGameId}`, updateData);
    return response.data;
  },

  searchLocalGames: async (query, limit = 10) => {
    const response = await api.get(`/games/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  getGameByGuid: async (guid) => {
    const response = await api.get(`/games/${guid}`);
    return response.data;
  },

  cacheSearchResults: async (searchResults) => {
    const response = await api.post('/games/cache-search-results', { results: searchResults });
    return response.data;
  }
};

export const usersAPI = {
  searchUsers: async (query, limit = 10) => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  getUserProfile: async (userId) => {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  },

  followUser: async (userId) => {
    const response = await api.post(`/users/${userId}/follow`);
    return response.data;
  },

  unfollowUser: async (userId) => {
    const response = await api.post(`/users/${userId}/unfollow`);
    return response.data;
  },

  getMyFollowers: async () => {
    const response = await api.get('/users/me/followers');
    return response.data;
  },

  getMyFollowing: async () => {
    const response = await api.get('/users/me/following');
    return response.data;
  }
};

export const youtubeAPI = {
  getDailyReviews: async () => {
    const response = await api.get('/youtube/daily-reviews');
    return response.data;
  },

  refreshReviews: async () => {
    const response = await api.post('/youtube/refresh-reviews');
    return response.data;
  }
};

export const platformsAPI = {
  getAllPlatforms: async () => {
    const response = await api.get('/platforms/');
    return response.data;
  },

  getPlatformByGuid: async (guid) => {
    const response = await api.get(`/platforms/${guid}`);
    return response.data;
  },

  syncFromAPI: async () => {
    const response = await api.post('/platforms/sync-from-api');
    return response.data;
  }
};

export default api;
