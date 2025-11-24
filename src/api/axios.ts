import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://flowchat-81ni.onrender.com/api",
    withCredentials: true, // Still try cookies first
});

// Simple token storage (iOS Safari fallback)
const TOKEN_KEY = 'auth_token';

export const tokenStorage = {
  get: () => {
    if (typeof window === 'undefined') return null;
    try {
      return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  
  set: (token: string) => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  },
  
  remove: () => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }
};

// Request interceptor - add token to headers if available
axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenStorage.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Token attached to request');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token from response
axiosInstance.interceptors.response.use(
  (response) => {
    // If response contains a token, store it (for iOS Safari)
    if (response.data?.token) {
      tokenStorage.set(response.data.token);
      console.log('✅ Token stored from response');
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      console.log('❌ Unauthorized - clearing token');
      tokenStorage.remove();
      
      // Redirect to login if not already there
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;