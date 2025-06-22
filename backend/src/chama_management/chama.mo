// Chama Management Data Operations
import Types "../shared/types";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

module {
    public type Chama = Types.Chama;
    public type ChamaId = Types.ChamaId;
    public type ChamaMember = Types.ChamaMember;
    public type ChamaResult = Types.ChamaResult;
    public type ChamaError = Types.ChamaError;
    public type ChamaFilter = Types.ChamaFilter;
    public type UserId = Types.UserId;

    public class ChamaDB() {
        // Primary chama storage
        private var chamas = HashMap.HashMap<ChamaId, Chama>(0, Text.equal, Text.hash);
    
        // Secondary indices
        private var chamasByCreator = HashMap.HashMap<UserId, [ChamaId]>(0, Principal.equal, Principal.hash);
        private var chamasByMember = HashMap.HashMap<UserId, [ChamaId]>(0, Principal.equal, Principal.hash);
        private var chamasByType = HashMap.HashMap<Types.ChamaType, [ChamaId]>(0, func(a, b) { a == b }, func(a) { 0 });
    
        private var chamaCounter: Nat = 0;

        // Generate unique chama ID
        private func generateChamaId(name: Text) : ChamaId {
            chamaCounter += 1;
            "chama_" # Nat.toText(chamaCounter) # "_" # Text.toLowercase(Text.replace(name, #char ' ', "_"))
        };

        // Create new chama
        public func createChama(
            name: Text,
            description: Text,
            creator: UserId,
            contributionAmount: Nat,
            contributionFrequency: Types.ContributionFrequency,
            chamaType: Types.ChamaType,
            maxMembers: Nat
        ) : ChamaResult {
            Debug.print("Creating chama: " # name);

            let chamaId = generateChamaId(name);
            let now = Time.now();

            // Create founder as first member
            let founderMember: ChamaMember = {
                userId = creator;
                joinedAt = now;
                role = #owner;
                status = #active;
                contributionBalance = 0;
                loanBalance = 0;
                lastContribution = null;
                missedContributions = 0;
            };

            let newChama: Chama = {
                id = chamaId;
                name = name;
                description = description;
                creator = creator;
                admins = [creator];
                members = [founderMember];
                maxMembers = maxMembers;
                contributionAmount = contributionAmount;
                contributionFrequency = contributionFrequency;
                meetingFrequency = #monthly;
                chamaType = chamaType;
                rules = {
                    minimumContribution = contributionAmount;
                    latePenalty = contributionAmount / 10; // 10% of contribution
                    withdrawalNotice = 7; // 7 days notice
                    quorumPercentage = 60; // 60% quorum
                    loanInterestRate = 0.05; // 5% monthly
                    maxLoanAmount = contributionAmount * 12; // 12x contribution
                    loanRepaymentPeriod = 6; // 6 months
                };
                treasury = {
                    totalFunds = 0;
                    availableFunds = 0;
                    reserveFunds = 0;
                    loansFunds = 0;
                    emergencyFunds = 0;
                    lastUpdated = now;
                };
                createdAt = now;
                updatedAt = now;
                isActive = true;
                status = #forming;
                settings = {
                    isPublic = true;
                    allowExternalLoans = false;
                    requireApprovalForJoining = true;
                    enableAIRecommendations = true;
                    notificationPreferences = {
                        contributionReminders = true;
                        meetingNotifications = true;
                        proposalAlerts = true;
                        loanReminders = true;
                        aiInsights = true;
                    };
                };
            };

            // Store chama
            chamas.put(chamaId, newChama);

            // Update indices
            updateCreatorIndex(creator, chamaId);
            updateMemberIndex(creator, chamaId);
            updateTypeIndex(chamaType, chamaId);

            Debug.print("Chama created successfully with ID: " # chamaId);
            #ok(newChama)
        };

        // Get chama by ID
        public func getChama(id: ChamaId) : ?Chama {
            chamas.get(id)
        };

        // Update chama
        public func updateChama(id: ChamaId, updatedChama: Chama) : ChamaResult {
            switch (chamas.get(id)) {
                case null {
                    #err(#NotFound)
                };
                case (?existingChama) {
                    let chama: Chama = {
                        id = existingChama.id;
                        name = updatedChama.name;
                        description = updatedChama.description;
                        creator = existingChama.creator;
                        admins = updatedChama.admins;
                        members = updatedChama.members;
                        maxMembers = updatedChama.maxMembers;
                        contributionAmount = updatedChama.contributionAmount;
                        contributionFrequency = updatedChama.contributionFrequency;
                        meetingFrequency = updatedChama.meetingFrequency;
                        chamaType = updatedChama.chamaType;
                        rules = updatedChama.rules;
                        treasury = updatedChama.treasury;
                        createdAt = existingChama.createdAt;
                        updatedAt = Time.now();
                        isActive = updatedChama.isActive;
                        status = updatedChama.status;
                        settings = updatedChama.settings;
                    };
            
                    chamas.put(id, chama);
                    #ok(chama)
                };
            };
        };

        // Add member to chama
        public func addMember(chamaId: ChamaId, userId: UserId) : ChamaResult {
            switch (chamas.get(chamaId)) {
                case null {
                    #err(#NotFound)
                };
                case (?chama) {
                    // Check if chama is at capacity
                    if (chama.members.size() >= chama.maxMembers) {
                        return #err(#MaxMembersReached);
                    };

                    // Check if user is already a member
                    let existingMember = Array.find<ChamaMember>(chama.members, func(member) {
                        member.userId == userId
                    });

                    switch (existingMember) {
                        case (?member) {
                            #err(#AlreadyExists)
                        };
                        case null {
                            let newMember: ChamaMember = {
                                userId = userId;
                                joinedAt = Time.now();
                                role = #member;
                                status = #active;
                                contributionBalance = 0;
                                loanBalance = 0;
                                lastContribution = null;
                                missedContributions = 0;
                            };

                            let updatedMembers = Array.append(chama.members, [newMember]);
                            let updatedChama: Chama = {
                                id = chama.id;
                                name = chama.name;
                                description = chama.description;
                                creator = chama.creator;
                                admins = chama.admins;
                                members = updatedMembers;
                                maxMembers = chama.maxMembers;
                                contributionAmount = chama.contributionAmount;
                                contributionFrequency = chama.contributionFrequency;
                                meetingFrequency = chama.meetingFrequency;
                                chamaType = chama.chamaType;
                                rules = chama.rules;
                                treasury = chama.treasury;
                                createdAt = chama.createdAt;
                                updatedAt = Time.now();
                                isActive = chama.isActive;
                                status = if (updatedMembers.size() >= 3) #active else #forming;
                                settings = chama.settings;
                            };

                            chamas.put(chamaId, updatedChama);
                            updateMemberIndex(userId, chamaId);
                            #ok(updatedChama)
                        };
                    };
                };
            };
        };

        // Remove member from chama
        public func removeMember(chamaId: ChamaId, userId: UserId) : ChamaResult {
            switch (chamas.get(chamaId)) {
                case null {
                    #err(#NotFound)
                };
                case (?chama) {
                    let updatedMembers = Array.filter<ChamaMember>(chama.members, func(member) {
                        member.userId != userId
                    });

                    if (updatedMembers.size() == chama.members.size()) {
                        return #err(#NotFound); // Member not found
                    };

                    let updatedChama: Chama = {
                        id = chama.id;
                        name = chama.name;
                        description = chama.description;
                        creator = chama.creator;
                        admins = Array.filter<UserId>(chama.admins, func(admin) { admin != userId });
                        members = updatedMembers;
                        maxMembers = chama.maxMembers;
                        contributionAmount = chama.contributionAmount;
                        contributionFrequency = chama.contributionFrequency;
                        meetingFrequency = chama.meetingFrequency;
                        chamaType = chama.chamaType;
                        rules = chama.rules;
                        treasury = chama.treasury;
                        createdAt = chama.createdAt;
                        updatedAt = Time.now();
                        isActive = chama.isActive;
                        status = chama.status;
                        settings = chama.settings;
                    };

                    chamas.put(chamaId, updatedChama);
                    removeMemberFromIndex(userId, chamaId);
                    #ok(updatedChama)
                };
            };
        };

        // Update member role
        public func updateMemberRole(chamaId: ChamaId, userId: UserId, newRole: Types.MemberRole) : ChamaResult {
            switch (chamas.get(chamaId)) {
                case null {
                    #err(#NotFound)
                };
                case (?chama) {
                    let updatedMembers = Array.map<ChamaMember, ChamaMember>(chama.members, func(member) {
                        if (member.userId == userId) {
                            {
                                userId = member.userId;
                                joinedAt = member.joinedAt;
                                role = newRole;
                                status = member.status;
                                contributionBalance = member.contributionBalance;
                                loanBalance = member.loanBalance;
                                lastContribution = member.lastContribution;
                                missedContributions = member.missedContributions;
                            }
                        } else {
                            member
                        }
                    });
                    
                    let updatedAdmins = if (newRole == #admin or newRole == #owner) {
                        if (Array.find<UserId>(chama.admins, func(id) { id == userId }) == null) {
                            Array.append(chama.admins, [userId])
                        } else {
                            chama.admins
                        }
                    } else {
                        Array.filter<UserId>(chama.admins, func(id) { id != userId })
                    };

                    let updatedChama: Chama = {
                        id = chama.id;
                        name = chama.name;
                        description = chama.description;
                        creator = chama.creator;
                        admins = updatedAdmins;
                        members = updatedMembers;
                        maxMembers = chama.maxMembers;
                        contributionAmount = chama.contributionAmount;
                        contributionFrequency = chama.contributionFrequency;
                        meetingFrequency = chama.meetingFrequency;
                        chamaType = chama.chamaType;
                        rules = chama.rules;
                        treasury = chama.treasury;
                        createdAt = chama.createdAt;
                        updatedAt = Time.now();
                        isActive = chama.isActive;
                        status = chama.status;
                        settings = chama.settings;
                    };

                    chamas.put(chamaId, updatedChama);
                    #ok(updatedChama)
                };
            };
        };

        // Update treasury
        public func updateTreasury(chamaId: ChamaId, treasury: Types.Treasury) : Bool {
            switch (chamas.get(chamaId)) {
                case null { false };
                case (?chama) {
                    let updatedChama: Chama = {
                        id = chama.id;
                        name = chama.name;
                        description = chama.description;
                        creator = chama.creator;
                        admins = chama.admins;
                        members = chama.members;
                        maxMembers = chama.maxMembers;
                        contributionAmount = chama.contributionAmount;
                        contributionFrequency = chama.contributionFrequency;
                        meetingFrequency = chama.meetingFrequency;
                        chamaType = chama.chamaType;
                        rules = chama.rules;
                        treasury = treasury;
                        createdAt = chama.createdAt;
                        updatedAt = Time.now();
                        isActive = chama.isActive;
                        status = chama.status;
                        settings = chama.settings;
                    };
                    chamas.put(chamaId, updatedChama);
                    true
                };
            };
        };

        // Get chamas by creator
        public func getChamasByCreator(creatorId: UserId) : [Chama] {
            switch (chamasByCreator.get(creatorId)) {
                case null { [] };
                case (?chamaIds) {
                    Array.mapFilter<ChamaId, Chama>(chamaIds, func(id) {
                        chamas.get(id)
                    })
                };
            };
        };

        // Get chamas by member
        public func getChamasByMember(memberId: UserId) : [Chama] {
            switch (chamasByMember.get(memberId)) {
                case null { [] };
                case (?chamaIds) {
                    Array.mapFilter<ChamaId, Chama>(chamaIds, func(id) {
                        chamas.get(id)
                    })
                };
            };
        };

        // Get all chamas with filter
        public func getAllChamas(filter: ?ChamaFilter) : [Chama] {
            let allChamas = chamas.vals() |> Iter.toArray(_);
        
            switch (filter) {
                case null { allChamas };
                case (?f) {
                    Array.filter<Chama>(allChamas, func(chama: Chama) : Bool {
                        let typeMatch = switch (f.chamaType) {
                            case null { true };
                            case (?required) { chama.chamaType == required };
                        };

                        let statusMatch = switch (f.status) {
                            case null { true };
                            case (?required) { chama.status == required };
                        };

                        let publicMatch = switch (f.isPublic) {
                            case null { true };
                            case (?required) { chama.settings.isPublic == required };
                        };

                        let minMembersMatch = switch (f.minMembers) {
                            case null { true };
                            case (?min) { chama.members.size() >= min };
                        };

                        let maxMembersMatch = switch (f.maxMembers) {
                            case null { true };
                            case (?max) { chama.members.size() <= max };
                        };

                        let contributionMatch = switch (f.contributionRange) {
                            case null { true };
                            case (?(min, max)) {
                                chama.contributionAmount >= min and chama.contributionAmount <= max
                            };
                        };

                        typeMatch and statusMatch and publicMatch and minMembersMatch and maxMembersMatch and contributionMatch
                    })
                };
            }
        };

        // Search chamas by name
        public func searchChamas(query: Text) : [Chama] {
            let allChamas = chamas.vals() |> Iter.toArray(_);
            Array.filter<Chama>(allChamas, func(chama: Chama) : Bool {
                let nameMatch = Text.contains(Text.toLowercase(chama.name), #text Text.toLowercase(query));
                let descMatch = Text.contains(Text.toLowercase(chama.description), #text Text.toLowercase(query)); 
                nameMatch or descMatch
            })
        };

        // Get chama count
        public func getChamaCount() : Nat {
            chamas.size()
        };

        // Helper functions for index management
        private func updateCreatorIndex(creatorId: UserId, chamaId: ChamaId) {
            switch (chamasByCreator.get(creatorId)) {
                case null {
                    chamasByCreator.put(creatorId, [chamaId]);
                };
                case (?existing) {
                    chamasByCreator.put(creatorId, Array.append(existing, [chamaId]));
                };
            };
        };

        private func updateMemberIndex(memberId: UserId, chamaId: ChamaId) {
            switch (chamasByMember.get(memberId)) {
                case null {
                    chamasByMember.put(memberId, [chamaId]);
                };
                case (?existing) {
                    if (Array.find<ChamaId>(existing, func(id) { id == chamaId }) == null) {
                        chamasByMember.put(memberId, Array.append(existing, [chamaId]));
                    };
                };
            };
        };

        private func updateTypeIndex(chamaType: Types.ChamaType, chamaId: ChamaId) {
            switch (chamasByType.get(chamaType)) {
                case null {
                    chamasByType.put(chamaType, [chamaId]);
                };
                case (?existing) {
                    chamasByType.put(chamaType, Array.append(existing, [chamaId]));
                };
            };
        };

        private func removeMemberFromIndex(memberId: UserId, chamaId: ChamaId) {
            switch (chamasByMember.get(memberId)) {
                case null {};
                case (?existing) {
                    let filtered = Array.filter<ChamaId>(existing, func(id) { id != chamaId });
                    if (filtered.size() == 0) {
                        chamasByMember.delete(memberId);
                    } else {
                        chamasByMember.put(memberId, filtered);
                    };
                };
            };
        };
    };
}