// User Management Service
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { User, UserStats, VerificationLevel, UserFilter } from '../types/icp';
import { authService } from './auth';

// User Management Actor Interface
export interface UserManagementActor {
  registerUser: (name: string, email: string, phone: string) => Promise<{ ok: User } | { err: any }>;
  getMyProfile: () => Promise<[] | [User]>;
  getUserProfile: (userId: Principal) => Promise<[] | [User]>;
  updateProfile: (name: string, email: string, phone: string) => Promise<{ ok: User } | { err: any }>;
  verifyUser: (level: VerificationLevel) => Promise<{ ok: User } | { err: any }>;
  getMyStats: () => Promise<[] | [UserStats]>;
  searchUsers: (query: string) => Promise<User[]>;
  getAllUsers: (filter: [] | [UserFilter]) => Promise<User[]>;
  getUserCount: () => Promise<bigint>;
  addChamaToUser: (userId: Principal, chamaId: string) => Promise<boolean>;
  healthCheck: () => Promise<string>;
}

// IDL Factory for User Management
const userManagementIdlFactory = ({ IDL }: any) => {
  const UserId = IDL.Principal;
  const VerificationLevel = IDL.Variant({
    'basic' : IDL.Null,
    'intermediate' : IDL.Null,
    'advanced' : IDL.Null,
  });
  
  const User = IDL.Record({
    'id' : UserId,
    'name' : IDL.Text,
    'email' : IDL.Text,
    'phone' : IDL.Text,
    'nationalId' : IDL.Opt(IDL.Text),
    'profileImage' : IDL.Opt(IDL.Text),
    'createdAt' : IDL.Int,
    'updatedAt' : IDL.Int,
    'isVerified' : IDL.Bool,
    'verificationLevel' : VerificationLevel,
    'creditScore' : IDL.Float64,
    'totalContributions' : IDL.Nat,
    'totalWithdrawals' : IDL.Nat,
    'chamasJoined' : IDL.Vec(IDL.Text),
    'chamasCreated' : IDL.Vec(IDL.Text),
  });

  const UserStats = IDL.Record({
    'userId' : UserId,
    'totalSavings' : IDL.Nat,
    'averageContribution' : IDL.Nat,
    'contributionStreak' : IDL.Nat,
    'riskScore' : IDL.Float64,
    'reliabilityScore' : IDL.Float64,
    'lastActivity' : IDL.Int,
  });

  const UserFilter = IDL.Record({
    'isVerified' : IDL.Opt(IDL.Bool),
    'verificationLevel' : IDL.Opt(VerificationLevel),
    'minCreditScore' : IDL.Opt(IDL.Float64),
    'chamaId' : IDL.Opt(IDL.Text),
  });

  const UserError = IDL.Variant({
    'NotFound' : IDL.Null,
    'AlreadyExists' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'InvalidData' : IDL.Null,
    'VerificationRequired' : IDL.Null,
  });

  const UserResult = IDL.Variant({ 'ok' : User, 'err' : UserError });

  return IDL.Service({
    'registerUser' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [UserResult], []),
    'getMyProfile' : IDL.Func([], [IDL.Opt(User)], []),
    'getUserProfile' : IDL.Func([UserId], [IDL.Opt(User)], ['query']),
    'updateProfile' : IDL.Func([IDL.Text, IDL.Text, IDL.Text], [UserResult], []),
    'verifyUser' : IDL.Func([VerificationLevel], [UserResult], []),
    'getMyStats' : IDL.Func([], [IDL.Opt(UserStats)], []),
    'searchUsers' : IDL.Func([IDL.Text], [IDL.Vec(User)], ['query']),
    'getAllUsers' : IDL.Func([IDL.Opt(UserFilter)], [IDL.Vec(User)], ['query']),
    'getUserCount' : IDL.Func([], [IDL.Nat], ['query']),
    'addChamaToUser' : IDL.Func([UserId, IDL.Text], [IDL.Bool], []),
    'healthCheck' : IDL.Func([], [IDL.Text], ['query']),
  });
};

class UserService {
  private userManagementActor: UserManagementActor | null = null;

  // Get User Management Actor
  private async getUserManagementActor(): Promise<UserManagementActor> {
    if (!this.userManagementActor) {
      const agent = await authService.getAgent();
      const canisterId = process.env.REACT_APP_USER_MANAGEMENT_CANISTER_ID || 'ulvla-h7777-77774-qaacq-cai';
      
      this.userManagementActor = Actor.createActor(userManagementIdlFactory, {
        agent,
        canisterId,
      }) as UserManagementActor;
    }
    return this.userManagementActor;
  }

  // Reset actor (for logout)
  resetActor() {
    try {
      // Reset the user management actor
      this.userManagementActor = null;

      console.log('User actor reset successfully');
    } catch (error) {
      console.error('Failed to reset user actor:', error);
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
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<User | null> {
    try {
      const actor = await this.getUserManagementActor();
      const result = await actor.getMyProfile();
      
      return result.length > 0 && result[0] !== undefined ? result[0] : null;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  // Get user by ID
  async getUserById(userId: Principal): Promise<User | null> {
    try {
      const actor = await this.getUserManagementActor();
      const result = await actor.getUserProfile(userId);
      
      return result.length > 0 && result[0] !== undefined ? result[0] : null;
    } catch (error) {
      console.error('Failed to get user by ID:', error);
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
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  // Verify user
  async verifyUser(level: VerificationLevel): Promise<User | null> {
    try {
      const actor = await this.getUserManagementActor();
      const result = await actor.verifyUser(level);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('User verification failed:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('User verification error:', error);
      throw error;
    }
  }

  // Get user statistics
  async getUserStats(): Promise<UserStats | null> {
    try {
      console.log('🔵 Getting user management actor...');
      const actor = await this.getUserManagementActor();
      
      console.log('🔵 Calling getMyStats()...');
      const result = await actor.getMyStats();

      console.log('🔵 getMyStats result:', result);
      console.log('🔵 Result type:', typeof result);
      console.log('🔵 Result length:', Array.isArray(result) ? result.length : 'Not an array');
    
      if (Array.isArray(result) && result.length > 0 && result[0] !== undefined) {
        console.log('🟢 User stats found:', result[0]);
        return result[0];
      } else {
        console.log('🟡 No user stats found, returning null');
        return null;
      }
    } catch (error) {
      console.error('🔴 Failed to get user stats:', error);
      throw error; // Re-throw to be handled by caller
    }
  }

  // Search users
  async searchUsers(query: string): Promise<User[]> {
    try {
      const actor = await this.getUserManagementActor();
      return await actor.searchUsers(query);
    } catch (error) {
      console.error('User search failed:', error);
      return [];
    }
  }

  // Get all users with filter
  async getAllUsers(filter?: UserFilter): Promise<User[]> {
    try {
      const actor = await this.getUserManagementActor();
      return await actor.getAllUsers(filter ? [filter] : []);
    } catch (error) {
      console.error('Failed to get all users:', error);
      return [];
    }
  }

  // Get user count
  async getUserCount(): Promise<number> {
    try {
      const actor = await this.getUserManagementActor();
      const result = await actor.getUserCount();
      return Number(result);
    } catch (error) {
      console.error('Failed to get user count:', error);
      return 0;
    }
  }

  // Add chama to user
  async addChamaToUser(userId: Principal, chamaId: string): Promise<boolean> {
    try {
      const actor = await this.getUserManagementActor();
      return await actor.addChamaToUser(userId, chamaId);
    } catch (error) {
      console.error('Failed to add chama to user:', error);
      return false;
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

  // Helper function to convert error codes to user-friendly messages
  private getErrorMessage(error: any): string {
    console.log('🔵 Processing error:', error);

    if (typeof error === 'object' && error !== null) {
      if ('NotFound' in error) return 'User profile not found. Please try logging in again.';
      if ('AlreadyExists' in error) return 'This email address is already registered. Please use a different email or try logging in.';
      if ('NotAuthorized' in error) return 'You are not authorized to perform this action. Please log in again.';
      if ('InvalidData' in error) return 'The information provided is invalid. Please check your details and try again.';
      if ('VerificationRequired' in error) return 'Account verification is required before proceeding.';
    }

    // Check for network/connection errors
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return 'Network connection failed. Please check your internet connection and try again.';
      }
      if (error.message.includes('canister')) {
        return 'Service temporarily unavailable. Please try again in a few moments.';
      }
      if (error.message.includes('Certificate')) {
        return 'Authentication session expired. Please log in again.';
      }
    }

    return `Registration failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`;
  }
}

// Export singleton instance
export const userService = new UserService();