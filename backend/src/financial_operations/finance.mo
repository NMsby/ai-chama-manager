// Financial Operations Data Layer
import Types "../shared/types";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Int "mo:base/Int";

module {
  public type Transaction = Types.Transaction;
  public type TransactionId = Types.TransactionId;
  public type TransactionResult = Types.TransactionResult;
  public type TransactionError = Types.TransactionError;
  public type TransactionFilter = Types.TransactionFilter;
  public type UserId = Types.UserId;
  public type ChamaId = Types.ChamaId;

  public class FinanceDB() {
    // Primary transaction storage
    private var transactions = HashMap.HashMap<TransactionId, Transaction>(0, Text.equal, Text.hash);
    
    // Secondary indices for efficient queries
    private var transactionsByChama = HashMap.HashMap<ChamaId, [TransactionId]>(0, Text.equal, Text.hash);
    private var transactionsByUser = HashMap.HashMap<UserId, [TransactionId]>(0, Principal.equal, Principal.hash);
    private var transactionsByType = HashMap.HashMap<Types.TransactionType, [TransactionId]>(0, func(a, b) { a == b }, func(a) { 0 });
    
    private var transactionCounter: Nat = 0;

    // Generate unique transaction ID
    private func generateTransactionId() : TransactionId {
      transactionCounter += 1;
      "txn_" # Nat.toText(transactionCounter) # "_" # Int.toText(Time.now())
    };

    // Create new transaction
    public func createTransaction(
      chamaId: ChamaId,
      userId: UserId,
      amount: Nat,
      transactionType: Types.TransactionType,
      category: Types.TransactionCategory,
      description: Text,
      processedBy: ?UserId
    ) : TransactionResult {
      Debug.print("Creating transaction for user: " # Principal.toText(userId));

      let transactionId = generateTransactionId();
      let now = Time.now();

      let newTransaction: Transaction = {
        id = transactionId;
        chamaId = chamaId;
        userId = userId;
        amount = amount;
        transactionType = transactionType;
        category = category;
        description = description;
        timestamp = now;
        processedBy = processedBy;
        status = #pending;
        metadata = {
          paymentMethod = null;
          reference = null;
          approvedBy = ?[];
          notes = null;
        };
      };

      // Store transaction
      transactions.put(transactionId, newTransaction);
      
      // Update indices
      updateChamaIndex(chamaId, transactionId);
      updateUserIndex(userId, transactionId);
      updateTypeIndex(transactionType, transactionId);

      Debug.print("Transaction created with ID: " # transactionId);
      #ok(newTransaction)
    };

    // Get transaction by ID
    public func getTransaction(id: TransactionId) : ?Transaction {
      transactions.get(id)
    };

    // Update transaction status
    public func updateTransactionStatus(
      id: TransactionId,
      status: Types.TransactionStatus,
      processedBy: ?UserId
    ) : TransactionResult {
      switch (transactions.get(id)) {
        case null {
          #err(#NotFound)
        };
        case (?transaction) {
          let updatedTransaction: Transaction = {
            id = transaction.id;
            chamaId = transaction.chamaId;
            userId = transaction.userId;
            amount = transaction.amount;
            transactionType = transaction.transactionType;
            category = transaction.category;
            description = transaction.description;
            timestamp = transaction.timestamp;
            processedBy = processedBy;
            status = status;
            metadata = transaction.metadata;
          };
          
          transactions.put(id, updatedTransaction);
          #ok(updatedTransaction)
        };
      };
    };

    // Get transactions by chama
    public func getTransactionsByChama(chamaId: ChamaId, limit: ?Nat) : [Transaction] {
      switch (transactionsByChama.get(chamaId)) {
        case null { [] };
        case (?transactionIds) {
          let txns = Array.mapFilter<TransactionId, Transaction>(transactionIds, func(id) {
            transactions.get(id)
          });
          
          // Sort by timestamp (newest first)
          let sorted = Array.sort<Transaction>(txns, func(a, b) {
            if (a.timestamp > b.timestamp) #less
            else if (a.timestamp < b.timestamp) #greater
            else #equal
          });

          switch (limit) {
            case null { sorted };
            case (?l) {
              if (sorted.size() <= l) {
                sorted
              } else {
                Array.subArray<Transaction>(sorted, 0, l)
              }
            };
          }
        };
      };
    };

    // Get transactions by user
    public func getTransactionsByUser(userId: UserId, limit: ?Nat) : [Transaction] {
      switch (transactionsByUser.get(userId)) {
        case null { [] };
        case (?transactionIds) {
          let txns = Array.mapFilter<TransactionId, Transaction>(transactionIds, func(id) {
            transactions.get(id)
          });
          
          let sorted = Array.sort<Transaction>(txns, func(a, b) {
            if (a.timestamp > b.timestamp) #less
            else if (a.timestamp < b.timestamp) #greater
            else #equal
          });

          switch (limit) {
            case null { sorted };
            case (?l) {
              if (sorted.size() <= l) {
                sorted
              } else {
                Array.subArray<Transaction>(sorted, 0, l)
              }
            };
          }
        };
      };
    };

    // Get user balance in a chama
    public func getUserBalance(chamaId: ChamaId, userId: UserId) : (Nat, Nat) {
      let userTransactions = getTransactionsByChama(chamaId, null);
      let filteredTxns = Array.filter<Transaction>(userTransactions, func(txn) {
        txn.userId == userId and txn.status == #completed
      });

      var contributions: Nat = 0;
      var withdrawals: Nat = 0;

      for (txn in filteredTxns.vals()) {
        switch (txn.transactionType) {
          case (#contribution) { contributions += txn.amount };
          case (#withdrawal) { withdrawals += txn.amount };
          case (#repayment) { contributions += txn.amount };
          case (#loan) { withdrawals += txn.amount };
          case (#penalty) { withdrawals += txn.amount };
          case (_) {};
        };
      };

      (contributions, withdrawals)
    };

    // Get chama treasury balance
    public func getChamaTreasuryBalance(chamaId: ChamaId) : Nat {
      let chamaTransactions = getTransactionsByChama(chamaId, null);
      let completedTxns = Array.filter<Transaction>(chamaTransactions, func(txn) {
        txn.status == #completed
      });

      var totalInflow: Nat = 0;
      var totalOutflow: Nat = 0;

      for (txn in completedTxns.vals()) {
        switch (txn.transactionType) {
          case (#contribution) { totalInflow += txn.amount };
          case (#repayment) { totalInflow += txn.amount };
          case (#withdrawal) { totalOutflow += txn.amount };
          case (#loan) { totalOutflow += txn.amount };
          case (#expense) { totalOutflow += txn.amount };
          case (#penalty) { totalInflow += txn.amount };
          case (#dividend) { totalOutflow += txn.amount };
          case (#refund) { totalOutflow += txn.amount };
        };
      };

      if (totalInflow >= totalOutflow) {
        totalInflow - totalOutflow
      } else {
        0 // Should not happen in normal operations
      }
    };

    // Get filtered transactions
    public func getFilteredTransactions(filter: TransactionFilter) : [Transaction] {
      let allTransactions = transactions.vals() |> Iter.toArray(_);
      
      Array.filter<Transaction>(allTransactions, func(txn: Transaction) : Bool {
        let chamaMatch = switch (filter.chamaId) {
          case null { true };
          case (?id) { txn.chamaId == id };
        };

        let userMatch = switch (filter.userId) {
          case null { true };
          case (?id) { txn.userId == id };
        };

        let typeMatch = switch (filter.transactionType) {
          case null { true };
          case (?type_) { txn.transactionType == type_ };
        };

        let statusMatch = switch (filter.status) {
          case null { true };
          case (?status) { txn.status == status };
        };

        let dateMatch = switch (filter.dateRange) {
          case null { true };
          case (?(startTime, endTime)) {
            txn.timestamp >= startTime and txn.timestamp <= endTime
          };
        };

        let amountMatch = switch (filter.minAmount, filter.maxAmount) {
          case (null, null) { true };
          case (?min, null) { txn.amount >= min };
          case (null, ?max) { txn.amount <= max };
          case (?min, ?max) { txn.amount >= min and txn.amount <= max };
        };

        chamaMatch and userMatch and typeMatch and statusMatch and dateMatch and amountMatch
      })
    };

    // Get transaction statistics for a chama
    public func getChamaTransactionStats(chamaId: ChamaId) : {
      totalTransactions: Nat;
      totalContributions: Nat;
      totalWithdrawals: Nat;
      totalLoans: Nat;
      averageTransaction: Nat;
      lastTransactionTime: ?Time.Time;
    } {
      let chamaTransactions = getTransactionsByChama(chamaId, null);
      let completedTxns = Array.filter<Transaction>(chamaTransactions, func(txn) {
        txn.status == #completed
      });

      var totalContributions: Nat = 0;
      var totalWithdrawals: Nat = 0;
      var totalLoans: Nat = 0;
      var totalAmount: Nat = 0;
      var lastTime: ?Time.Time = null;

      for (txn in completedTxns.vals()) {
        totalAmount += txn.amount;
        
        switch (lastTime) {
          case null { lastTime := ?txn.timestamp };
          case (?time) {
            if (txn.timestamp > time) {
              lastTime := ?txn.timestamp;
            };
          };
        };

        switch (txn.transactionType) {
          case (#contribution) { totalContributions += txn.amount };
          case (#withdrawal) { totalWithdrawals += txn.amount };
          case (#loan) { totalLoans += txn.amount };
          case (_) {};
        };
      };

      let averageTransaction = if (completedTxns.size() > 0) {
        totalAmount / completedTxns.size()
      } else {
        0
      };

      {
        totalTransactions = completedTxns.size();
        totalContributions = totalContributions;
        totalWithdrawals = totalWithdrawals;
        totalLoans = totalLoans;
        averageTransaction = averageTransaction;
        lastTransactionTime = lastTime;
      }
    };

    // Helper functions for index management
    private func updateChamaIndex(chamaId: ChamaId, transactionId: TransactionId) {
      switch (transactionsByChama.get(chamaId)) {
        case null {
          transactionsByChama.put(chamaId, [transactionId]);
        };
        case (?existing) {
          transactionsByChama.put(chamaId, Array.append(existing, [transactionId]));
        };
      };
    };

    private func updateUserIndex(userId: UserId, transactionId: TransactionId) {
      switch (transactionsByUser.get(userId)) {
        case null {
          transactionsByUser.put(userId, [transactionId]);
        };
        case (?existing) {
          transactionsByUser.put(userId, Array.append(existing, [transactionId]));
        };
      };
    };

    private func updateTypeIndex(txnType: Types.TransactionType, transactionId: TransactionId) {
      switch (transactionsByType.get(txnType)) {
        case null {
          transactionsByType.put(txnType, [transactionId]);
        };
        case (?existing) {
          transactionsByType.put(txnType, Array.append(existing, [transactionId]));
        };
      };
    };

    // Get transaction count
    public func getTransactionCount() : Nat {
      transactions.size()
    };
  };
}
