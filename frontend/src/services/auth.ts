// Authentication Service for Internet Computer
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { User, AuthState } from '../types/icp';

// Canister IDs (will be populated after deployment)
const USER_MANAGEMENT_CANISTER_ID = process.env.REACT_APP_USER_MANAGEMENT_CANISTER_ID || 'uxrrr-q7777-77774-qaaaq-cai';

// User Management Actor Interface
export interface UserManagementActor {
  registerUser: (name: string, email: string, phone: string) => Promise<any>;
  getMyProfile: () => Promise<[] | [User]>;
  getUserProfile: (userId: Principal) => Promise<[] | [User]>;
  updateProfile: (name: string, email: string, phone: string) => Promise<any>;
  verifyUser: () => Promise<boolean>;
  getAllUsers: () => Promise<User[]>;
  healthCheck: () => Promise<string>;
}

// IDL Factory for User Management (will be auto-generated later)
const userManagementIdlFactory = ({ IDL }: any) => {
  const UserId = IDL.Principal;
  const User = IDL.Record({
    'id' : UserId,
    'name' : IDL.Text,
    'email' : IDL.Text,
    'phone' : IDL.Text,
    'createdAt' : IDL.Int,
    'isVerified' : IDL.Bool,
  });
  const AuthError = IDL.Variant({
    'NotAuthenticated' : IDL.Null,
    'UserNotFound' : IDL.Null,
    'InvalidCredentials' : IDL.Null,
    'AlreadyExists' : IDL.Null,
  });
  const AuthResult = IDL.Variant({ 'ok' : User, 'err' : AuthError });
  
  return IDL.Service({
    'registerUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [AuthResult], []),
    'getMyProfile' : IDL.Func([], [IDL.Opt(User)], ['query']),
    'getUserProfile' : IDL.Func([UserId], [IDL.Opt(User)], ['query']),
    'updateProfile' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [AuthResult], []),
    'verifyUser' : IDL.Func([], [IDL.Bool], []),
    'getAllUsers' : IDL.Func([], [IDL.Vec(User)], ['query']),
    'healthCheck' : IDL.Func([], [IDL.Text], ['query']),
  });
};

class AuthService {
  private authClient: AuthClient | null = null;
  private userManagementActor: UserManagementActor | null = null;
  private agent: HttpAgent | null = null;

  // Initialize authentication client
  async initAuth(): Promise<AuthClient> {
    // Always create a new AuthClient instance for development
    this.authClient = await AuthClient.create({
      idleOptions: {
        disableIdle: true, // Disable idle timeout for development
      }
    });
    return this.authClient;
  }

  // Get HTTP Agent
  private async getAgent(): Promise<HttpAgent> {
    if (!this.agent) {
      const authClient = await this.initAuth();
      const identity = authClient.getIdentity();
      
      this.agent = new HttpAgent({
        identity,
        host: process.env.NODE_ENV === 'production' 
          ? 'https://icp0.io' 
          : 'http://localhost:4943',
      });

      // Fetch root key for local development
      if (process.env.NODE_ENV !== 'production') {
        await this.agent.fetchRootKey();
      }
    }
    return this.agent;
  }

  // Get User Management Actor
  private async getUserManagementActor(): Promise<UserManagementActor> {
    if (!this.userManagementActor) {
      const agent = await this.getAgent();
      this.userManagementActor = Actor.createActor(userManagementIdlFactory, {
        agent,
        canisterId: USER_MANAGEMENT_CANISTER_ID,
      }) as UserManagementActor;
    }
    return this.userManagementActor;
  }

  // Reset authentication state
  async resetAuthState(): Promise<void> {
    try {
      // Clear all auth-related state
      this.authClient = null;
      this.agent = null;
      this.userManagementActor = null;
    
      // Clear browser storage
      localStorage.removeItem('ic-identity');
      localStorage.removeItem('ic-delegation');
      sessionStorage.clear();
    
      console.log('Auth state reset successfully');
    } catch (error) {
      console.error('Failed to reset auth state:', error);
    }
  }

  // Login with Internet Identity
  async login(): Promise<boolean> {
    try {
      const authClient = await this.initAuth();
      
      return new Promise((resolve, reject) => {
        authClient.login({
          identityProvider: process.env.NODE_ENV === 'production' 
            ? 'https://identity.ic0.app' 
            : `http://127.0.0.1:4943/?canisterId=rdmx6-jaaaa-aaaaa-aaadq-cai`,
          onSuccess: async () => {
            try {
              // Reset agent to use new identity
              this.agent = null;
              this.userManagementActor = null;
              
              // No backend login call needed for Internet Identity - handles automatically
              resolve(true);
            } catch (error) {
              console.error('Post-login setup failed:', error);
              resolve(false);
            }
          },
          onError: (error) => {
            console.error('Identity login failed:', error);
            reject(error);
          },
        });
      });
    } catch (error) {
      console.error('Login initialization failed:', error);
      return false;
    }
  }

  // Logout
  async logout(): Promise<boolean> {
    try {
      const authClient = await this.initAuth();
      
      // Logout from Internet Identity
      await authClient.logout();
      
      // Reset local state
      this.agent = null;
      this.userManagementActor = null;
      
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    try {
      const authClient = await this.initAuth();
      return await authClient.isAuthenticated();
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  // Get current user's principal
  async getCurrentPrincipal(): Promise<Principal | null> {
    try {
      const authClient = await this.initAuth();
      const identity = authClient.getIdentity();
      return identity.getPrincipal();
    } catch (error) {
      console.error('Failed to get principal:', error);
      return null;
    }
  }

  // Register new user
  async registerUser(name: string, email: string, phone: string): Promise<User | null> {
    try {
      const actor = await this.getUserManagementActor();
      const result = await actor.registerUser(name, email, phone);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Registration failed:', result.err);
        return null;
      }
    } catch (error) {
      console.error('Registration error:', error);
      return null;
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User | null> {
    try {
      const actor = await this.getUserManagementActor();
      const result = await actor.getMyProfile();
      
      if (result.length > 0 && result[0]) {
        return result[0];
      }
      return null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Update user profile
  async updateProfile(name: string, email: string, phone: string): Promise<User | null> {
    try {
      const actor = await this.getUserManagementActor();
      const result = await actor.updateProfile(name, email, phone);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Profile update failed:', result.err);
        return null;
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<string> {
    try {
      const actor = await this.getUserManagementActor();
      return await actor.healthCheck();
    } catch (error) {
      console.error('Health check failed:', error);
      return 'Service unavailable';
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
