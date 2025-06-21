// Shared types for AI-Powered Chama Manager

import Time "mo:base/Time";
import Principal "mo:base/Principal";

module {
  // User related types
  public type UserId = Principal;
  
  public type User = {
    id: UserId;
    name: Text;
    email: Text;
    phone: Text;
    createdAt: Time.Time;
    isVerified: Bool;
  };

  // Chama related types
  public type ChamaId = Text;
  
  public type Chama = {
    id: ChamaId;
    name: Text;
    description: Text;
    creator: UserId;
    members: [UserId];
    contributionAmount: Nat;
    contributionFrequency: ContributionFrequency;
    createdAt: Time.Time;
    isActive: Bool;
  };

  public type ContributionFrequency = {
    #weekly;
    #biweekly;
    #monthly;
  };

  // Financial types
  public type TransactionId = Text;
  
  public type Transaction = {
    id: TransactionId;
    chamaId: ChamaId;
    userId: UserId;
    amount: Nat;
    transactionType: TransactionType;
    timestamp: Time.Time;
    description: Text;
  };

  public type TransactionType = {
    #contribution;
    #withdrawal;
    #loan;
    #repayment;
  };

  // AI related types
  public type PredictionResult = {
    probability: Float;
    confidence: Float;
    suggestedAmount: Nat;
    riskLevel: RiskLevel;
  };

  public type RiskLevel = {
    #low;
    #medium;
    #high;
  };

  // Governance types
  public type ProposalId = Text;
  
  public type Proposal = {
    id: ProposalId;
    chamaId: ChamaId;
    proposer: UserId;
    title: Text;
    description: Text;
    proposalType: ProposalType;
    createdAt: Time.Time;
    expiresAt: Time.Time;
    status: ProposalStatus;
  };

  public type ProposalType = {
    #withdrawal;
    #ruleChange;
    #memberRemoval;
    #other;
  };

  public type ProposalStatus = {
    #active;
    #passed;
    #rejected;
    #expired;
  };

  public type Vote = {
    proposalId: ProposalId;
    voter: UserId;
    vote: VoteChoice;
    timestamp: Time.Time;
  };

  public type VoteChoice = {
    #yes;
    #no;
    #abstain;
  };
}
