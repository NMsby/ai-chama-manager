// Comprehensive Data Models for AI-Powered Chama Manager
import Time "mo:base/Time";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

module {
  // Basic types
  public type UserId = Principal;
  public type ChamaId = Text;
  public type TransactionId = Text;
  public type ProposalId = Text;
  public type MeetingId = Text;
  public type LoanId = Text;

  // User related types
  public type User = {
    id: UserId;
    name: Text;
    email: Text;
    phone: Text;
    nationalId: ?Text;
    profileImage: ?Text;
    createdAt: Time.Time;
    updatedAt: Time.Time;
    isVerified: Bool;
    verificationLevel: VerificationLevel;
    creditScore: Float;
    totalContributions: Nat;
    totalWithdrawals: Nat;
    chamasJoined: [ChamaId];
    chamasCreated: [ChamaId];
  };

  public type VerificationLevel = {
    #basic;      // Email/Phone verified
    #intermediate; // ID document verified
    #advanced;   // Full KYC completed
  };

  public type UserStats = {
    userId: UserId;
    totalSavings: Nat;
    averageContribution: Nat;
    contributionStreak: Nat;
    riskScore: Float;
    reliabilityScore: Float;
    lastActivity: Time.Time;
  };

  // Chama related types
  public type Chama = {
    id: ChamaId;
    name: Text;
    description: Text;
    creator: UserId;
    admins: [UserId];
    members: [ChamaMember];
    joinRequests: [JoinRequest];
    maxMembers: Nat;
    contributionAmount: Nat;
    contributionFrequency: ContributionFrequency;
    meetingFrequency: MeetingFrequency;
    chamaType: ChamaType;
    rules: ChamaRules;
    treasury: Treasury;
    createdAt: Time.Time;
    updatedAt: Time.Time;
    isActive: Bool;
    status: ChamaStatus;
    settings: ChamaSettings;
  };

  public type ChamaMember = {
    userId: UserId;
    joinedAt: Time.Time;
    role: MemberRole;
    status: MemberStatus;
    contributionBalance: Nat;
    loanBalance: Nat;
    lastContribution: ?Time.Time;
    missedContributions: Nat;
  };

  public type MemberRole = {
    #owner;
    #admin;
    #treasurer;
    #secretary;
    #member;
  };

  public type MemberStatus = {
    #active;        // Currently active member
    #suspended;     // Temporarily suspended
    #inactive;      // No contributions for a long time
    #expelled;      // Removed from the chama
    #pending;       // New members awaiting approval
    #rejected;      // Rejected membership requests
  };

  // Join request type
  public type JoinRequest = {
      userId: UserId;
      chamaId: ChamaId;
      requestedAt: Time.Time;
      message: ?Text;
      status: JoinRequestStatus;
  };

  // Join request status
  public type JoinRequestStatus = {
      #pending;
      #approved;
      #rejected;
  };

  // Join request result
  public type JoinRequestResult = Result.Result<JoinRequest, ChamaError>;

  public type ContributionFrequency = {
    #daily;
    #weekly;
    #biweekly;
    #monthly;
    #quarterly;
  };

  public type MeetingFrequency = {
    #weekly;
    #biweekly;
    #monthly;
    #quarterly;
  };

  public type ChamaType = {
    #savings;        // Pure savings group
    #investment;     // Investment focused
    #microCredit;    // Lending focused
    #welfare;        // Social support
    #business;       // Business venture
  };

  public type ChamaStatus = {
    #forming;        // Still recruiting members
    #active;         // Operational
    #suspended;      // Temporarily inactive
    #dissolved;      // Permanently closed
  };

  public type ChamaRules = {
    minimumContribution: Nat;
    latePenalty: Nat;
    withdrawalNotice: Nat; // Days
    quorumPercentage: Nat; // For voting
    loanInterestRate: Float;
    maxLoanAmount: Nat;
    loanRepaymentPeriod: Nat; // Months
  };

  public type Treasury = {
    totalFunds: Nat;
    availableFunds: Nat;
    reserveFunds: Nat;
    loansFunds: Nat;
    emergencyFunds: Nat;
    lastUpdated: Time.Time;
  };

  public type ChamaSettings = {
    isPublic: Bool;
    allowExternalLoans: Bool;
    requireApprovalForJoining: Bool;
    enableAIRecommendations: Bool;
    notificationPreferences: NotificationSettings;
  };

  public type NotificationSettings = {
    contributionReminders: Bool;
    meetingNotifications: Bool;
    proposalAlerts: Bool;
    loanReminders: Bool;
    aiInsights: Bool;
  };

  // Financial types
  public type Transaction = {
    id: TransactionId;
    chamaId: ChamaId;
    userId: UserId;
    amount: Nat;
    transactionType: TransactionType;
    category: TransactionCategory;
    description: Text;
    timestamp: Time.Time;
    processedBy: ?UserId;
    status: TransactionStatus;
    metadata: TransactionMetadata;
  };

  public type TransactionType = {
    #contribution;
    #withdrawal;
    #loan;
    #repayment;
    #penalty;
    #dividend;
    #expense;
    #refund;
  };

  public type TransactionCategory = {
    #regularContribution;
    #catchUpContribution;
    #emergency;
    #investment;
    #loan;
    #administrative;
    #social;
  };

  public type TransactionStatus = {
    #pending;
    #completed;
    #failed;
    #cancelled;
    #disputed;
  };

  public type TransactionMetadata = {
    paymentMethod: ?Text;
    reference: ?Text;
    approvedBy: ?[UserId];
    notes: ?Text;
  };

  // Loan types
  public type Loan = {
    id: LoanId;
    chamaId: ChamaId;
    borrower: UserId;
    amount: Nat;
    interestRate: Float;
    repaymentPeriod: Nat; // Months
    purpose: Text;
    guarantors: [UserId];
    collateral: ?Text;
    status: LoanStatus;
    createdAt: Time.Time;
    approvedAt: ?Time.Time;
    disbursedAt: ?Time.Time;
    dueDate: Time.Time;
    repayments: [LoanRepayment];
    totalRepaid: Nat;
    outstandingBalance: Nat;
  };

  public type LoanStatus = {
    #applied;
    #underReview;
    #approved;
    #rejected;
    #disbursed;
    #repaying;
    #completed;
    #defaulted;
  };

  public type LoanRepayment = {
    amount: Nat;
    paymentDate: Time.Time;
    lateFee: Nat;
    principalAmount: Nat;
    interestAmount: Nat;
  };

  // AI related types
  public type PredictionResult = {
    probability: Float;
    confidence: Float;
    suggestedAmount: Nat;
    riskLevel: RiskLevel;
    factors: [PredictionFactor];
    timestamp: Time.Time;
  };

  public type PredictionFactor = {
    factor: Text;
    weight: Float;
    impact: Text;
  };

  public type RiskLevel = {
    #veryLow;
    #low;
    #medium;
    #high;
    #veryHigh;
  };

  public type RiskAssessment = {
    userId: UserId;
    chamaId: ?ChamaId;
    overallRisk: RiskLevel;
    creditRisk: Float;
    liquidityRisk: Float;
    behaviorRisk: Float;
    assessmentDate: Time.Time;
    recommendations: [Text];
  };

  public type AIInsight = {
    type_: InsightType;
    severity: InsightSeverity;
    title: Text;
    description: Text;
    recommendation: Text;
    affectedUsers: [UserId];
    chamaId: ?ChamaId;
    createdAt: Time.Time;
    isActionable: Bool;
  };

  public type InsightType = {
    #contributionPattern;
    #riskAlert;
    #optimization;
    #anomaly;
    #opportunity;
  };

  public type InsightSeverity = {
    #info;
    #warning;
    #critical;
  };

  // Governance types
  public type Proposal = {
    id: ProposalId;
    chamaId: ChamaId;
    proposer: UserId;
    title: Text;
    description: Text;
    proposalType: ProposalType;
    targetAmount: ?Nat;
    targetUser: ?UserId;
    details: ProposalDetails;
    createdAt: Time.Time;
    votingStartsAt: Time.Time;
    votingEndsAt: Time.Time;
    executionDate: ?Time.Time;
    status: ProposalStatus;
    votes: [Vote];
    quorumRequired: Nat;
    passThreshold: Nat; // Percentage
  };

  public type ProposalType = {
    #withdrawal;
    #loan;
    #ruleChange;
    #memberRemoval;
    #memberPromotion;
    #emergencyFund;
    #investment;
    #dissolution;
    #other;
  };

  public type ProposalDetails = {
    changes: ?Text;
    justification: Text;
    expectedOutcome: Text;
    risks: ?Text;
    timeline: ?Text;
  };

  public type ProposalStatus = {
    #draft;
    #active;
    #passed;
    #rejected;
    #expired;
    #executed;
    #cancelled;
  };

  public type Vote = {
    id: Text;
    proposalId: ProposalId;
    voter: UserId;
    vote: VoteChoice;
    timestamp: Time.Time;
    comment: ?Text;
    weight: Nat; // Voting weight based on stake
  };

  public type VoteChoice = {
    #yes;
    #no;
    #abstain;
  };

  // Meeting types
  public type Meeting = {
    id: MeetingId;
    chamaId: ChamaId;
    title: Text;
    description: Text;
    scheduledAt: Time.Time;
    duration: Nat; // Minutes
    location: MeetingLocation;
    organizer: UserId;
    attendees: [MeetingAttendee];
    agenda: [AgendaItem];
    minutes: ?MeetingMinutes;
    status: MeetingStatus;
    createdAt: Time.Time;
  };

  public type MeetingLocation = {
    #physical: { address: Text; coordinates: ?Text };
    #virtual: { platform: Text; link: Text };
    #hybrid: { address: Text; virtualLink: Text };
  };

  public type MeetingAttendee = {
    userId: UserId;
    status: AttendanceStatus;
    joinedAt: ?Time.Time;
    leftAt: ?Time.Time;
  };

  public type AttendanceStatus = {
    #invited;
    #confirmed;
    #attended;
    #absent;
    #late;
  };

  public type AgendaItem = {
    id: Text;
    title: Text;
    description: Text;
    duration: Nat; // Minutes
    presenter: UserId;
    attachments: ?[Text];
  };

  public type MeetingMinutes = {
    summary: Text;
    decisions: [Text];
    actionItems: [ActionItem];
    nextMeetingDate: ?Time.Time;
    recordedBy: UserId;
  };

  public type ActionItem = {
    id: Text;
    description: Text;
    assignedTo: UserId;
    dueDate: Time.Time;
    status: ActionStatus;
  };

  public type ActionStatus = {
    #pending;
    #inProgress;
    #completed;
    #overdue;
  };

  public type MeetingStatus = {
    #scheduled;
    #ongoing;
    #completed;
    #cancelled;
    #postponed;
  };

  // Notification types
  public type Notification = {
    id: Text;
    userId: UserId;
    type_: NotificationType;
    title: Text;
    message: Text;
    data: ?Text; // JSON string for additional data
    createdAt: Time.Time;
    readAt: ?Time.Time;
    isRead: Bool;
    priority: NotificationPriority;
  };

  public type NotificationType = {
    #contribution;
    #meeting;
    #proposal;
    #loan;
    #ai_insight;
    #system_;
    #social;
  };

  public type NotificationPriority = {
    #low;
    #medium;
    #high;
    #urgent;
  };

  // Result types for API responses
  public type UserResult = Result.Result<User, UserError>;
  public type ChamaResult = Result.Result<Chama, ChamaError>;
  public type TransactionResult = Result.Result<Transaction, TransactionError>;
  public type LoanResult = Result.Result<Loan, LoanError>;
  public type ProposalResult = Result.Result<Proposal, ProposalError>;
  public type MeetingResult = Result.Result<Meeting, MeetingError>;

  // Error types
  public type UserError = {
    #NotFound;
    #AlreadyExists;
    #NotAuthorized;
    #InvalidData;
    #VerificationRequired;
  };

  public type ChamaError = {
    #NotFound;
    #AlreadyExists;
    #NotAuthorized;
    #InvalidData;
    #InvalidName;
    #InvalidDescription;
    #InvalidContributionAmount;
    #InvalidMaxMembers;
    #MaxMembersReached;
    #InsufficientFunds;
    #NotActive;
    #PrivateChama;                // Private chama access
    #ApprovalRequired;            // Approval needed to join
    #AlreadyRequested;            // Join request already exists
  };

  public type TransactionError = {
    #NotFound;
    #InvalidAmount;
    #InsufficientFunds;
    #NotAuthorized;
    #DuplicateTransaction;
    #ProcessingFailed;
  };

  public type LoanError = {
    #NotFound;
    #NotEligible;
    #InsufficientCollateral;
    #ExceedsLimit;
    #NotAuthorized;
    #InvalidTerms;
  };

  public type ProposalError = {
    #NotFound;
    #NotAuthorized;
    #InvalidProposal;
    #VotingClosed;
    #AlreadyVoted;
    #QuorumNotMet;
  };

  public type MeetingError = {
    #NotFound;
    #NotAuthorized;
    #InvalidDateTime;
    #ConflictingSchedule;
    #MaxAttendeesReached;
  };

  // Search and filter types
  public type UserFilter = {
    isVerified: ?Bool;
    verificationLevel: ?VerificationLevel;
    minCreditScore: ?Float;
    chamaId: ?ChamaId;
  };

  public type ContributionRange = {
    min: Nat;
    max: Nat;
  };

  public type ChamaFilter = {
    chamaType: ?ChamaType;
    status: ?ChamaStatus;
    isPublic: ?Bool;
    minMembers: ?Nat;
    maxMembers: ?Nat;
    contributionRange: ?ContributionRange;
  };

  public type TransactionFilter = {
    chamaId: ?ChamaId;
    userId: ?UserId;
    transactionType: ?TransactionType;
    dateRange: ?(Time.Time, Time.Time);
    minAmount: ?Nat;
    maxAmount: ?Nat;
    status: ?TransactionStatus;
  };
}
