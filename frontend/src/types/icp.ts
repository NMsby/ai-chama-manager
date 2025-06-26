// ICP and Canister related types

import { Principal } from '@dfinity/principal';

export type UserId = Principal;
export type ChamaId = string;
export type TransactionId = string;
export type ProposalId = string;

// Verification levels
export type VerificationLevel = 'basic' | 'intermediate' | 'advanced';

export interface User {
  id: UserId;
  name: string;
  email: string;
  phone: string;
  nationalId?: string;
  profileImage?: string;
  createdAt: bigint;
  updatedAt: bigint;
  isVerified: boolean;
  verificationLevel: VerificationLevel;
  creditScore: number;
  totalContributions: bigint;
  totalWithdrawals: bigint;
  chamasJoined: string[];
  chamasCreated: string[];
}

export interface UserStats {
  userId: UserId;
  totalSavings: bigint;
  averageContribution: bigint;
  contributionStreak: number;
  riskScore: number;
  reliabilityScore: number;
  lastActivity: bigint;
}

export interface UserFilter {
  isVerified?: boolean;
  verificationLevel?: VerificationLevel;
  minCreditScore?: number;
  chamaId?: string;
}

export type ContributionFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
export type MeetingFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';
export type ChamaType = 'savings' | 'investment' | 'microCredit' | 'welfare' | 'business';
export type ChamaStatus = 'forming' | 'active' | 'suspended' | 'dissolved';
export type MemberRole = 'owner' | 'admin' | 'treasurer' | 'secretary' | 'member';
export type MemberStatus = 'active' | 'suspended' | 'inactive' | 'expelled';

export interface ChamaMember {
  userId: UserId;
  joinedAt: bigint;
  role: MemberRole;
  status: MemberStatus;
  contributionBalance: bigint;
  loanBalance: bigint;
  lastContribution?: bigint;
  missedContributions: bigint;
}

export interface ChamaRules {
  minimumContribution: bigint;
  latePenalty: bigint;
  withdrawalNotice: bigint;
  quorumPercentage: bigint;
  loanInterestRate: number;
  maxLoanAmount: bigint;
  loanRepaymentPeriod: bigint;
}

export interface Treasury {
  totalFunds: bigint;
  availableFunds: bigint;
  reserveFunds: bigint;
  loansFunds: bigint;
  emergencyFunds: bigint;
  lastUpdated: bigint;
}

export interface NotificationSettings {
  contributionReminders: boolean;
  meetingNotifications: boolean;
  proposalAlerts: boolean;
  loanReminders: boolean;
  aiInsights: boolean;
}

export interface ChamaSettings {
  isPublic: boolean;
  allowExternalLoans: boolean;
  requireApprovalForJoining: boolean;
  enableAIRecommendations: boolean;
  notificationPreferences: NotificationSettings;
}

export interface Chama {
  id: ChamaId;
  name: string;
  description: string;
  creator: UserId;
  admins: UserId[];
  members: ChamaMember[];
  maxMembers: bigint;
  contributionAmount: bigint;
  contributionFrequency: ContributionFrequency;
  meetingFrequency: MeetingFrequency;
  chamaType: ChamaType;
  rules: ChamaRules;
  treasury: Treasury;
  createdAt: bigint;
  updatedAt: bigint;
  isActive: boolean;
  status: ChamaStatus;
  settings: ChamaSettings;
}

export type TransactionType = 'contribution' | 'withdrawal' | 'loan' | 'repayment' | 'penalty' | 'dividend' | 'expense' | 'refund';
export type TransactionCategory = 'regularContribution' | 'catchUpContribution' | 'emergency' | 'investment' | 'loan' | 'administrative' | 'social';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'disputed';

export interface TransactionMetadata {
  paymentMethod?: string;
  reference?: string;
  approvedBy: UserId[];
  notes?: string;
}

export interface Transaction {
  id: TransactionId;
  chamaId: ChamaId;
  userId: UserId;
  amount: bigint;
  transactionType: TransactionType;
  category: TransactionCategory;
  description: string;
  timestamp: bigint;
  processedBy: UserId;
  status: TransactionStatus;
  metadata?: TransactionMetadata;
}

export type RiskLevel = 'veryLow' | 'low' | 'medium' | 'high' | 'veryHigh';

export interface PredictionFactor {
  factor: string;
  weight: number;
  impact: string;
}

export interface PredictionResult {
  probability: number;
  confidence: number;
  suggestedAmount: bigint;
  riskLevel: RiskLevel;
  factors: PredictionFactor[];
  timestamp: bigint;
}

export type ProposalType = 'withdrawal' | 'loan' | 'ruleChange' | 'memberRemoval' | 'memberPromotion' | 'emergencyFund' | 'investment' | 'dissolution' | 'other';
export type ProposalStatus = 'draft' | 'active' | 'passed' | 'rejected' | 'expired' | 'executed' | 'cancelled';
export type VoteChoice = 'yes' | 'no' | 'abstain';

export interface Proposal {
  id: ProposalId;
  chamaId: ChamaId;
  proposer: UserId;
  title: string;
  description: string;
  proposalType: ProposalType;
  createdAt: bigint;
  expiresAt: bigint;
  status: ProposalStatus;
}

export interface Vote {
  proposalId: ProposalId;
  voter: UserId;
  vote: VoteChoice;
  timestamp: bigint;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Authentication types
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  principal: Principal | null;
}

// Filter types
export interface ChamaFilter {
  chamaType?: ChamaType;
  status?: ChamaStatus;
  isPublic?: boolean;
  minMembers?: number;
  maxMembers?: number;
  contributionRange?: [number, number];
}

export interface TransactionFilter {
  chamaId?: ChamaId;
  userId?: UserId;
  transactionType?: TransactionType;
  dateRange?: [bigint, bigint];
  minAmount?: bigint;
  maxAmount?: bigint;
  status?: TransactionStatus;
}
