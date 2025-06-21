// Authentication and Authorization Module
import Types "shared/types";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import HashMap "mo:base/HashMap";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";

module {
  public type User = Types.User;
  public type UserId = Types.UserId;

  // Authentication result types
  public type AuthResult = Result.Result<User, AuthError>;
  
  public type AuthError = {
    #NotAuthenticated;
    #UserNotFound;
    #InvalidCredentials;
    #AlreadyExists;
  };

  // Session management
  public type Session = {
    userId: UserId;
    createdAt: Time.Time;
    expiresAt: Time.Time;
    isActive: Bool;
  };

  public class AuthManager() {
    private var users = HashMap.HashMap<UserId, User>(0, Principal.equal, Principal.hash);
    private var sessions = HashMap.HashMap<UserId, Session>(0, Principal.equal, Principal.hash);

    // Register a new user
    public func registerUser(caller: Principal, name: Text, email: Text, phone: Text) : AuthResult {
      Debug.print("Registering user: " # name # " with principal: " # Principal.toText(caller));
      
      switch (users.get(caller)) {
        case (?existingUser) {
          #err(#AlreadyExists)
        };
        case null {
          let newUser: User = {
            id = caller;
            name = name;
            email = email;
            phone = phone;
            createdAt = Time.now();
            isVerified = false;
          };
          
          users.put(caller, newUser);
          
          // Create initial session
          let session: Session = {
            userId = caller;
            createdAt = Time.now();
            expiresAt = Time.now() + (24 * 60 * 60 * 1000_000_000); // 24 hours in nanoseconds
            isActive = true;
          };
          sessions.put(caller, session);
          
          Debug.print("User registered successfully");
          #ok(newUser)
        };
      };
    };

    // Get user by ID
    public func getUser(userId: UserId) : ?User {
      users.get(userId)
    };

    // Update user profile
    public func updateUser(caller: Principal, name: Text, email: Text, phone: Text) : AuthResult {
      switch (users.get(caller)) {
        case null {
          #err(#UserNotFound)
        };
        case (?existingUser) {
          let updatedUser: User = {
            id = existingUser.id;
            name = name;
            email = email;
            phone = phone;
            createdAt = existingUser.createdAt;
            isVerified = existingUser.isVerified;
          };
          
          users.put(caller, updatedUser);
          #ok(updatedUser)
        };
      };
    };

    // Verify user identity
    public func verifyUser(caller: Principal) : Bool {
      switch (users.get(caller)) {
        case null { false };
        case (?user) {
          let verifiedUser: User = {
            id = user.id;
            name = user.name;
            email = user.email;
            phone = user.phone;
            createdAt = user.createdAt;
            isVerified = true;
          };
          users.put(caller, verifiedUser);
          true
        };
      };
    };

    // Check if user is authenticated
    public func isAuthenticated(caller: Principal) : Bool {
      switch (sessions.get(caller)) {
        case null { false };
        case (?session) {
          session.isActive and Time.now() < session.expiresAt
        };
      };
    };

    // Create new session
    public func createSession(caller: Principal) : Bool {
      switch (users.get(caller)) {
        case null { false };
        case (?user) {
          let session: Session = {
            userId = caller;
            createdAt = Time.now();
            expiresAt = Time.now() + (24 * 60 * 60 * 1000_000_000); // 24 hours
            isActive = true;
          };
          sessions.put(caller, session);
          true
        };
      };
    };

    // End session (logout)
    public func endSession(caller: Principal) : Bool {
      switch (sessions.get(caller)) {
        case null { false };
        case (?session) {
          let endedSession: Session = {
            userId = session.userId;
            createdAt = session.createdAt;
            expiresAt = session.expiresAt;
            isActive = false;
          };
          sessions.put(caller, endedSession);
          true
        };
      };
    };

    // Get all users (admin function)
    public func getAllUsers() : [User] {
      users.vals() |> Iter.toArray(_)
    };
  };
}
