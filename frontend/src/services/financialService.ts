// Comprehensive Financial Operations Service
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import {
  Transaction, 
  TransactionId, 
  TransactionType, 
  TransactionCategory,
  TransactionStatus,
  TransactionFilter,
  ChamaId, 
  UserId 
} from '../types/icp';
import { authService } from './auth';

// Financial Operations Actor Interface
export interface FinancialOperationsActor {
  recordContribution: (chamaId: string, amount: bigint, description: string) => Promise<{ ok: Transaction } | { err: any }>;
  processWithdrawal: (chamaId: string, amount: bigint, description: string) => Promise<{ ok: Transaction } | { err: any }>;
  recordLoan: (chamaId: string, borrower: Principal, amount: bigint, description: string) => Promise<{ ok: Transaction } | { err: any }>;
  recordRepayment: (chamaId: string, amount: bigint, description: string) => Promise<{ ok: Transaction } | { err: any }>;
  getTransaction: (transactionId: string) => Promise<[] | [Transaction]>;
  updateTransactionStatus: (transactionId: string, status: TransactionStatus) => Promise<{ ok: Transaction } | { err: any }>;
  getUserBalance: (chamaId: string, userId: Principal) => Promise<[bigint, bigint]>;
  getMyBalance: (chamaId: string) => Promise<[bigint, bigint]>;
  getChamaTreasuryBalance: (chamaId: string) => Promise<bigint>;
  getTransactionsByChama: (chamaId: string, limit: [] | [bigint]) => Promise<Transaction[]>;
  getMyTransactions: (limit: [] | [bigint]) => Promise<Transaction[]>;
  getTransactionsByUser: (userId: Principal, limit: [] | [bigint]) => Promise<Transaction[]>;
  getFilteredTransactions: (filter: TransactionFilter) => Promise<Transaction[]>;
  getChamaTransactionStats: (chamaId: string) => Promise<{
    totalTransactions: bigint;
    totalContributions: bigint;
    totalWithdrawals: bigint;
    totalLoans: bigint;
    averageTransaction: bigint;
    lastTransactionTime: [] | [bigint];
  }>;
  getTransactionCount: () => Promise<bigint>;
  healthCheck: () => Promise<string>;
}

// IDL Factory for Financial Operations
const financialOperationsIdlFactory = ({ IDL }: any) => {
  const UserId = IDL.Principal;
  const ChamaId = IDL.Text;
  const TransactionId = IDL.Text;

  const TransactionType = IDL.Variant({
    'contribution' : IDL.Null,
    'withdrawal' : IDL.Null,
    'loan' : IDL.Null,
    'repayment' : IDL.Null,
    'penalty' : IDL.Null,
    'dividend' : IDL.Null,
    'expense' : IDL.Null,
    'refund' : IDL.Null,
  });

  const TransactionCategory = IDL.Variant({
    'regularContribution' : IDL.Null,
    'catchUpContribution' : IDL.Null,
    'emergency' : IDL.Null,
    'investment' : IDL.Null,
    'loan' : IDL.Null,
    'administrative' : IDL.Null,
    'social' : IDL.Null,
  });

  const TransactionStatus = IDL.Variant({
    'pending' : IDL.Null,
    'completed' : IDL.Null,
    'failed' : IDL.Null,
    'cancelled' : IDL.Null,
    'disputed' : IDL.Null,
  });

  const TransactionMetadata = IDL.Record({
    'paymentMethod' : IDL.Opt(IDL.Text),
    'reference' : IDL.Opt(IDL.Text),
    'approvedBy' : IDL.Vec(UserId),
    'notes' : IDL.Opt(IDL.Text),
  });

  const Transaction = IDL.Record({
    'id' : TransactionId,
    'chamaId' : ChamaId,
    'userId' : UserId,
    'amount' : IDL.Nat,
    'transactionType' : TransactionType,
    'category' : TransactionCategory,
    'description' : IDL.Text,
    'timestamp' : IDL.Int,
    'processedBy' : IDL.Opt(UserId),
    'status' : TransactionStatus,
    'metadata' : TransactionMetadata,
  });

  const TransactionFilter = IDL.Record({
    'chamaId' : IDL.Opt(ChamaId),
    'userId' : IDL.Opt(UserId),
    'transactionType' : IDL.Opt(TransactionType),
    'dateRange' : IDL.Opt(IDL.Tuple(IDL.Int, IDL.Int)),
    'minAmount' : IDL.Opt(IDL.Nat),
    'maxAmount' : IDL.Opt(IDL.Nat),
    'status' : IDL.Opt(TransactionStatus),
  });

  const TransactionError = IDL.Variant({
    'NotFound' : IDL.Null,
    'InvalidAmount' : IDL.Null,
    'InsufficientFunds' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'DuplicateTransaction' : IDL.Null,
    'ProcessingFailed' : IDL.Null,
  });

  const TransactionResult = IDL.Variant({ 'ok' : Transaction, 'err' : TransactionError });

  const TransactionStats = IDL.Record({
    'totalTransactions' : IDL.Nat,
    'totalContributions' : IDL.Nat,
    'totalWithdrawals' : IDL.Nat,
    'totalLoans' : IDL.Nat,
    'averageTransaction' : IDL.Nat,
    'lastTransactionTime' : IDL.Opt(IDL.Int),
  });

  return IDL.Service({
    'recordContribution' : IDL.Func([ChamaId, IDL.Nat, IDL.Text], [TransactionResult], []),
    'processWithdrawal' : IDL.Func([ChamaId, IDL.Nat, IDL.Text], [TransactionResult], []),
    'recordLoan' : IDL.Func([ChamaId, UserId, IDL.Nat, IDL.Text], [TransactionResult], []),
    'recordRepayment' : IDL.Func([ChamaId, IDL.Nat, IDL.Text], [TransactionResult], []),
    'getTransaction' : IDL.Func([TransactionId], [IDL.Opt(Transaction)], ['query']),
    'updateTransactionStatus' : IDL.Func([TransactionId, TransactionStatus], [TransactionResult], []),
    'getUserBalance' : IDL.Func([ChamaId, UserId], [IDL.Tuple(IDL.Nat, IDL.Nat)], ['query']),
    'getMyBalance' : IDL.Func([ChamaId], [IDL.Tuple(IDL.Nat, IDL.Nat)], []),
    'getChamaTreasuryBalance' : IDL.Func([ChamaId], [IDL.Nat], ['query']),
    'getTransactionsByChama' : IDL.Func([ChamaId, IDL.Opt(IDL.Nat)], [IDL.Vec(Transaction)], ['query']),
    'getMyTransactions' : IDL.Func([IDL.Opt(IDL.Nat)], [IDL.Vec(Transaction)], []),
    'getTransactionsByUser' : IDL.Func([UserId, IDL.Opt(IDL.Nat)], [IDL.Vec(Transaction)], ['query']),
    'getFilteredTransactions' : IDL.Func([TransactionFilter], [IDL.Vec(Transaction)], ['query']),
    'getChamaTransactionStats' : IDL.Func([ChamaId], [TransactionStats], ['query']),
    'getTransactionCount' : IDL.Func([], [IDL.Nat], ['query']),
    'healthCheck' : IDL.Func([], [IDL.Text], ['query']),
  });
};

class FinancialService {
  private financialOperationsActor: FinancialOperationsActor | null = null;

  // Get Financial Operations Actor
  private async getFinancialOperationsActor(): Promise<FinancialOperationsActor> {
    if (!this.financialOperationsActor) {
      const agent = await authService.getAgent();
      const canisterId = process.env.REACT_APP_FINANCIAL_OPERATIONS_CANISTER_ID || 'rdmx6-jaaaa-aaaaa-aaadq-cai';
      
      this.financialOperationsActor = Actor.createActor(financialOperationsIdlFactory, {
        agent,
        canisterId,
      }) as FinancialOperationsActor;
    }
    return this.financialOperationsActor;
  }

  // Reset actor (for logout)
  resetActor() {
    this.financialOperationsActor = null;
  }

  // Record contribution
  async recordContribution(chamaId: ChamaId, amount: number, description: string): Promise<Transaction | null> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const result = await actor.recordContribution(chamaId, BigInt(amount), description);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Contribution recording failed:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Contribution recording error:', error);
      throw error;
    }
  }

  // Process withdrawal
  async processWithdrawal(chamaId: ChamaId, amount: number, description: string): Promise<Transaction | null> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const result = await actor.processWithdrawal(chamaId, BigInt(amount), description);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Withdrawal processing failed:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Withdrawal processing error:', error);
      throw error;
    }
  }

  // Record loan
  async recordLoan(chamaId: ChamaId, borrower: Principal, amount: number, description: string): Promise<Transaction | null> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const result = await actor.recordLoan(chamaId, borrower, BigInt(amount), description);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Loan recording failed:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Loan recording error:', error);
      throw error;
    }
  }

  // Record repayment
  async recordRepayment(chamaId: ChamaId, amount: number, description: string): Promise<Transaction | null> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const result = await actor.recordRepayment(chamaId, BigInt(amount), description);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Repayment recording failed:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Repayment recording error:', error);
      throw error;
    }
  }

  // Get transaction by ID
  async getTransactionById(transactionId: TransactionId): Promise<Transaction | null> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const result = await actor.getTransaction(transactionId);
      
      return result.length > 0 && result[0] !== undefined ? result[0] : null;
    } catch (error) {
      console.error('Failed to get transaction by ID:', error);
      return null;
    }
  }

  // Update transaction status
  async updateTransactionStatus(transactionId: TransactionId, status: TransactionStatus): Promise<Transaction | null> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const result = await actor.updateTransactionStatus(transactionId, status);
      
      if ('ok' in result) {
        return result.ok;
      } else {
        console.error('Transaction status update failed:', result.err);
        throw new Error(this.getErrorMessage(result.err));
      }
    } catch (error) {
      console.error('Transaction status update error:', error);
      throw error;
    }
  }

  // Get user balance
  async getUserBalance(chamaId: ChamaId, userId: Principal): Promise<{ contributions: number; withdrawals: number }> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const [contributions, withdrawals] = await actor.getUserBalance(chamaId, userId);
      
      return {
        contributions: Number(contributions),
        withdrawals: Number(withdrawals),
      };
    } catch (error) {
      console.error('Failed to get user balance:', error);
      return { contributions: 0, withdrawals: 0 };
    }
  }

  // Get my balance
  async getMyBalance(chamaId: ChamaId): Promise<{ contributions: number; withdrawals: number }> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const [contributions, withdrawals] = await actor.getMyBalance(chamaId);
      
      return {
        contributions: Number(contributions),
        withdrawals: Number(withdrawals),
      };
    } catch (error) {
      console.error('Failed to get my balance:', error);
      return { contributions: 0, withdrawals: 0 };
    }
  }

  // Get chama treasury balance
  async getChamaTreasuryBalance(chamaId: ChamaId): Promise<number> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const balance = await actor.getChamaTreasuryBalance(chamaId);
      
      return Number(balance);
    } catch (error) {
      console.error('Failed to get chama treasury balance:', error);
      return 0;
    }
  }

  // Get transactions by chama
  async getTransactionsByChama(chamaId: ChamaId, limit?: number): Promise<Transaction[]> {
    try {
      const actor = await this.getFinancialOperationsActor();
      return await actor.getTransactionsByChama(chamaId, limit ? [BigInt(limit)] : []);
    } catch (error) {
      console.error('Failed to get transactions by chama:', error);
      return [];
    }
  }

  // Get my transactions
  async getMyTransactions(limit?: number): Promise<Transaction[]> {
    try {
      const actor = await this.getFinancialOperationsActor();
      return await actor.getMyTransactions(limit ? [BigInt(limit)] : []);
    } catch (error) {
      console.error('Failed to get my transactions:', error);
      return [];
    }
  }

  // Get transactions by user
  async getTransactionsByUser(userId: Principal, limit?: number): Promise<Transaction[]> {
    try {
      const actor = await this.getFinancialOperationsActor();
      return await actor.getTransactionsByUser(userId, limit ? [BigInt(limit)] : []);
    } catch (error) {
      console.error('Failed to get transactions by user:', error);
      return [];
    }
  }

  // Get filtered transactions
  async getFilteredTransactions(filter: TransactionFilter): Promise<Transaction[]> {
    try {
      const actor = await this.getFinancialOperationsActor();
      return await actor.getFilteredTransactions(filter);
    } catch (error) {
      console.error('Failed to get filtered transactions:', error);
      return [];
    }
  }

  // Get chama transaction statistics
  async getChamaTransactionStats(chamaId: ChamaId): Promise<{
    totalTransactions: number;
    totalContributions: number;
    totalWithdrawals: number;
    totalLoans: number;
    averageTransaction: number;
    lastTransactionTime?: Date;
  }> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const stats = await actor.getChamaTransactionStats(chamaId);
      
      return {
        totalTransactions: Number(stats.totalTransactions),
        totalContributions: Number(stats.totalContributions),
        totalWithdrawals: Number(stats.totalWithdrawals),
        totalLoans: Number(stats.totalLoans),
        averageTransaction: Number(stats.averageTransaction),
        lastTransactionTime: stats.lastTransactionTime.length > 0 
          ? new Date(Number(stats.lastTransactionTime[0]) / 1000000) 
          : undefined,
      };
    } catch (error) {
      console.error('Failed to get chama transaction stats:', error);
      return {
        totalTransactions: 0,
        totalContributions: 0,
        totalWithdrawals: 0,
        totalLoans: 0,
        averageTransaction: 0,
      };
    }
  }

  // Get transaction count
  async getTransactionCount(): Promise<number> {
    try {
      const actor = await this.getFinancialOperationsActor();
      const result = await actor.getTransactionCount();
      return Number(result);
    } catch (error) {
      console.error('Failed to get transaction count:', error);
      return 0;
    }
  }

  // Health check
  async healthCheck(): Promise<string> {
    try {
      const actor = await this.getFinancialOperationsActor();
      return await actor.healthCheck();
    } catch (error) {
      console.error('Health check failed:', error);
      return 'Service unavailable';
    }
  }

  // Helper function to convert error codes to user-friendly messages
  private getErrorMessage(error: any): string {
    if (typeof error === 'object' && error !== null) {
      if ('NotFound' in error) return 'Transaction not found';
      if ('InvalidAmount' in error) return 'Invalid amount specified';
      if ('InsufficientFunds' in error) return 'Insufficient funds';
      if ('NotAuthorized' in error) return 'Not authorized to perform this action';
      if ('DuplicateTransaction' in error) return 'Duplicate transaction detected';
      if ('ProcessingFailed' in error) return 'Transaction processing failed';
    }
    return 'An unexpected error occurred';
  }
}

// Export singleton instance
export const financialService = new FinancialService();
