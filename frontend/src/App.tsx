// Main App Component
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import './App.css';

// Loading component
const Loading: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading AI Chama Manager...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Main application content
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  // Add this useEffect for debugging
  useEffect(() => {
    console.log('App state changed:', { isAuthenticated, loading, user: !!user });
  }, [isAuthenticated, loading, user]);

  if (loading) {
    return <Loading />;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={!isAuthenticated ? <Login /> : <Navigate to="/" replace />} 
      />  
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* Placeholder routes for future pages */}
                <Route path="/profile" element={<Dashboard />} />
                <Route path="/chamas" element={<Dashboard />} />
                <Route path="/chamas/:id" element={<Dashboard />} />
                <Route path="/transactions" element={<Dashboard />} />
                <Route path="/loans" element={<Dashboard />} />
                <Route path="/governance" element={<Dashboard />} />
                <Route path="/meetings" element={<Dashboard />} />
                <Route path="/analytics" element={<Dashboard />} />
                <Route path="/ai-insights" element={<Dashboard />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } 
      />
    </Routes>
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
