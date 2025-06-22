// Authentication hook with Internet Identity and Backend Integration
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { User, AuthState } from '../types/icp';
import { authService } from '../services/auth';

interface AuthContextType extends AuthState {
 login: () => Promise<boolean>;
 logout: () => Promise<boolean>;
 loading: boolean;
 error: string | null;
 registerUser: (name: string, email: string, phone: string) => Promise<User | null>;
 updateProfile: (name: string, email: string, phone: string) => Promise<User | null>;
 refreshUser: () => Promise<void>;
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

 // Initialize authentication state
 useEffect(() => {
   initializeAuth();
 }, []);

 const initializeAuth = async () => {
   try {
     setLoading(true);
     setError(null);

     // Check if user is authenticated
     const authenticated = await authService.isAuthenticated();
     setIsAuthenticated(authenticated);

     if (authenticated) {
       // Get principal
       const currentPrincipal = await authService.getCurrentPrincipal();
       setPrincipal(currentPrincipal);

       // Get user data
       const currentUser = await authService.getCurrentUser();
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

 const login = async (): Promise<boolean> => {
   try {
     setLoading(true);
     setError(null);

     const success = await authService.login();
     
     if (success) {
       // Refresh auth state after successful login
       await initializeAuth();
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

 const registerUser = async (name: string, email: string, phone: string): Promise<User | null> => {
   try {
     setError(null);
     const newUser = await authService.registerUser(name, email, phone);
     
     if (newUser) {
       setUser(newUser);
       setIsAuthenticated(true);
     }
     
     return newUser;
   } catch (error) {
     console.error('Registration failed:', error);
     setError(error instanceof Error ? error.message : 'Registration failed');
     return null;
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
   refreshUser,
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
