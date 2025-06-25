// Comprehensive Chama Management Service
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { 
  Chama, 
  ChamaId, 
  ChamaFilter, 
  ChamaType, 
  ContributionFrequency, 
  MemberRole, 
  Treasury, 
  UserId 
} from '../types/icp';
import { authService } from './auth';

// Chama Management Actor Interface
export interface ChamaManagementActor {
  createChama: (
    name: string,
    description: string,
    contributionAmount: bigint,
    contributionFrequency: ContributionFrequency,
    chamaType: ChamaType,
    maxMembers: bigint
  ) => Promise<{ ok: Chama } | { err: any }>;
  getChama: (chamaId: ChamaId) => Promise<[] | [Chama]>;
  updateChama: (chamaId: ChamaId, updatedChama: Chama) => Promise<{ ok: Chama } | { err: any }>;
  joinChama: (chamaId: ChamaId) => Promise<{ ok: Chama } | { err: any }>;
  addMember: (chamaId: ChamaId, userId: Principal) => Promise<{ ok: Chama } | { err: any }>;
  removeMember: (chamaId: ChamaId, userId: Principal) => Promise<{ ok: Chama } | { err: any }>;
  updateMemberRole: (chamaId: ChamaId, userId: Principal, newRole: MemberRole) => Promise<{ ok: Chama } | { err: any }>;
  updateTreasury: (chamaId: ChamaId, treasury: Treasury) => Promise<boolean>;
  getChamasByCreator: (creatorId: Principal) => Promise<Chama[]>;
  getChamasByMember: (memberId: Principal) => Promise<Chama[]>;
  getMyChamas: () => Promise<Chama[]>;
  getPublicChamas: (filter: [] | [ChamaFilter]) => Promise<Chama[]>;
  searchChamas: (query: string) => Promise<Chama[]>;
  getChamaCount: () => Promise<bigint>;
  healthCheck: () => Promise<string>;
}

// IDL Factory for Chama Management
const chamaManagementIdlFactory = ({ IDL }: any) => {
  const UserId = IDL.Principal;
  const ChamaId = IDL.Text;
  
  const ContributionFrequency = IDL.Variant({
    'daily' : IDL.Null,
    'weekly' : IDL.Null,
    'biweekly' : IDL.Null,
    'monthly' : IDL.Null,
    'quarterly' : IDL.Null,
  });

  const MeetingFrequency = IDL.Variant({
    'weekly' : IDL.Null,
    'biweekly' : IDL.Null,
    'monthly' : IDL.Null,
    'quarterly' : IDL.Null,
  });

  const ChamaType = IDL.Variant({
    'savings' : IDL.Null,
    'investment' : IDL.Null,
    'microCredit' : IDL.Null,
    'welfare' : IDL.Null,
    'business' : IDL.Null,
  });

  const ChamaStatus = IDL.Variant({
    'forming' : IDL.Null,
    'active' : IDL.Null,
    'suspended' : IDL.Null,
    'dissolved' : IDL.Null,
  });

  const MemberRole = IDL.Variant({
    'owner' : IDL.Null,
    'admin' : IDL.Null,
    'treasurer' : IDL.Null,
    'secretary' : IDL.Null,
    'member' : IDL.Null,
  });

  const MemberStatus = IDL.Variant({
    'active' : IDL.Null,
    'suspended' : IDL.Null,
    'inactive' : IDL.Null,
    'expelled' : IDL.Null,
  });

  const ChamaMember = IDL.Record({
    'userId' : UserId,
    'joinedAt' : IDL.Int,
    'role' : MemberRole,
    'status' : MemberStatus,
    'contributionBalance' : IDL.Nat,
    'loanBalance' : IDL.Nat,
    'lastContribution' : IDL.Opt(IDL.Int),
    'missedContributions' : IDL.Nat,
  });

  const ChamaRules = IDL.Record({
    'minimumContribution' : IDL.Nat,
    'latePenalty' : IDL.Nat,
    'withdrawalNotice' : IDL.Nat,
    'quorumPercentage' : IDL.Nat,
    'loanInterestRate' : IDL.Float64,
    'maxLoanAmount' : IDL.Nat,
    'loanRepaymentPeriod' : IDL.Nat,
  });

  const Treasury = IDL.Record({
    'totalFunds' : IDL.Nat,
    'availableFunds' : IDL.Nat,
    'reserveFunds' : IDL.Nat,
    'loansFunds' : IDL.Nat,
    'emergencyFunds' : IDL.Nat,
    'lastUpdated' : IDL.Int,
  });

  const NotificationSettings = IDL.Record({
    'contributionReminders' : IDL.Bool,
    'meetingNotifications' : IDL.Bool,
    'proposalAlerts' : IDL.Bool,
    'loanReminders' : IDL.Bool,
    'aiInsights' : IDL.Bool,
  });

  const ChamaSettings = IDL.Record({
    'isPublic' : IDL.Bool,
    'allowExternalLoans' : IDL.Bool,
    'requireApprovalForJoining' : IDL.Bool,
    'enableAIRecommendations' : IDL.Bool,
    'notificationPreferences' : NotificationSettings,
  });

  const Chama = IDL.Record({
    'id' : ChamaId,
    'name' : IDL.Text,
    'description' : IDL.Text,
    'creator' : UserId,
    'admins' : IDL.Vec(UserId),
    'members' : IDL.Vec(ChamaMember),
    'maxMembers' : IDL.Nat,
    'contributionAmount' : IDL.Nat,
    'contributionFrequency' : ContributionFrequency,
    'meetingFrequency' : MeetingFrequency,
    'chamaType' : ChamaType,
    'rules' : ChamaRules,
    'treasury' : Treasury,
    'createdAt' : IDL.Int,
    'updatedAt' : IDL.Int,
    'isActive' : IDL.Bool,
    'status' : ChamaStatus,
    'settings' : ChamaSettings,
  });

  const ChamaFilter = IDL.Record({
    'chamaType' : IDL.Opt(ChamaType),
    'status' : IDL.Opt(ChamaStatus),
    'isPublic' : IDL.Opt(IDL.Bool),
    'minMembers' : IDL.Opt(IDL.Nat),
    'maxMembers' : IDL.Opt(IDL.Nat),
    'contributionRange' : IDL.Opt(IDL.Tuple(IDL.Nat, IDL.Nat)),
  });

  const ChamaError = IDL.Variant({
    'NotFound' : IDL.Null,
    'AlreadyExists' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'InvalidData' : IDL.Null,
    'MaxMembersReached' : IDL.Null,
    'InsufficientFunds' : IDL.Null,
    'NotActive' : IDL.Null,
  });

  const ChamaResult = IDL.Variant({ 'ok' : Chama, 'err' : ChamaError });

  return IDL.Service({
    'createChama' : IDL.Func([IDL.Text, IDL.Text, IDL.Nat, ContributionFrequency, ChamaType, IDL.Nat], [ChamaResult], []),
    'getChama' : IDL.Func([ChamaId], [IDL.Opt(Chama)], ['query']),
    'updateChama' : IDL.Func([ChamaId, Chama], [ChamaResult], []),
    'joinChama' : IDL.Func([ChamaId], [ChamaResult], []),
    'addMember' : IDL.Func([ChamaId, UserId], [ChamaResult], []),
    'removeMember' : IDL.Func([ChamaId, UserId], [ChamaResult], []),
    'updateMemberRole' : IDL.Func([ChamaId, UserId, MemberRole], [ChamaResult], []),
    'updateTreasury' : IDL.Func([ChamaId, Treasury], [IDL.Bool], []),
    'getChamasByCreator' : IDL.Func([UserId], [IDL.Vec(Chama)], ['query']),
    'getChamasByMember' : IDL.Func([UserId], [IDL.Vec(Chama)], ['query']),
    'getMyChamas' : IDL.Func([], [IDL.Vec(Chama)], []),
    'getPublicChamas' : IDL.Func([IDL.Opt(ChamaFilter)], [IDL.Vec(Chama)], ['query']),
    'searchChamas' : IDL.Func([IDL.Text], [IDL.Vec(Chama)], ['query']),
    'getChamaCount' : IDL.Func([], [IDL.Nat], ['query']),
    'healthCheck' : IDL.Func([], [IDL.Text], ['query']),
  });
};

class ChamaService {
  private chamaManagementActor: ChamaManagementActor | null = null;

  // Get Chama Management Actor
  private async getChamaManagementActor(): Promise<ChamaManagementActor> {
    if (!this.chamaManagementActor) {
      const agent = await authService.getAgent();
      const canisterId = process.env.REACT_APP_CHAMA_MANAGEMENT_CANISTER_ID || 'ryjl3-tyaaa-aaaaa-aaaba-cai';
      
      this.chamaManagementActor = Actor.createActor(chamaManagementIdlFactory, {
        agent,
        canisterId,
      }) as ChamaManagementActor;
    }
    return this.chamaManagementActor;
  }

  // Reset actor (for logout)
  resetActor() {
    this.chamaManagementActor = null;
  }

  // Create new chama
  async createChama(
    name: string,
    description: string,
    contributionAmount: number,
    contributionFrequency: ContributionFrequency,
    chamaType: ChamaType,
    maxMembers: number
  ): Promise<Chama | null> {
    try {
      const actor = await this.getChamaManagementActor();
      const result = await actor.createChama(
        name,
        description,
        BigInt(contributionAmount),
        contributionFrequency,
        chamaType,
        BigInt(maxMembers)
      );
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Chama creation failed:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Chama creation error:', error);
      throw error;
    }
  }

  // Get chama by ID
  async getChamaById(chamaId: ChamaId): Promise<Chama | null> {
    try {
      const actor = await this.getChamaManagementActor();
      const result = await actor.getChama(chamaId);
      
      return result.length > 0 && result[0] !== undefined ? result[0] : null;
    } catch (error) {
      console.error('Failed to get chama by ID:', error);
      return null;
    }
  }

  // Update chama
  async updateChama(chamaId: ChamaId, updatedChama: Chama): Promise<Chama | null> {
    try {
      const actor = await this.getChamaManagementActor();
      const result = await actor.updateChama(chamaId, updatedChama);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Chama update failed:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Chama update error:', error);
      throw error;
    }
  }

  // Join chama
  async joinChama(chamaId: ChamaId): Promise<Chama | null> {
    try {
      const actor = await this.getChamaManagementActor();
      const result = await actor.joinChama(chamaId);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Failed to join chama:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Join chama error:', error);
      throw error;
    }
  }

  // Add member to chama
  async addMember(chamaId: ChamaId, userId: Principal): Promise<Chama | null> {
    try {
      const actor = await this.getChamaManagementActor();
      const result = await actor.addMember(chamaId, userId);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Failed to add member:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Add member error:', error);
      throw error;
    }
  }

  // Remove member from chama
  async removeMember(chamaId: ChamaId, userId: Principal): Promise<Chama | null> {
    try {
      const actor = await this.getChamaManagementActor();
      const result = await actor.removeMember(chamaId, userId);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Failed to remove member:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Remove member error:', error);
      throw error;
    }
  }

  // Update member role
  async updateMemberRole(chamaId: ChamaId, userId: Principal, newRole: MemberRole): Promise<Chama | null> {
    try {
      const actor = await this.getChamaManagementActor();
      const result = await actor.updateMemberRole(chamaId, userId, newRole);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Failed to update member role:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Update member role error:', error);
      throw error;
    }
  }

  // Get my chamas
  async getMyChamas(): Promise<Chama[]> {
    try {
      const actor = await this.getChamaManagementActor();
      return await actor.getMyChamas();
    } catch (error) {
      console.error('Failed to get my chamas:', error);
      throw new Error('Failed to retrieve your chamas');
    }
  }

  // Get chamas by creator
  async getChamasByCreator(creatorId: string): Promise<Chama[]> {
    try {
      const actor = await this.getChamaManagementActor();
      const principal = Principal.fromText(creatorId);
      const result = await actor.getChamasByCreator(principal);
      return result;
    } catch (error) {
      console.error('Failed to get chamas by creator:', error);
      throw new Error('Failed to retrieve created chamas');
    }
  }

  // Get public chamas
  async getPublicChamas(filter?: ChamaFilter): Promise<Chama[]> {
    try {
      const actor = await this.getChamaManagementActor();
      return await actor.getPublicChamas(filter ? [filter] : []);
    } catch (error) {
      console.error('Failed to get public chamas:', error);
      throw new Error('Failed to retrieve public chamas');
    }
  }

  // Search chamas
  async searchChamas(query: string): Promise<Chama[]> {
    try {
      const actor = await this.getChamaManagementActor();
      return await actor.searchChamas(query);
    } catch (error) {
      console.error('Chama search failed:', error);
      return [];
    }
  }

  // Get chama count
  async getChamaCount(): Promise<number> {
    try {
      const actor = await this.getChamaManagementActor();
      const result = await actor.getChamaCount();
      return Number(result);
    } catch (error) {
      console.error('Failed to get chama count:', error);
      return 0;
    }
  }

  // Health check
  async healthCheck(): Promise<string> {
    try {
      const actor = await this.getChamaManagementActor();
      return await actor.healthCheck();
    } catch (error) {
      console.error('Health check failed:', error);
      return 'Service unavailable';
    }
  }

  // Helper function to convert error codes to user-friendly messages
  private getErrorMessage(error: any): string {
    if (typeof error === 'object' && error !== null) {
      if ('NotFound' in error) return 'Chama not found';
      if ('AlreadyExists' in error) return 'Chama already exists';
      if ('NotAuthorized' in error) return 'Not authorized to perform this action';
      if ('InvalidData' in error) return 'Invalid data provided';
      if ('MaxMembersReached' in error) return 'Maximum members limit reached';
      if ('InsufficientFunds' in error) return 'Insufficient funds';
      if ('NotActive' in error) return 'Chama is not active';
    }
    return 'An unexpected error occurred';
  }
}

// Export singleton instance
export const chamaService = new ChamaService();
