// User Management Canister with Authentication
import Types "../shared/types";
import Auth "../auth";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

actor UserManagement {
  public type User = Types.User;
  public type UserId = Types.UserId;
  public type AuthResult = Auth.AuthResult;

  private let authManager = Auth.AuthManager();

  // Register a new user
  public shared(msg) func registerUser(name: Text, email: Text, phone: Text) : async AuthResult {
    let caller = msg.caller;
    Debug.print("Registration request from: " # Principal.toText(caller));
    authManager.registerUser(caller, name, email, phone)
  };

  // Get current user profile
  public shared(msg) func getMyProfile() : async ?User {
    let caller = msg.caller;
    if (authManager.isAuthenticated(caller)) {
      authManager.getUser(caller)
    } else {
      null
    }
  };

  // Get user by ID (public view)
  public query func getUserProfile(userId: UserId) : async ?User {
    authManager.getUser(userId)
  };

  // Update user profile
  public shared(msg) func updateProfile(name: Text, email: Text, phone: Text) : async AuthResult {
    let caller = msg.caller;
    if (authManager.isAuthenticated(caller)) {
      authManager.updateUser(caller, name, email, phone)
    } else {
      #err(#NotAuthenticated)
    }
  };

  // Verify user
  public shared(msg) func verifyUser() : async Bool {
    let caller = msg.caller;
    authManager.verifyUser(caller)
  };

  // Login (create session)
  public shared(msg) func login() : async Bool {
    let caller = msg.caller;
    Debug.print("Login attempt from: " # Principal.toText(caller));
    authManager.createSession(caller)
  };

  // Logout (end session)
  public shared(msg) func logout() : async Bool {
    let caller = msg.caller;
    Debug.print("Logout request from: " # Principal.toText(caller));
    authManager.endSession(caller)
  };

  // Check authentication status
  public shared(msg) func isAuthenticated() : async Bool {
    let caller = msg.caller;
    authManager.isAuthenticated(caller)
  };

  // Get all users (for admin purposes)
  public query func getAllUsers() : async [User] {
    authManager.getAllUsers()
  };

  // Health check
  public query func healthCheck() : async Text {
    "User Management Canister is running successfully!"
  };
}
