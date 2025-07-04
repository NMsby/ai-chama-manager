// Main App Component
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './components/Login';
import UserRegistration from './components/UserRegistration';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import './App.css';
import ChamaList from './pages/ChamaList';
import CreateChama from './pages/CreateChama';
import ChamaDiscovery from './pages/ChamaDiscovery';
import ChamaDetail from './pages/ChamaDetail';

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

// Registration Flow Component
const RegistrationFlow: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user exists, redirect to dashboard
  if (user) {
    return <Navigate to="/" replace />;
  }

  // Show registration form for authenticated users without profiles
  return (
    <UserRegistration 
      onRegistrationComplete={(user) => {
        console.log('🟢 Registration completed, navigating to dashboard...');
        // Use React Router navigation instead of page reload
        navigate('/', { replace: true });
      }} 
    />
  );
}

// Main application content
const AppContent: React.FC = () => {
  const { isAuthenticated, loading, user } = useAuth();

  // Log app state changes for debugging
  useEffect(() => {
    console.log('App state changed:', { 
      isAuthenticated, 
      loading, 
      user: !!user,
      userObject: user,
      currentPath: window.location.pathname,
      timestamp: new Date().toISOString()
    });
  }, [isAuthenticated, loading, user]);

  // Log route changes for debugging
  useEffect(() => {
    console.log('Route changed:', window.location.pathname);
  }, [window.location.pathname]);

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
        path="/register" 
        element={<RegistrationFlow />}  
      />
      <Route 
        path="/*" 
        element={
          <ProtectedRoute>
            {!user ? (
              <Navigate to="/register" replace />
            ) : (
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/dashboard" element={<Dashboard />} />

                  {/* User-related routes */}
                  <Route path="/profile" element={<UserManagement />} />
                  <Route path="/users" element={<UserManagement />} />
                  <Route path="/user-management" element={<UserManagement />} />

                  {/* Chama-related routes */}
                  <Route path="/chamas" element={<ChamaList />} />
                  <Route path="/chamas/create" element={<CreateChama />} />
                  <Route path="/chamas/discover" element={<ChamaDiscovery />} />
                  <Route path="/chamas/:id" element={<ChamaDetail />} />
                  <Route path="/chamas/:id/edit" element={<CreateChama />} />
                  
                  {/* Placeholder for other routes */}
                  <Route path="/transactions" element={<Dashboard />} />
                  <Route path="/loans" element={<Dashboard />} />
                  <Route path="/governance" element={<Dashboard />} />
                  <Route path="/meetings" element={<Dashboard />} />
                  <Route path="/analytics" element={<Dashboard />} />
                  <Route path="/ai-insights" element={<Dashboard />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            )}
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
};

// Main App component with Router, AuthProvider and ErrorBoundary
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
