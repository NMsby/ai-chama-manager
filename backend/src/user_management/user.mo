// User Management Data Operations
import Types "../shared/types";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Text "mo:base/Text";

module {
  public type User = Types.User;
  public type UserId = Types.UserId;
  public type UserStats = Types.UserStats;
  public type UserResult = Types.UserResult;
  public type UserError = Types.UserError;
  public type UserFilter = Types.UserFilter;

  public class UserDB() {
    // Primary user storage
    private var users = HashMap.HashMap<UserId, User>(0, Principal.equal, Principal.hash);
    private var userStats = HashMap.HashMap<UserId, UserStats>(0, Principal.equal, Principal.hash);
    
    // Secondary indices for efficient queries
    private var usersByEmail = HashMap.HashMap<Text, UserId>(0, Text.equal, Text.hash);
    private var usersByPhone = HashMap.HashMap<Text, UserId>(0, Text.equal, Text.hash);

    // Create new user
    public func createUser(
      id: UserId,
      name: Text,
      email: Text,
      phone: Text
    ) : UserResult {
      Debug.print("Creating user with ID: " # Principal.toText(id));

      // Check if user already exists
      switch (users.get(id)) {
        case (?existingUser) {
          Debug.print("User already exists");
          #err(#AlreadyExists)
        };
        case null {
          // Check email uniqueness
          switch (usersByEmail.get(email)) {
            case (?existingId) {
              Debug.print("Email already in use");
              #err(#AlreadyExists)
            };
            case null {
              // Check phone uniqueness
              switch (usersByPhone.get(phone)) {
                case (?existingId) {
                  Debug.print("Phone already in use");
                  #err(#AlreadyExists)
                };
                case null {
                  let now = Time.now();
                  let newUser: User = {
                    id = id;
                    name = name;
                    email = email;
                    phone = phone;
                    nationalId = null;
                    profileImage = null;
                    createdAt = now;
                    updatedAt = now;
                    isVerified = false;
                    verificationLevel = #basic;
                    creditScore = 0.0;
                    totalContributions = 0;
                    totalWithdrawals = 0;
                    chamasJoined = [];
                    chamasCreated = [];
                  };

                  // Create initial user stats
                  let stats: UserStats = {
                    userId = id;
                    totalSavings = 0;
                    averageContribution = 0;
                    contributionStreak = 0;
                    riskScore = 0.5; // Neutral risk
                    reliabilityScore = 0.5; // Neutral reliability
                    lastActivity = now;
                  };

                  // Store user and indices
                  users.put(id, newUser);
                  userStats.put(id, stats);
                  usersByEmail.put(email, id);
                  usersByPhone.put(phone, id);

                  // Debug logging 
                  Debug.print("User stats created: " # debug_show(stats));
                  Debug.print("User stats created successfully:");
                  #ok(newUser)
                };
              };
            };
          };
        };
      };
    };

    // Get user by ID
    public func getUser(id: UserId) : ?User {
      users.get(id)
    };

    // Update user
    public func updateUser(
      id: UserId,
      name: Text,
      email: Text,
      phone: Text
    ) : UserResult {
      switch (users.get(id)) {
        case null {
          #err(#NotFound)
        };
        case (?existingUser) {
          // Check if email is being changed and is unique
          if (existingUser.email != email) {
            switch (usersByEmail.get(email)) {
              case (?otherId) {
                if (otherId != id) {
                  return #err(#InvalidData);
                };
              };
              case null {};
            };
          };

          // Check if phone is being changed and is unique
          if (existingUser.phone != phone) {
            switch (usersByPhone.get(phone)) {
              case (?otherId) {
                if (otherId != id) {
                  return #err(#InvalidData);
                };
              };
              case null {};
            };
          };

          let updatedUser: User = {
            id = existingUser.id;
            name = name;
            email = email;
            phone = phone;
            nationalId = existingUser.nationalId;
            profileImage = existingUser.profileImage;
            createdAt = existingUser.createdAt;
            updatedAt = Time.now();
            isVerified = existingUser.isVerified;
            verificationLevel = existingUser.verificationLevel;
            creditScore = existingUser.creditScore;
            totalContributions = existingUser.totalContributions;
            totalWithdrawals = existingUser.totalWithdrawals;
            chamasJoined = existingUser.chamasJoined;
            chamasCreated = existingUser.chamasCreated;
          };

          // Update indices if email or phone changed
          if (existingUser.email != email) {
            usersByEmail.delete(existingUser.email);
            usersByEmail.put(email, id);
          };

          if (existingUser.phone != phone) {
            usersByPhone.delete(existingUser.phone);
            usersByPhone.put(phone, id);
          };

          users.put(id, updatedUser);
          #ok(updatedUser)
        };
      };
    };

    // Verify user
    public func verifyUser(id: UserId, level: Types.VerificationLevel) : UserResult {
      switch (users.get(id)) {
        case null {
          #err(#NotFound)
        };
        case (?existingUser) {
          let verifiedUser: User = {
            id = existingUser.id;
            name = existingUser.name;
            email = existingUser.email;
            phone = existingUser.phone;
            nationalId = existingUser.nationalId;
            profileImage = existingUser.profileImage;
            createdAt = existingUser.createdAt;
            updatedAt = Time.now();
            isVerified = true;
            verificationLevel = level;
            creditScore = existingUser.creditScore;
            totalContributions = existingUser.totalContributions;
            totalWithdrawals = existingUser.totalWithdrawals;
            chamasJoined = existingUser.chamasJoined;
            chamasCreated = existingUser.chamasCreated;
          };

          users.put(id, verifiedUser);
          #ok(verifiedUser)
        };
      };
    };

    // Add chama to user's joined list
    public func addChamaToUser(userId: UserId, chamaId: Types.ChamaId) : Bool {
      switch (users.get(userId)) {
        case null { false };
        case (?user) {
          let updatedChamas = Array.append(user.chamasJoined, [chamaId]);
          let updatedUser: User = {
            id = user.id;
            name = user.name;
            email = user.email;
            phone = user.phone;
            nationalId = user.nationalId;
            profileImage = user.profileImage;
            createdAt = user.createdAt;
            updatedAt = Time.now();
            isVerified = user.isVerified;
            verificationLevel = user.verificationLevel;
            creditScore = user.creditScore;
            totalContributions = user.totalContributions;
            totalWithdrawals = user.totalWithdrawals;
            chamasJoined = updatedChamas;
            chamasCreated = user.chamasCreated;
          };
          users.put(userId, updatedUser);
          true
        };
      };
    };

    // Update user stats
    public func updateUserStats(userId: UserId, stats: UserStats) : Bool {
      userStats.put(userId, stats);
      true
    };

    // Get user stats
    public func getUserStats(userId: UserId) : ?UserStats {
      userStats.get(userId)
    };

    // Get all users (with optional filter)
    public func getAllUsers(filter: ?UserFilter) : [User] {
      let allUsers = users.vals() |> Iter.toArray(_);
      
      switch (filter) {
        case null { allUsers };
        case (?f) {
          Array.filter<User>(allUsers, func(user: User) : Bool {
            let verifiedMatch = switch (f.isVerified) {
              case null { true };
              case (?required) { user.isVerified == required };
            };

            let levelMatch = switch (f.verificationLevel) {
              case null { true };
              case (?required) { user.verificationLevel == required };
            };

            let creditMatch = switch (f.minCreditScore) {
              case null { true };
              case (?minScore) { user.creditScore >= minScore };
            };

            let chamaMatch = switch (f.chamaId) {
              case null { true };
              case (?chamaId) {
                Array.find<Types.ChamaId>(user.chamasJoined, func(id) { id == chamaId }) != null
              };
            };

            verifiedMatch and levelMatch and creditMatch and chamaMatch
          })
        };
      }
    };

    // Search users by name or email - FIXED: Changed parameter name from 'query' to 'searchQuery'
    public func searchUsers(searchQuery: Text) : [User] {
      let allUsers = users.vals() |> Iter.toArray(_);
      Array.filter<User>(allUsers, func(user: User) : Bool {
        let lowerName = Text.toLowercase(user.name);
        let lowerEmail = Text.toLowercase(user.email);
        let lowerQuery = Text.toLowercase(searchQuery);
        let nameMatch = Text.contains(lowerName, #text lowerQuery);
        let emailMatch = Text.contains(lowerEmail, #text lowerQuery);
        nameMatch or emailMatch
      })
    };

    // Get user count
    public func getUserCount() : Nat {
      users.size()
    };

    // Delete user (for GDPR compliance)
    public func deleteUser(id: UserId) : Bool {
      switch (users.get(id)) {
        case null { false };
        case (?user) {
          users.delete(id);
          userStats.delete(id);
          usersByEmail.delete(user.email);
          usersByPhone.delete(user.phone);
          true
        };
      };
    };
  };
}