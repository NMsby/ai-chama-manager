// Chama Management Canister with Data Models
import Types "../shared/types";
import ChamaDB "../chama_management/chama";
import Debug "mo:base/Debug";
import Result "mo:base/Result";
import Principal "mo:base/Principal";

actor ChamaManagement {
  public type Chama = Types.Chama;
  public type ChamaId = Types.ChamaId;
  public type ChamaResult = Types.ChamaResult;
  public type ChamaFilter = Types.ChamaFilter;
  public type UserId = Types.UserId;

  private let chamaDB = ChamaDB.ChamaDB();

  // Create a new chama
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
    chamaDB.addMember(chamaId, caller)
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
  public query func searchChamas(query: Text) : async [Chama] {
    chamaDB.searchChamas(query)
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
