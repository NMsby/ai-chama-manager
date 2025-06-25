// User Management Canister
import Types "../shared/types";
import UserDB "../user_management/user";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

actor UserManagement {
  public type User = Types.User;
  public type UserId = Types.UserId;
  public type UserResult = Types.UserResult;
  public type UserStats = Types.UserStats;
  public type UserFilter = Types.UserFilter;

  private let userDB = UserDB.UserDB();

  public shared(msg) func registerUser(name: Text, email: Text, phone: Text) : async UserResult {
    let caller = msg.caller;
    Debug.print("Registration request from: " # Principal.toText(caller));
    userDB.createUser(caller, name, email, phone)
  };

  public shared(msg) func getMyProfile() : async ?User {
    let caller = msg.caller;
    userDB.getUser(caller)
  };

  public query func getUserProfile(userId: UserId) : async ?User {
    userDB.getUser(userId)
  };

  public shared(msg) func updateProfile(name: Text, email: Text, phone: Text) : async UserResult {
    let caller = msg.caller;
    userDB.updateUser(caller, name, email, phone)
  };

  // Verification process
  public shared(msg) func verifyUser(level: Types.VerificationLevel) : async UserResult {
    let caller = msg.caller;
    userDB.verifyUser(caller, level)
  };

  public shared(msg) func getMyStats() : async ?UserStats {
    let caller = msg.caller;
    userDB.getUserStats(caller)
  };

  public query func searchUsers(searchQuery: Text) : async [User] {
    userDB.searchUsers(searchQuery)
  };

  public query func getAllUsers(filter: ?UserFilter) : async [User] {
    userDB.getAllUsers(filter)
  };

  public query func getUserCount() : async Nat {
    userDB.getUserCount()
  };

  public func addChamaToUser(userId: UserId, chamaId: Types.ChamaId) : async Bool {
    userDB.addChamaToUser(userId, chamaId)
  };

  public query func healthCheck() : async Text {
    "User Management Canister with enhanced data models is running successfully! Users: " # Nat.toText(userDB.getUserCount())
  };
}