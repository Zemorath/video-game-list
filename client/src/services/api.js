import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

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

  addExistingGameToLibrary: async (gameGuid, status = 'want_to_play') => {
    const response = await api.post('/games/library/add', {
      game_guid: gameGuid,
      status: status
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

export default api;
