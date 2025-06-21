// Chama Management Canister
import Types "../shared/types";
import Debug "mo:base/Debug";

actor ChamaManagement {
  public type Chama = Types.Chama;
  public type ChamaId = Types.ChamaId;
  public type UserId = Types.UserId;

  public func createChama(name: Text, description: Text, creator: UserId) : async ChamaId {
    Debug.print("Creating chama: " # name);
    "chama_" # name
  };

  public query func getChama(chamaId: ChamaId) : async ?Chama {
    Debug.print("Getting chama details");
    null
  };

  public func addMember(chamaId: ChamaId, userId: UserId) : async Bool {
    Debug.print("Adding member to chama");
    true
  };
}
