// ICP and Canister related types

import { Principal } from '@dfinity/principal';

export type UserId = Principal;
export type ChamaId = string;
export type TransactionId = string;
export type ProposalId = string;

export interface User {
  id: UserId;
  name: string;
  email: string;
  phone: string;
  createdAt: bigint;
  isVerified: boolean;
}

export interface Chama {
  id: ChamaId;
  name: string;
  description: string;
  creator: UserId;
  members: UserId[];
  contributionAmount: bigint;
  contributionFrequency: ContributionFrequency;
  createdAt: bigint;
  isActive: boolean;
}

export type ContributionFrequency = 'weekly' | 'biweekly' | 'monthly';

export interface Transaction {
  id: TransactionId;
  chamaId: ChamaId;
  userId: UserId;
  amount: bigint;
  transactionType: TransactionType;
  timestamp: bigint;
  description: string;
}

export type TransactionType = 'contribution' | 'withdrawal' | 'loan' | 'repayment';

export interface PredictionResult {
  probability: number;
  confidence: number;
  suggestedAmount: bigint;
  riskLevel: RiskLevel;
}

export type RiskLevel = 'low' | 'medium' | 'high';

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

export type ProposalType = 'withdrawal' | 'ruleChange' | 'memberRemoval' | 'other';
export type ProposalStatus = 'active' | 'passed' | 'rejected' | 'expired';

export interface Vote {
  proposalId: ProposalId;
  voter: UserId;
  vote: VoteChoice;
  timestamp: bigint;
}

export type VoteChoice = 'yes' | 'no' | 'abstain';

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
