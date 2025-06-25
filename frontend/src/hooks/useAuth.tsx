// Authentication hook with Internet Identity and Backend Integration
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { User, AuthState, VerificationLevel } from '../types/icp';
import { authService } from '../services/auth';

interface AuthContextType extends AuthState {
  login: () => Promise<boolean>;
  logout: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
  registerUser: (name: string, email: string, phone: string) => Promise<User | null>;
  updateProfile: (name: string, email: string, phone: string) => Promise<User | null>;
  verifyUser: (level: VerificationLevel) => Promise<User | null>;
  refreshUser: () => Promise<void>;
  completeRegistration: () => void; 
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Initialize authentication state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Handle window focus to check authentication status
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleWindowFocus = async () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        // Check if authentiction completed after window regains focus
        if (!isAuthenticated && !loading && !isRegistering) {
          console.log('Window focused, checking auth status...');
          try {
            const authenticated = await authService.isAuthenticated();
            if (authenticated) {
              console.log('Authentication detected after focus, updating state...');
              await initializeAuth();
            }
          } catch (error) {
            console.error('Focus auth check failed:', error);
          }
        }
      }, 500); // Delay to avoid immediate re-checking
    };

    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('focus', handleWindowFocus);
      clearTimeout(timeoutId);
    }
  }, [isAuthenticated, loading, isRegistering]);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔵 Initializing authentication...');

      // Check if registration is in progress
      if (isRegistering) {
        console.log('🟡 Skipping auth initialization - registration in progress');
        setLoading(false);
        return;
      }

      // Check if user is authenticated
      const authenticated = await authService.isAuthenticated();
      console.log('Authentication check result:', authenticated);
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Get principal
        const currentPrincipal = await authService.getCurrentPrincipal();
        setPrincipal(currentPrincipal);

        // Get user data with retry logic
        const currentUser = await getUserWithRetry();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      setError('Failed to initialize authentication');
      setIsAuthenticated(false);
      setUser(null);
      setPrincipal(null);
    } finally {
      setLoading(false);
    }
  };

  // Retry logic for fetching user data
  const getUserWithRetry = async (maxRetries = 3): Promise<User | null> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          return currentUser;
        }
        
        if (i < maxRetries - 1) {
          console.log(`🟡 User not found, retrying... (${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
      } catch (error) {
        console.error(`User fetch attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) throw error;
      }
    }
    return null;
  };

  const registerUser = async (name: string, email: string, phone: string): Promise<User | null> => {
    console.log('🔵 Starting registration...');    
    try {
      setError(null);
      setIsRegistering(true); // Set registration state to true

      const newUser = await authService.registerUser(name, email, phone);
      console.log('🟢 Registration successful:', newUser);

      if (newUser) {
        setUser(newUser);
        setIsAuthenticated(true);
        console.log('🟢 Auth state updated')
      }
     
      return newUser;
    } catch (error) {
      console.log('🔴 Registration error:', error);
      console.error('Registration failed:', error);
      setError(error instanceof Error ? error.message : 'Registration failed');
      return null;
    } finally {
      setIsRegistering(false); // Clear registration state
    }
  };

  // Function to complete registration process
  const completeRegistration = () => {
    setIsRegistering(false);
    console.log('🟢 Registration completed');
  };

  const login = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await authService.login();
     
      if (success) {
        // Force refresh of auth state
        console.log('Login successful, refreshing auth state...');

        // Add retry logic for certificate fetching
        let retries = 3;
        while (retries > 0) {
          try {
            // Get authentication status
            const authenticated = await authService.isAuthenticated();
            console.log('Authentication status:', authenticated);

            if (authenticated) {
              // Get principal
              const currentPrincipal = await authService.getCurrentPrincipal();
              console.log('Current principal:', currentPrincipal?.toString());
              setPrincipal(currentPrincipal);

              // Get user data
              const currentUser = await authService.getCurrentUser();
              console.log('Current user:', currentUser);
              setUser(currentUser);

              // Set authenticated state - triggers UI update (dashboard)
              setIsAuthenticated(true);
              break;
            }
          } catch (error: any) {
            if (error.message?.includes('CertificateOutdated')) {
              console.log(`Certificate outdated, retrying... (${retries} attempts left)`);
              retries--;
              // Wait a bit before retry
              await new Promise(resolve => setTimeout(resolve, 1000));
            } else {
              throw error;
            }
          }
        }

        return true;
      } else {
        setError('Login failed');
        return false;
      }
    } catch (error) {
      console.error('Login failed:', error);
      setError(error instanceof Error ? error.message : 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await authService.logout();
     
      // Clear state regardless of backend response
      setIsAuthenticated(false);
      setUser(null);
      setPrincipal(null);
     
      return success;
    } catch (error) {
      console.error('Logout failed:', error);
      setError(error instanceof Error ? error.message : 'Logout failed');
     
      // Clear state even if logout fails
      setIsAuthenticated(false);
      setUser(null);
      setPrincipal(null);
     
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (name: string, email: string, phone: string): Promise<User | null> => {
    try {
      setError(null);
      const updatedUser = await authService.updateProfile(name, email, phone);
     
      if (updatedUser) {
        setUser(updatedUser);
      }
     
      return updatedUser;
    } catch (error) {
      console.error('Profile update failed:', error);
      setError(error instanceof Error ? error.message : 'Profile update failed');
      return null;
    }
  };

  const verifyUser = async (level: VerificationLevel): Promise<User | null> => {
    try {
      setError(null);
      // Import userService here to avoid circular dependency
      const { userService } = await import('../services/userService');
      const verifiedUser = await userService.verifyUser(level);

      if (verifiedUser) {
        setUser(verifiedUser);
      }

      return verifiedUser;
    } catch (error) {
      console.error('User verification failed:', error);
      setError(error instanceof Error ? error.message : 'User verification failed');
      return null;
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (isAuthenticated) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value: AuthContextType = {
    isAuthenticated,
    user,
    principal,
    login,
    logout,
    loading,
    error,
    registerUser,
    updateProfile,
    verifyUser,
    refreshUser,
    completeRegistration,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthClient = () => {
  const auth = useAuth();
  return {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    principal: auth.principal,
    login: auth.login,
    logout: auth.logout,
    loading: auth.loading,
    error: auth.error,
  };
};
