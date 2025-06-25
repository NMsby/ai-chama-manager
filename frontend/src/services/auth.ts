// Authentication Service for Internet Computer
import { AuthClient } from '@dfinity/auth-client';
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { User, AuthState, VerificationLevel } from '../types/icp';
import { userService } from './userService';
import { chamaService } from './chamaService';
import { financialService } from './financialService';

class AuthService {
  private authClient: AuthClient | null = null;
  private agent: HttpAgent | null = null;

  // Initialize authentication client
  async initAuth(): Promise<AuthClient> {
    if (!this.authClient) {
      this.authClient = await AuthClient.create();
    }
    return this.authClient;
  }

  // Get HTTP Agent
  async getAgent(): Promise<HttpAgent> {
    if (!this.agent) {
      const authClient = await this.initAuth();
      const identity = authClient.getIdentity();
        
      // Create agent with identity
      this.agent = new HttpAgent({
        identity,
        host: process.env.NODE_ENV === 'production' 
          ? 'https://icp0.io' 
          : 'http://localhost:4943',
      });

      // Fetch root key for local development
      if (process.env.NODE_ENV !== 'production') {
        try {
          await this.agent.fetchRootKey();
        } catch (error) {
          console.warn('Failed to fetch root key:', error);
        }
      }
    }
    return this.agent;
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
              console.log('II Login successful, setting up agent and actors...');

              // Reset agent and user management actor for new identity
              this.agent = null;
              this.resetAllServiceActors();
              
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

      //Reset all service actors
      this.resetAllServiceActors();
      
      return true;
    } catch (error) {
      console.error('Logout failed:', error);
      return false;
    }
  }

  // Reset all service actors
  private async resetAllServiceActors() {
    try {
      // Reset agent
      userService.resetActor();

      // Reset chama service actor
      chamaService.resetActor();

      // Reset financial service actor
      financialService.resetActor();
    } catch (error) {
      console.error('Failed to reset service actors:', error);
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

  // Register new user (delegates to userService)
  async registerUser(name: string, email: string, phone: string): Promise<User | null> {
    return await userService.registerUser(name, email, phone);
  }

  // Get current user profile (delegates to userService)
  async getCurrentUser(): Promise<User | null> {
    return await userService.getCurrentUser();
  }

  // Update user profile (delegates to userService)
  async updateProfile(name: string, email: string, phone: string): Promise<User | null> {
    return await userService.updateProfile(name, email, phone);
  }

  // Verify user  (delegates to userService)
  async verifyUser(level: VerificationLevel): Promise<User | null> {
    return await userService.verifyUser(level);
  }

  // Health check
  async healthCheck(): Promise<string> {
    try {
      return await userService.healthCheck();
    } catch (error) {
      console.error('Health check failed:', error);
      return 'Service unavailable';
    }
  }
}

// Export singleton instance
export const authService = new AuthService();