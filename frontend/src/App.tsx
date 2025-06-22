// Main App Component with Authentication
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import UserProfile from './components/UserProfile';
import './App.css';

// Loading component
const Loading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

// Main application content
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, logout, user } = useAuth();

  // Add this useEffect for debugging
  useEffect(() => {
    console.log('App state changed:', { isAuthenticated, loading, user: !!user });
  }, [isAuthenticated, loading, user]);

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">AI Chama Manager</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.name || 'User'}
              </span>
              <button
                onClick={logout}
                className="bg-gray-800 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <Routes>
            <Route 
              path="/" 
              element={
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                  <UserProfile />
                </div>
              } 
            />
            <Route path="/profile" element={<UserProfile />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

// Main App component with Router and AuthProvider
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
