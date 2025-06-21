// Governance Canister
import Types "../shared/types";
import Debug "mo:base/Debug";

actor Governance {
  public type Proposal = Types.Proposal;
  public type ProposalId = Types.ProposalId;

  public func createProposal(chamaId: Types.ChamaId, proposer: Types.UserId, title: Text, description: Text) : async ProposalId {
    Debug.print("Creating proposal: " # title);
    "proposal_" # title
  };

  public func vote(proposalId: ProposalId, voter: Types.UserId, choice: Types.VoteChoice) : async Bool {
    Debug.print("Recording vote");
    true
  };

  public query func getProposal(proposalId: ProposalId) : async ?Proposal {
    Debug.print("Getting proposal");
    null
  };
}
