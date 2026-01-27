import api from './api';
import authService from './authService';

/**
 * API Service - All backend API calls
 * Token is automatically added via axios interceptor
 */
const apiService = {
  // =============== AUTHENTICATION ===============
  
  /**
   * Get current user profile
   * Example: GET /user/profile
   */
  getProfile: async () => {
    try {
      const response = await api.get('/user/profile');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // =============== USER IMAGES ENDPOINTS ===============
  
  /**
   * Get all user images
   * GET /user-singer/my/singer/all
   */
  getAllUserImages: async () => {
    try {
      const response = await api.get('/user-singer/my/singer/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching user images:', error);
      throw error;
    }
  },

  /**
   * Upload image
   * POST /user-singer/upload
   */
  uploadImage: async (formData) => {
    try {
      const response = await api.post('/user-singer/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...authService.getAuthHeaders()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  /**
   * Delete image
   * DELETE /user-singer/images/{image_id}
   */
  deleteImage: async (imageId) => {
    try {
      const response = await api.delete(`/user-singer/images/${imageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  // =============== IMAGE GENERATION ===============
  
  /**
   * Generate AI image
   * POST /api/askh/singer/researchs
   */
  generateImage: async (promptData) => {
    try {
      const response = await api.post('/api/askh/singer/researchs', promptData);
      return response.data;
    } catch (error) {
      console.error('Error generating image:', error);
      throw error;
    }
  },

  // =============== MODELS ===============
  
  /**
   * Get all models
   * GET /models
   */
  getModels: async () => {
    try {
      const response = await api.get('/models');
      return response.data;
    } catch (error) {
      console.error('Error fetching models:', error);
      throw error;
    }
  },

  // =============== ADMIN ENDPOINTS ===============
  
  /**
   * Get all users (admin only)
   * GET /admin/users
   */
  getAllUsers: async () => {
    try {
      const response = await api.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  /**
   * Get system stats (admin only)
   * GET /admin/stats
   */
  getSystemStats: async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  },

  // =============== UTILITY ===============
  
  /**
   * Generic GET request
   */
  get: async (endpoint, params = {}) => {
    try {
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generic POST request
   */
  post: async (endpoint, data = {}) => {
    try {
      const response = await api.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generic PUT request
   */
  put: async (endpoint, data = {}) => {
    try {
      const response = await api.put(endpoint, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Generic DELETE request
   */
  delete: async (endpoint) => {
    try {
      const response = await api.delete(endpoint);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

export default apiService;