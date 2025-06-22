// Enhanced Financial Operations Canister with Data Models
import Types "../shared/types";
import FinanceDB "../financial_operations/finance";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

actor FinancialOperations {
  public type Transaction = Types.Transaction;
  public type TransactionId = Types.TransactionId;
  public type TransactionResult = Types.TransactionResult;
  public type TransactionFilter = Types.TransactionFilter;

  private let financeDB = FinanceDB.FinanceDB();

  // Record contribution
  public shared(msg) func recordContribution(
    chamaId: Types.ChamaId,
    amount: Nat,
    description: Text
  ) : async TransactionResult {
    let caller = msg.caller;
    Debug.print("Recording contribution for: " # Principal.toText(caller));
    financeDB.createTransaction(
      chamaId,
      caller,
      amount,
      #contribution,
      #regularContribution,
      description,
      null
    )
  };

  // Process withdrawal
  public shared(msg) func processWithdrawal(
    chamaId: Types.ChamaId,
    amount: Nat,
    description: Text
  ) : async TransactionResult {
    let caller = msg.caller;
    Debug.print("Processing withdrawal for: " # Principal.toText(caller));
    financeDB.createTransaction(
      chamaId,
      caller,
      amount,
      #withdrawal,
      #emergency,
      description,
      null
    )
  };

  // Record loan disbursement
  public shared(msg) func recordLoan(
    chamaId: Types.ChamaId,
    borrower: Types.UserId,
    amount: Nat,
    description: Text
  ) : async TransactionResult {
    let caller = msg.caller;
    Debug.print("Recording loan disbursement");
    financeDB.createTransaction(
      chamaId,
      borrower,
      amount,
      #loan,
      #loan,
      description,
      ?caller
    )
  };

  // Record loan repayment
  public shared(msg) func recordRepayment(
    chamaId: Types.ChamaId,
    amount: Nat,
    description: Text
  ) : async TransactionResult {
    let caller = msg.caller;
    Debug.print("Recording loan repayment");
    financeDB.createTransaction(
      chamaId,
      caller,
      amount,
      #repayment,
      #loan,
      description,
      null
    )
  };

  // Get transaction by ID
  public query func getTransaction(transactionId: TransactionId) : async ?Transaction {
    financeDB.getTransaction(transactionId)
  };

  // Update transaction status (admin only)
  public shared(msg) func updateTransactionStatus(
    transactionId: TransactionId,
    status: Types.TransactionStatus
  ) : async TransactionResult {
    let caller = msg.caller;
    financeDB.updateTransactionStatus(transactionId, status, ?caller)
  };

  // Get user balance in a chama
  public query func getUserBalance(chamaId: Types.ChamaId, userId: Types.UserId) : async (Nat, Nat) {
    financeDB.getUserBalance(chamaId, userId)
  };

  // Get my balance in a chama
  public shared(msg) func getMyBalance(chamaId: Types.ChamaId) : async (Nat, Nat) {
    let caller = msg.caller;
    financeDB.getUserBalance(chamaId, caller)
  };

  // Get chama treasury balance
  public query func getChamaTreasuryBalance(chamaId: Types.ChamaId) : async Nat {
    financeDB.getChamaTreasuryBalance(chamaId)
  };

  // Get transactions by chama
  public query func getTransactionsByChama(chamaId: Types.ChamaId, limit: ?Nat) : async [Transaction] {
    financeDB.getTransactionsByChama(chamaId, limit)
  };

  // Get my transactions
  public shared(msg) func getMyTransactions(limit: ?Nat) : async [Transaction] {
    let caller = msg.caller;
    financeDB.getTransactionsByUser(caller, limit)
  };

  // Get transactions by user
  public query func getTransactionsByUser(userId: Types.UserId, limit: ?Nat) : async [Transaction] {
    financeDB.getTransactionsByUser(userId, limit)
  };

  // Get filtered transactions
  public query func getFilteredTransactions(filter: TransactionFilter) : async [Transaction] {
    financeDB.getFilteredTransactions(filter)
  };

  // Get chama transaction statistics
  public query func getChamaTransactionStats(chamaId: Types.ChamaId) : async {
    totalTransactions: Nat;
    totalContributions: Nat;
    totalWithdrawals: Nat;
    totalLoans: Nat;
    averageTransaction: Nat;
    lastTransactionTime: ?Int;
  } {
    financeDB.getChamaTransactionStats(chamaId)
  };

  // Get transaction count
  public query func getTransactionCount() : async Nat {
    financeDB.getTransactionCount()
  };

  // Health check
  public query func healthCheck() : async Text {
    "Financial Operations Canister with enhanced data models is running successfully! Transactions: " # Nat.toText(financeDB.getTransactionCount())
  };
}
