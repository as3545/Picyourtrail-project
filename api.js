import axios from 'axios'

// Get API URL from environment variable or use default
const API_URL = '/api'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for logging and authentication
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    
    // Add authentication token if available
    const token = localStorage.getItem('token')
    console.log('API Request - Token from localStorage:', token ? 'present' : 'missing');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('API Request - Authorization header set:', config.headers.Authorization);
    }
    
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message)
    return Promise.reject(error.response?.data || error)
  }
)

// API functions
export const packagesAPI = {
  // Get all packages with optional filtering
  getAll: (params = {}) => api.get('/packages', { params }),
  
  // Get featured packages
  getFeatured: () => api.get('/packages/featured'),
  
  // Get package by ID
  getById: (id) => api.get(`/packages/${id}`),
  
  // Get packages by destination
  getByDestination: (destination) => api.get(`/packages/destination/${destination}`),
  
  // Create new package (admin)
  create: (data) => api.post('/packages', data),
  
  // Update package (admin)
  update: (id, data) => api.put(`/packages/${id}`, data),
  
  // Delete package (admin)
  delete: (id) => api.delete(`/packages/${id}`),
}

export const inquiriesAPI = {
  // Submit new inquiry
  submit: (data) => api.post('/inquiries', data),
  
  // Get all inquiries (admin)
  getAll: (params = {}) => api.get('/inquiries', { params }),
  
  // Get inquiry by ID (admin)
  getById: (id) => api.get(`/inquiries/${id}`),
  
  // Update inquiry status (admin)
  updateStatus: (id, status) => api.put(`/inquiries/${id}/status`, { status }),
  
  // Delete inquiry (admin)
  delete: (id) => api.delete(`/inquiries/${id}`),
}

export const destinationsAPI = {
  // Get all unique destinations
  getAll: () => api.get('/destinations'),
  
  // Get packages by destination
  getPackages: (destination, params = {}) => 
    api.get(`/destinations/${destination}/packages`, { params }),
  
  // Get destination statistics
  getStats: (destination) => api.get(`/destinations/${destination}/stats`),
}

// ... existing code ...

export const healthAPI = {
  // Check API health
  check: () => api.get('/health'),
}

// Authentication API functions
export const authAPI = {
  // Register new user
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  
  // Login user
  login: (email, password) => api.post('/auth/login', { email, password }),
  
  // Admin login
  adminLogin: (email, password) => api.post('/auth/admin/login', { email, password }),
  
  // Get user profile
  getProfile: () => api.get('/auth/me'),
  
  // Update user profile
  updateProfile: (userData) => api.put('/auth/profile', userData),
  
  // Logout user
  logout: () => api.post('/auth/logout'),
  
  // Google OAuth
  googleAuth: (tokenId) => api.post('/auth/google', { tokenId }),
  
  verifyEmail: async (email, otp) => {
    const response = await api.post('/auth/verify-email', { email, otp });
    return response;
  },
  
    resendOTP: async (email) => {
    const response = await api.post('/auth/resend-otp', { email });
    return response;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response;
  },

  resetPassword: async (token, password) => {
    const response = await api.post(`/auth/reset-password/${token}`, { password });
    return response;
  },

  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/reset-password/${token}`);
    return response;
  }
};

// ... existing code ...
export const getPackages = async (params = {}) => {
  try {
    const response = await packagesAPI.getAll(params)
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch packages')
  }
}

// Admin API functions
export const adminAPI = {
  // Package management
  getPackages: (params = {}) => api.get('/admin/packages', { 
    params,
    headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
  }),
  
  createPackage: (data) => api.post('/admin/packages', data, {
    headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
  }),
  
  updatePackage: (id, data) => api.put(`/admin/packages/${id}`, data, {
    headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
  }),
  
  deletePackage: (id) => api.delete(`/admin/packages/${id}`, {
    headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
  }),
  
  // Inquiry management
  getInquiries: (params = {}) => api.get('/admin/inquiries', { 
    params,
    headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
  }),
  
  updateInquiryStatus: (id, status) => api.put(`/admin/inquiries/${id}/status`, { status }, {
    headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
  }),
  
  deleteInquiry: (id) => api.delete(`/admin/inquiries/${id}`, {
    headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
  }),
  
  // Image upload
  uploadImage: (file) => {
    const formData = new FormData()
    formData.append('image', file)
    return api.post('/admin/upload/image', formData, {
      headers: { 
        'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN,
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  uploadImages: (files) => {
    const formData = new FormData()
    files.forEach(file => formData.append('images', file))
    return api.post('/admin/upload/images', formData, {
      headers: { 
        'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN,
        'Content-Type': 'multipart/form-data'
      }
    })
  },
  
  // Dashboard stats
  getStats: () => api.get('/admin/stats', {
    headers: { 'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN }
  }),

  // Export functionality
  exportInquiries: (params = {}, format = 'csv') => {
    const queryString = new URLSearchParams(params).toString()
    const url = `/admin/export/inquiries${queryString ? `?${queryString}` : ''}`
    
    return fetch(`${import.meta.env.VITE_API_URL || ''}${url}`, {
      headers: {
        'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error('Export failed')
      }
      return response.text()
    })
  },

  exportPackages: (params = {}, format = 'csv') => {
    const queryString = new URLSearchParams(params).toString()
    const url = `/admin/export/packages${queryString ? `?${queryString}` : ''}`
    
    return fetch(`${import.meta.env.VITE_API_URL || ''}${url}`, {
      headers: {
        'x-admin-token': import.meta.env.VITE_ADMIN_TOKEN,
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    }).then(response => {
      if (!response.ok) {
        throw new Error('Export failed')
      }
      return response.text()
    })
  }
}

// Utility function to get full image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath
  return `http://localhost:5000${imagePath}`
}

export const getFeaturedPackages = async () => {
  try {
    const response = await packagesAPI.getFeatured()
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch featured packages')
  }
}

export const getPackage = async (id) => {
  try {
    const response = await packagesAPI.getById(id)
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch package')
  }
}

export const getDestinations = async () => {
  try {
    const response = await destinationsAPI.getAll()
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch destinations')
  }
}

export const getDestinationPackages = async (destination) => {
  try {
    const response = await destinationsAPI.getPackages(destination)
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to fetch destination packages')
  }
}

export const submitInquiry = async (inquiryData) => {
  try {
    const response = await inquiriesAPI.submit(inquiryData)
    return response
  } catch (error) {
    throw new Error(error.message || 'Failed to submit inquiry')
  }
}

export const checkHealth = async () => {
  try {
    const response = await healthAPI.check()
    return response
  } catch (error) {
    throw new Error('API health check failed')
  }
}

export default api
