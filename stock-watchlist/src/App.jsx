import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Watchlist from './pages/Watchlist';
import apiService from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      if (apiService.isAuthenticated()) {
        try {
          const response = await apiService.getProfile();
          if (response.success) {
            setUser(response.data.user);
          }
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear invalid token
          apiService.setToken(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    apiService.setToken(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              user ? 
                <Navigate to="/watchlist" replace /> : 
                <Login onLogin={handleLogin} />
            } 
          />
          <Route 
            path="/watchlist" 
            element={
              user ? 
                <Watchlist user={user} onLogout={handleLogout} /> : 
                <Navigate to="/" replace />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
