import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 10000,
});

// Request and response interceptors
API.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

API.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

// Artwork API functions
export const artworkAPI = {
  getAll: (params = {}) => API.get('/artworks', { params }),
  create: (artwork) => API.post('/artworks', artwork),
  getById: (id) => API.get(`/artworks/${id}`),
  update: (id, artwork) => API.put(`/artworks/${id}`, artwork),
  delete: (id) => API.delete(`/artworks/${id}`),
  like: (id) => API.post(`/artworks/${id}/like`),
  getUserArtworks: (userId) => API.get(`/artworks/user/${userId}`)
};

// Auth API functions  
export const authAPI = {
  login: (credentials) => API.post('/auth/login', credentials),
  register: (userData) => API.post('/auth/register', userData),
  getProfile: () => API.get('/auth/profile')
};

export default API;    