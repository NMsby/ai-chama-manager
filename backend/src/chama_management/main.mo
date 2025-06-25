// Chama Management Canister with Data Models
import Types "../shared/types";
import ChamaDB "../chama_management/chama";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Nat "mo:base/Nat";

actor ChamaManagement {
  public type Chama = Types.Chama;
  public type ChamaId = Types.ChamaId;
  public type ChamaResult = Types.ChamaResult;
  public type ChamaFilter = Types.ChamaFilter;
  public type UserId = Types.UserId;
  public type JoinRequest = Types.JoinRequest;
  public type JoinRequestResult = Types.JoinRequestResult;

  private let chamaDB = ChamaDB.ChamaDB();

  // Create a new chama with optional settings
  public shared(msg) func createChama(
    name: Text,
    description: Text,
    contributionAmount: Nat,
    contributionFrequency: Types.ContributionFrequency,
    chamaType: Types.ChamaType,
    maxMembers: Nat
  ) : async ChamaResult {
    let caller = msg.caller;
    Debug.print("Creating chama: " # name # " by: " # Principal.toText(caller));
    chamaDB.createChama(name, description, caller, contributionAmount, contributionFrequency, chamaType, maxMembers)
  };

  // Create a new chama with custom settings
  public shared(msg) func createChamaWithSettings(
    name: Text,
    description: Text,
    contributionAmount: Nat,
    contributionFrequency: Types.ContributionFrequency,
    chamaType: Types.ChamaType,
    maxMembers: Nat,
    isPublic: Bool,
    requireApprovalForJoining: Bool
  ) : async ChamaResult {
    let caller = msg.caller;
    Debug.print("Creating chama with custom settings: " # name # " by: " # Principal.toText(caller));
    chamaDB.createChamaWithSettings(name, description, caller, contributionAmount, contributionFrequency, chamaType, maxMembers, isPublic, requireApprovalForJoining)
  };

  // Get chama details
  public query func getChama(chamaId: ChamaId) : async ?Chama {
    chamaDB.getChama(chamaId)
  };

  // Update chama (only by admins)
  public shared(msg) func updateChama(chamaId: ChamaId, updatedChama: Chama) : async ChamaResult {
    let caller = msg.caller;
      
    // Check if caller is admin of the chama
    switch (chamaDB.getChama(chamaId)) {
      case null { #err(#NotFound) };
      case (?chama) {
        let isAdmin = Array.find<UserId>(chama.admins, func(admin) { admin == caller }) != null;
        if (not isAdmin) {
          #err(#NotAuthorized)
        } else {
          chamaDB.updateChama(chamaId, updatedChama)
        }
      };
    };
  };

  // Add member to chama
  public shared(msg) func joinChama(chamaId: ChamaId) : async ChamaResult {
    let caller = msg.caller;
    Debug.print("User joining chama: " # chamaId);

    switch (chamaDB.getChama(chamaId)) {
        case null { #err(#NotFound) };
        case (?chama) {
            // Check if chama is public
            if (not chama.settings.isPublic) {
                Debug.print("Join failed: Private chama");
                return #err(#NotAuthorized); // Private chama
            };
            
            // Check if approval is required
            if (chama.settings.requireApprovalForJoining) {
                Debug.print("Join requires approval, creating request");
                switch (chamaDB.createJoinRequest(chamaId, caller, null)) {
                    case (#ok(request)) {
                        // Return success but indicate approval required
                        #err(#ApprovalRequired)
                        // Add as pending member (requires implementation)
                        // chamaDB.addPendingMember(chamaId, caller)
                    };
                    case (#err(error)) {
                        #err(error)
                    };
                }                
            } else {
                Debug.print("Direct join allowed");
                
                // Add as active member immediately
                chamaDB.addMember(chamaId, caller)
            };
        };
    };
  };

  // Join with message
  public shared(msg) func joinChamaWithMessage(chamaId: ChamaId, message: Text) : async JoinRequestResult {
      let caller = msg.caller;
      Debug.print("User joining chama with message: " # chamaId);
      
      switch (chamaDB.getChama(chamaId)) {
          case null { #err(#NotFound) };
          case (?chama) {
              if (not chama.settings.isPublic) {
                  return #err(#PrivateChama);
              };
              
              chamaDB.createJoinRequest(chamaId, caller, ?message)
          };
      };
  };

  // Approve join request (admin only)
  public shared(msg) func approveJoinRequest(chamaId: ChamaId, userId: UserId) : async ChamaResult {
      let caller = msg.caller;
      
      switch (chamaDB.getChama(chamaId)) {
          case null { #err(#NotFound) };
          case (?chama) {
              let isAdmin = Array.find<UserId>(chama.admins, func(admin) { admin == caller }) != null;
              if (not isAdmin) {
                  #err(#NotAuthorized)
              } else {
                  chamaDB.approveJoinRequest(chamaId, userId)
              }
          };
      };
  };

  // Reject join request (admin only)
  public shared(msg) func rejectJoinRequest(chamaId: ChamaId, userId: UserId) : async Bool {
      let caller = msg.caller;
      
      switch (chamaDB.getChama(chamaId)) {
          case null { false };
          case (?chama) {
              let isAdmin = Array.find<UserId>(chama.admins, func(admin) { admin == caller }) != null;
              if (not isAdmin) {
                  false
              } else {
                  chamaDB.rejectJoinRequest(chamaId, userId)
              }
          };
      };
  };

  // Get pending join requests (admin only)
  public shared(msg) func getPendingJoinRequests(chamaId: ChamaId) : async [JoinRequest] {
      let caller = msg.caller;
      
      switch (chamaDB.getChama(chamaId)) {
          case null { [] };
          case (?chama) {
              let isAdmin = Array.find<UserId>(chama.admins, func(admin) { admin == caller }) != null;
              if (not isAdmin) {
                  []
              } else {
                  chamaDB.getPendingJoinRequests(chamaId)
              }
          };
      };
  };

  // Add member by admin
  public shared(msg) func addMember(chamaId: ChamaId, userId: UserId) : async ChamaResult {
    let caller = msg.caller;
      
    // Check if caller is admin
    switch (chamaDB.getChama(chamaId)) {
      case null { #err(#NotFound) };
      case (?chama) {
        let isAdmin = Array.find<UserId>(chama.admins, func(admin) { admin == caller }) != null;
        if (not isAdmin) {
          #err(#NotAuthorized)
        } else {
          chamaDB.addMember(chamaId, userId)
        }
      };
    };
  };

  // Remove member (by admin or self)
  public shared(msg) func removeMember(chamaId: ChamaId, userId: UserId) : async ChamaResult {
    let caller = msg.caller;
      
    switch (chamaDB.getChama(chamaId)) {
      case null { #err(#NotFound) };
      case (?chama) {
        let isAdmin = Array.find<UserId>(chama.admins, func(admin) { admin == caller }) != null;
        let isSelf = caller == userId;
          
        if (not isAdmin and not isSelf) {
          #err(#NotAuthorized)
        } else {
          chamaDB.removeMember(chamaId, userId)
        }
      };
    };
  };

  // Update member role (admin only)
  public shared(msg) func updateMemberRole(
    chamaId: ChamaId,
    userId: UserId,
    newRole: Types.MemberRole
  ) : async ChamaResult {
    let caller = msg.caller;
      
    switch (chamaDB.getChama(chamaId)) {
      case null { #err(#NotFound) };
      case (?chama) {
        let isOwner = chama.creator == caller;
        if (not isOwner) {
          #err(#NotAuthorized)
        } else {
          chamaDB.updateMemberRole(chamaId, userId, newRole)
        }
      };
    };
  };

  // Update treasury
  public func updateTreasury(chamaId: ChamaId, treasury: Types.Treasury) : async Bool {
    chamaDB.updateTreasury(chamaId, treasury)
  };

  // Get chamas by creator
  public query func getChamasByCreator(creatorId: UserId) : async [Chama] {
    chamaDB.getChamasByCreator(creatorId)
  };

  // Get chamas by member
  public query func getChamasByMember(memberId: UserId) : async [Chama] {
    chamaDB.getChamasByMember(memberId)
  };

  // Get my chamas
  public shared(msg) func getMyChamas() : async [Chama] {
    let caller = msg.caller;
    chamaDB.getChamasByMember(caller)
  };

  // Get all public chamas
  public query func getPublicChamas(filter: ?ChamaFilter) : async [Chama] {
    let publicFilter: ChamaFilter = switch (filter) {
      case null { { chamaType = null; status = null; isPublic = ?true; minMembers = null; maxMembers = null; contributionRange = null } };
      case (?f) { { chamaType = f.chamaType; status = f.status; isPublic = ?true; minMembers = f.minMembers; maxMembers = f.maxMembers; contributionRange = f.contributionRange } };
    };
    chamaDB.getAllChamas(?publicFilter)
  };

  // Search chamas
  public query func searchChamas(searchQuery: Text) : async [Chama] {
    chamaDB.searchChamas(searchQuery)
  };

  // Get chama count
  public query func getChamaCount() : async Nat {
    chamaDB.getChamaCount()
  };

  // Health check
  public query func healthCheck() : async Text {
    "Chama Management Canister with enhanced data models is running successfully! Chamas: " # Nat.toText(chamaDB.getChamaCount())
  };
}