// API service for Stock Watchlist application
const API_BASE_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get authentication headers
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication methods
  async register(userData) {
    return this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    const response = await this.request('/users/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data.token) {
      this.setToken(response.data.token);
    }

    return response;
  }

  async logout() {
    try {
      await this.request('/users/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.setToken(null);
    }
  }

  // User profile methods
  async getProfile() {
    return this.request('/users/profile');
  }

  // Stock methods
  async searchStocks(query) {
    return this.request(`/stocks/search?q=${encodeURIComponent(query)}`);
  }

  async getWatchlist() {
    return this.request('/stocks');
  }

  async addToWatchlist(stockData) {
    return this.request('/stocks', {
      method: 'POST',
      body: JSON.stringify(stockData),
    });
  }

  async removeFromWatchlist(symbol) {
    return this.request(`/stocks/${symbol}`, {
      method: 'DELETE',
    });
  }

  async updateStock(symbol, stockData) {
    return this.request(`/stocks/${symbol}`, {
      method: 'PUT',
      body: JSON.stringify(stockData),
    });
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }
}

export default new ApiService();