import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './components/Home';
import Library from './components/Library';
import Profile from './components/Profile';
import Users from './components/Users';
import UserProfile from './components/UserProfile';
import Login from './components/Login';
import Register from './components/Register';
import GameDetail from './components/GameDetail';
import SearchResults from './components/SearchResults';
import Footer from './components/Footer';
import './styles/App.css';

function AppContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Navigate to search results page
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); // Clear search after navigating
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-bg text-text-primary">
      {/* Floating Left Navigation Bar - Centered on left side */}
      <nav className="fixed top-1/2 left-6 transform -translate-y-1/2 w-14 bg-nav-bg rounded-2xl shadow-2xl flex flex-col items-center py-4 space-y-6 z-50">
        <Link to="/" className="group relative">
          <div className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors duration-200">
            {/* House Icon */}
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
          </div>
          {/* Tooltip */}
          <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-nav-bg text-text-primary text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-60">
            Home
            <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-nav-bg"></div>
          </div>
        </Link>
        
        {isAuthenticated() && (
          <>
            <Link to="/library" className="group relative">
              <div className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors duration-200">
                {/* Three horizontal bars */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
                </svg>
              </div>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-nav-bg text-text-primary text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-60">
                Library
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-nav-bg"></div>
              </div>
            </Link>
            
            <Link to="/users" className="group relative">
              <div className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors duration-200">
                {/* Users Icon */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c2.67 0 8 1.34 8 4v2h-8v-2c0-.71-.71-1.38-1.71-1.93C14.95 13.22 15.46 12 16 12zM8 4c2.21 0 4 1.79 4 4s-1.79 4-4 4-4-1.79-4-4 1.79-4 4-4zm0 2C6.9 6 6 6.9 6 8s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c2.67 0 8 1.34 8 4v2H0v-2c0-2.66 5.33-4 8-4z"/>
                </svg>
              </div>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-nav-bg text-text-primary text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-60">
                Users
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-nav-bg"></div>
              </div>
            </Link>
            
            <Link to="/profile" className="group relative">
              <div className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors duration-200">
                {/* Person Icon */}
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 transform -translate-y-1/2 bg-nav-bg text-text-primary text-sm px-3 py-2 rounded-lg shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-60">
                Profile
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-nav-bg"></div>
              </div>
            </Link>
          </>
        )}
      </nav>

      {/* Top Right Auth Buttons */}
      <div className="fixed top-6 right-6 z-40">
        {isAuthenticated() ? (
          <div className="flex items-center space-x-4">
            <span className="text-text-secondary text-sm">
              Welcome, {user?.username || 'User'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <Link 
              to="/login" 
              className="bg-card-bg hover:bg-hover-gray text-text-primary px-4 py-2 rounded-lg transition-colors text-sm font-medium border border-accent-gray"
            >
              Sign In
            </Link>
            <Link 
              to="/register" 
              className="bg-accent-primary hover:bg-accent-secondary text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="ml-20 min-h-screen">
        {/* Search Bar - Aligned with content */}
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-40" style={{transform: 'translateX(-50%) translateX(44px)'}}>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearch}
              placeholder="Search for games and press Enter..."
              className="w-[500px] px-6 py-3 bg-card-bg text-text-primary placeholder-text-secondary border border-accent-gray rounded-xl focus:outline-none focus:border-text-secondary transition-colors duration-200 text-center"
            />
            {searchQuery.length > 0 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-text-secondary text-sm">
                Press Enter ↵
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="pt-32 px-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/game/:guid" element={<GameDetail />} />
            <Route 
              path="/library" 
              element={
                <ProtectedRoute>
                  <Library />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users" 
              element={
                <ProtectedRoute>
                  <Users />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/users/:userId" 
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
        
        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;