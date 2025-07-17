import axios from 'axios';

const API_BASE_URL = import.meta.env.PROD 
  ? 'http://localhost:4000' 
  : 'http://localhost:4000';

// Create axios instance with default config
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const mailwizzApi = {
  // Client endpoints
  getUserCampaigns: () => api.get('/mailwizz/campaigns'),
  
  getCampaignDetails: (campaignUid) => api.get(`/mailwizz/campaigns/${campaignUid}`),
  
  getCampaignStats: (campaignUid) => api.get(`/mailwizz/campaigns/${campaignUid}/stats`),
  
  exportCampaignData: (campaignUids, format = 'csv') => 
    api.post('/mailwizz/export', { campaignUids, format }, { responseType: 'blob' }),
  
  // Admin endpoints
  getAllCampaigns: () => api.get('/admin/mailwizz/campaigns'),
  
  getAllUsers: () => api.get('/admin/users'),
  
  getCampaignAssignments: (userId) => api.get(`/admin/users/${userId}/campaigns`),
  
  assignCampaignToUser: (userId, campaignUid) => 
    api.post('/admin/assign-campaign', { userId, campaignUid }),
  
  unassignCampaignFromUser: (userId, campaignUid) => 
    api.delete('/admin/unassign-campaign', { data: { userId, campaignUid } }),
  
  // User management
  createUser: (userData) => api.post('/admin/users', userData),
  
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, userData),
  
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // System health
  getSystemHealth: () => api.get('/admin/system/health'),
  
  getMailwizzConnectionStatus: () => api.get('/admin/mailwizz/status'),
  
  // Sync operations
  syncCampaigns: () => api.post('/admin/mailwizz/sync'),
  
  forceCacheRefresh: () => api.post('/admin/mailwizz/refresh-cache')
};

export default api;
