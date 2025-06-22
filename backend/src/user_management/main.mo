// User Management Canister
import Types "../shared/types";
import UserDB "../user_management/user";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Result "mo:base/Result";

actor UserManagement {
  public type User = Types.User;
  public type UserId = Types.UserId;
  public type UserResult = Types.UserResult;
  public type UserStats = Types.UserStats;
  public type UserFilter = Types.UserFilter;

  private let userDB = UserDB.UserDB();

  // Register a new user
  public shared(msg) func registerUser(name: Text, email: Text, phone: Text) : async UserResult {
    let caller = msg.caller;
    Debug.print("Registration request from: " # Principal.toText(caller));
    userDB.createUser(caller, name, email, phone)
  };

  // Get current user profile
  public shared(msg) func getMyProfile() : async ?User {
    let caller = msg.caller;
    userDB.getUser(caller)
  };

  // Get user by ID (public view)
  public query func getUserProfile(userId: UserId) : async ?User {
    userDB.getUser(userId)
  };

  // Update user profile
  public shared(msg) func updateProfile(name: Text, email: Text, phone: Text) : async UserResult {
    let caller = msg.caller;
    userDB.updateUser(caller, name, email, phone)
  };

  // Verify user
  public shared(msg) func verifyUser(level: Types.VerificationLevel) : async UserResult {
    let caller = msg.caller;
    userDB.verifyUser(caller, level)
  };

  // Get user statistics
  public shared(msg) func getMyStats() : async ?UserStats {
    let caller = msg.caller;
    userDB.getUserStats(caller)
  };

  // Search users
  public query func searchUsers(query: Text) : async [User] {
    userDB.searchUsers(query)
  };

  // Get all users with filter
  public query func getAllUsers(filter: ?UserFilter) : async [User] {
    userDB.getAllUsers(filter)
  };

  // Get user count
  public query func getUserCount() : async Nat {
    userDB.getUserCount()
  };

  // Add chama to user's joined list (called by chama management)
  public func addChamaToUser(userId: UserId, chamaId: Types.ChamaId) : async Bool {
    userDB.addChamaToUser(userId, chamaId)
  };

  // Health check
  public query func healthCheck() : async Text {
    "User Management Canister with enhanced data models is running successfully! Users: " # Nat.toText(userDB.getUserCount())
  };
}
