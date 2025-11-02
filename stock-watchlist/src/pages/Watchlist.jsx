import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import './Watchlist.css';

const Watchlist = ({ user, onLogout }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchError, setSearchError] = useState('');
  const navigate = useNavigate();

  // Fetch user's watchlist on component mount
  useEffect(() => {
    fetchWatchlist();
  }, []);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await apiService.getWatchlist();
      if (response.success) {
        setWatchlist(response.data.stocks || []);
      }
    } catch (err) {
      setError('Failed to fetch watchlist');
      console.error('Fetch watchlist error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError('Please enter a search term');
      return;
    }

    setSearchLoading(true);
    setSearchError('');
    setSearchResults([]);

    try {
      const response = await apiService.searchStocks(searchQuery.trim());
      if (response.success) {
        setSearchResults(response.data.results || []);
        if (response.data.results.length === 0) {
          setSearchError('No stocks found for your search');
        }
      }
    } catch (err) {
      setSearchError('Failed to search stocks. Please try again.');
      console.error('Search error:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddToWatchlist = async (stock) => {
    try {
      const response = await apiService.addToWatchlist({
        symbol: stock.symbol,
        name: stock.name
      });

      if (response.success) {
        // Add to local watchlist
        setWatchlist(prev => [...prev, response.data.stock]);
        
        // Remove from search results
        setSearchResults(prev => 
          prev.filter(s => s.symbol !== stock.symbol)
        );

        // Show success message temporarily
        setError('');
      }
    } catch (err) {
      if (err.message.includes('already exists')) {
        setError('Stock is already in your watchlist');
      } else {
        setError('Failed to add stock to watchlist');
      }
      console.error('Add to watchlist error:', err);
    }
  };

  const handleRemoveFromWatchlist = async (symbol) => {
    try {
      await apiService.removeFromWatchlist(symbol);
      
      // Remove from local watchlist
      setWatchlist(prev => prev.filter(stock => stock.symbol !== symbol));
      setError('');
    } catch (err) {
      setError('Failed to remove stock from watchlist');
      console.error('Remove from watchlist error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await apiService.logout();
      onLogout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
      // Even if logout fails, clear local state
      onLogout();
      navigate('/');
    }
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClearSearch = () => {
    setSearchResults([]);
    setSearchQuery('');
    setSearchError('');
  };

  const isStockInWatchlist = (symbol) => {
    return watchlist.some(stock => stock.symbol === symbol);
  };

  return (
    <div className="watchlist-container">
      {/* Header */}
      <header className="watchlist-header">
        <div className="header-content">
          <h1>Stock Watchlist</h1>
          <div className="user-info">
            <span>Welcome, {user?.username || 'User'}!</span>
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="watchlist-main">
        {/* Search Section */}
        <section className="search-section">
          <h2>Search Stocks</h2>
          <div className="search-container">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
              placeholder="Enter stock symbol or name (e.g., AAPL, Tesla, Reliance)"
              className="search-input"
            />
            <button 
              onClick={handleSearch}
              disabled={searchLoading}
              className="search-button"
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </button>
            {(searchResults.length > 0 || searchQuery) && (
              <button 
                onClick={handleClearSearch}
                className="clear-button"
                title="Clear search results and input"
              >
                Clear
              </button>
            )}
          </div>

          {searchError && <div className="error-message">{searchError}</div>}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results">
              <h3>Search Results</h3>
              <div className="results-grid">
                {searchResults.map((stock) => (
                  <div key={stock.symbol} className="stock-card">
                    <div className="stock-info">
                      <h4>{stock.symbol}</h4>
                      <p>{stock.name}</p>
                      {stock.exchange && (
                        <span className="exchange">{stock.exchange}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAddToWatchlist(stock)}
                      disabled={isStockInWatchlist(stock.symbol)}
                      className={`add-button ${isStockInWatchlist(stock.symbol) ? 'disabled' : ''}`}
                    >
                      {isStockInWatchlist(stock.symbol) ? 'In Watchlist' : 'Add to Watchlist'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Watchlist Section */}
        <section className="watchlist-section">
          <h2>My Watchlist ({watchlist.length})</h2>

          {error && <div className="error-message">{error}</div>}

          {loading ? (
            <div className="loading">Loading your watchlist...</div>
          ) : watchlist.length === 0 ? (
            <div className="empty-watchlist">
              <p>Your watchlist is empty</p>
              <p>Search for stocks above to add them to your watchlist</p>
            </div>
          ) : (
            <div className="watchlist-grid">
              {watchlist.map((stock) => (
                <div key={stock.symbol} className="watchlist-item">
                  <div className="stock-info">
                    <h4>{stock.symbol}</h4>
                    <p>{stock.name}</p>
                    <span className="added-date">
                      Added: {new Date(stock.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveFromWatchlist(stock.symbol)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default Watchlist;