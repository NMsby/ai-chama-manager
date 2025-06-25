// Chama Management Data Operations
import Types "../shared/types";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";

module {
    public type Chama = Types.Chama;
    public type ChamaId = Types.ChamaId;
    public type ChamaMember = Types.ChamaMember;
    public type ChamaResult = Types.ChamaResult;
    public type ChamaError = Types.ChamaError;
    public type ChamaFilter = Types.ChamaFilter;
    public type UserId = Types.UserId;
    public type JoinRequest = Types.JoinRequest;
    public type JoinRequestResult = Types.JoinRequestResult;

    public class ChamaDB() {
        // Primary chama storage
        private var chamas = HashMap.HashMap<ChamaId, Chama>(0, Text.equal, Text.hash);
    
        // Secondary indices
        private var chamasByCreator = HashMap.HashMap<UserId, [ChamaId]>(0, Principal.equal, Principal.hash);
        private var chamasByMember = HashMap.HashMap<UserId, [ChamaId]>(0, Principal.equal, Principal.hash);
        private var chamasByType = HashMap.HashMap<Types.ChamaType, [ChamaId]>(0, func(a, b) { a == b }, func(a) { 0 });
    
        private var chamaCounter: Nat = 0;

        // Validate chama name
        private func validateName(name: Text) : Bool {
            let trimmed = Text.trim(name, #char ' ');
            Text.size(trimmed) >= 3 and Text.size(trimmed) <= 100
        };

        // Validate description
        private func validateDescription(description: Text) : Bool {
            let trimmed = Text.trim(description, #char ' ');
            Text.size(trimmed) >= 10 and Text.size(trimmed) <= 500
        };

        // Validate contribution amount
        private func validateContributionAmount(amount: Nat) : Bool {
            amount >= 100 and amount <= 1000000
        };

        // Validate max members
        private func validateMaxMembers(maxMembers: Nat) : Bool {
            maxMembers >= 3 and maxMembers <= 100
        };

        // Comprehensive validation function
        private func validateChamaInput(
            name: Text,
            description: Text,
            contributionAmount: Nat,
            maxMembers: Nat
        ) : ?Text {
            if (not validateName(name)) {
                return ?"Invalid name: must be 3-100 characters";
            };
            if (not validateDescription(description)) {
                return ?"Invalid description: must be 10-500 characters";
            };
            if (not validateContributionAmount(contributionAmount)) {
                return ?"Invalid contribution amount: must be KES 100-1,000,000";
            };
            if (not validateMaxMembers(maxMembers)) {
                return ?"Invalid max members: must be 3-100 members";
            };
            null
        };

        // Generate unique chama ID
        private func generateChamaId(name: Text) : ChamaId {
            chamaCounter += 1;

            // Sanitize name for ID generation
            let sanitizedName = if (Text.size(name) == 0) {
                "unnamed_chama"
            } else {
                let lowercaseName = Text.toLowercase(name);
                let spacesReplaced = Text.replace(lowercaseName, #char ' ', "_");
                let specialCharsRemoved = Text.replace(spacesReplaced, #char '-', "_");
                // Take first 20 characters to prevent overly long IDs
                if (Text.size(specialCharsRemoved) > 20) {
                    let chars = Text.toIter(specialCharsRemoved);
                    let charArray = Iter.toArray(chars);
                    let truncatedArray = Array.tabulate<Char>(20, func(i) { charArray[i] });
                    Text.fromIter(truncatedArray.vals())
                } else {
                    specialCharsRemoved
                }
            };

            "chama_" # Nat.toText(chamaCounter) # "_" # sanitizedName
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
            Debug.print("Creating chama: " # name # " by: " # Principal.toText(creator));

            // Validation Checks
            
            // 1. Name validation
            // Check if name is empty
            let trimmedName = Text.trim(name, #char ' ');
            if (Text.size(trimmedName) == 0) {
                Debug.print("Validation failed: Empty name");
                return #err(#InvalidData);
            };
            // Check if name is too short - minimum 3 characters
            if (Text.size(trimmedName) < 3) {
                Debug.print("Validation failed: Name too short");
                return #err(#InvalidData);
            };
            // Check if name is too long - maximum 100 characters
            if (Text.size(trimmedName) > 100) {
                Debug.print("Validation failed: Name too long");
                return #err(#InvalidData);
            };

            // 2. Description validation
            // Check if description is empty
            let trimmedDesc = Text.trim(description, #char ' ');
            if (Text.size(trimmedDesc) == 0) {
                Debug.print("Validation failed: Empty description");
                return #err(#InvalidData);
            };
            // Check if description is too short - minimum 10 characters
            if (Text.size(trimmedDesc) < 10) {
                Debug.print("Validation failed: Description too short");
                return #err(#InvalidData);
            };
            // Check if description is too long - maximum 500 characters
            if (Text.size(trimmedDesc) > 500) {
                Debug.print("Validation failed: Description too long");
                return #err(#InvalidData);
            };

            // 3. Contribution amount validation
            // Check if contribution amount is zero
            if (contributionAmount == 0) {
                Debug.print("Validation failed: Zero contribution amount");
                return #err(#InvalidData);
            };
            // Check contribution amount - minimum KES 100, maximum KES 1,000,000 
            if (contributionAmount < 100) {  // Minimum KES 100
                Debug.print("Validation failed: Contribution amount too low");
                return #err(#InvalidData);
            };
            if (contributionAmount > 1000000) {  // Maximum KES 1,000,000
                Debug.print("Validation failed: Contribution amount too high");
                return #err(#InvalidData);
            };

            // 4. maxMembers validation
            // Check if maxMembers is zero
            if (maxMembers == 0) {
                Debug.print("Validation failed: Zero max members");
                return #err(#InvalidData);
            };
            // Check maxMembers - minimum 3 members, maximum 100 members
            if (maxMembers < 3) {  // Minimum 3 members for a group
                Debug.print("Validation failed: Max members too low");
                return #err(#InvalidData);
            };
            if (maxMembers > 100) {  // Maximum 100 members
                Debug.print("Validation failed: Max members too high");
                return #err(#InvalidData);
            };

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
                name = trimmedName;
                description = trimmedDesc;
                creator = creator;
                admins = [creator];
                members = [founderMember];
                joinRequests = [];
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

        // Create new chama with custom settings
        public func createChamaWithSettings(
            name: Text,
            description: Text,
            creator: UserId,
            contributionAmount: Nat,
            contributionFrequency: Types.ContributionFrequency,
            chamaType: Types.ChamaType,
            maxMembers: Nat,
            isPublic: Bool,
            requireApprovalForJoining: Bool
        ) : ChamaResult {
            Debug.print("Creating chama with settings: " # name # " by: " # Principal.toText(creator));

            // Use the same validation as existing createChama function
            let trimmedName = Text.trim(name, #char ' ');
            if (Text.size(trimmedName) == 0) {
                Debug.print("Validation failed: Empty name");
                return #err(#InvalidData);
            };
            if (Text.size(trimmedName) < 3) {
                Debug.print("Validation failed: Name too short");
                return #err(#InvalidData);
            };
            if (Text.size(trimmedName) > 100) {
                Debug.print("Validation failed: Name too long");
                return #err(#InvalidData);
            };

            let trimmedDesc = Text.trim(description, #char ' ');
            if (Text.size(trimmedDesc) == 0) {
                Debug.print("Validation failed: Empty description");
                return #err(#InvalidData);
            };
            if (Text.size(trimmedDesc) < 10) {
                Debug.print("Validation failed: Description too short");
                return #err(#InvalidData);
            };
            if (Text.size(trimmedDesc) > 500) {
                Debug.print("Validation failed: Description too long");
                return #err(#InvalidData);
            };

            if (contributionAmount == 0) {
                Debug.print("Validation failed: Zero contribution amount");
                return #err(#InvalidData);
            };
            if (contributionAmount < 100) {
                Debug.print("Validation failed: Contribution amount too low");
                return #err(#InvalidData);
            };
            if (contributionAmount > 1000000) {
                Debug.print("Validation failed: Contribution amount too high");
                return #err(#InvalidData);
            };

            if (maxMembers == 0) {
                Debug.print("Validation failed: Zero max members");
                return #err(#InvalidData);
            };
            if (maxMembers < 3) {
                Debug.print("Validation failed: Max members too low");
                return #err(#InvalidData);
            };
            if (maxMembers > 100) {
                Debug.print("Validation failed: Max members too high");
                return #err(#InvalidData);
            };

            let chamaId = generateChamaId(trimmedName);
            let now = Time.now();

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
                name = trimmedName;
                description = trimmedDesc;
                creator = creator;
                admins = [creator];
                members = [founderMember];
                joinRequests = [];
                maxMembers = maxMembers;
                contributionAmount = contributionAmount;
                contributionFrequency = contributionFrequency;
                meetingFrequency = #monthly;
                chamaType = chamaType;
                rules = {
                    minimumContribution = contributionAmount;
                    latePenalty = contributionAmount / 10;
                    withdrawalNotice = 7;
                    quorumPercentage = 60;
                    loanInterestRate = 0.05;
                    maxLoanAmount = contributionAmount * 12;
                    loanRepaymentPeriod = 6;
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
                    isPublic = isPublic;
                    allowExternalLoans = false;
                    requireApprovalForJoining = requireApprovalForJoining;
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

            chamas.put(chamaId, newChama);
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
                    // Validate updated chama data
                    switch (validateChamaInput(
                        updatedChama.name,
                        updatedChama.description,
                        updatedChama.contributionAmount,
                        updatedChama.maxMembers
                    )) {
                        case (?errorMsg) {
                            Debug.print("Update validation failed: " # errorMsg);
                            return #err(#InvalidData);
                        };
                        case null {
                            // Validation passed, proceed with update
                            let chama: Chama = {
                                id = existingChama.id;
                                name = Text.trim(updatedChama.name, #char ' ');
                                description = Text.trim(updatedChama.description, #char ' ');
                                creator = existingChama.creator;
                                admins = updatedChama.admins;
                                members = updatedChama.members;
                                joinRequests = updatedChama.joinRequests;
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
                                joinRequests = chama.joinRequests;
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

        // Create join request
        public func createJoinRequest(chamaId: ChamaId, userId: UserId, message: ?Text) : JoinRequestResult {
            switch (chamas.get(chamaId)) {
                case null {
                    #err(#NotFound)
                };
                case (?chama) {
                    // Check if user is already a member
                    let existingMember = Array.find<ChamaMember>(chama.members, func(member) {
                        member.userId == userId
                    });
                    
                    switch (existingMember) {
                        case (?member) {
                            #err(#AlreadyExists)
                        };
                        case null {
                            // Check if user already has a pending request
                            let existingRequest = Array.find<JoinRequest>(chama.joinRequests, func(request) {
                                request.userId == userId and request.status == #pending
                            });
                            
                            switch (existingRequest) {
                                case (?request) {
                                    #err(#AlreadyRequested)
                                };
                                case null {
                                    let newRequest: JoinRequest = {
                                        userId = userId;
                                        chamaId = chamaId;
                                        requestedAt = Time.now();
                                        message = message;
                                        status = #pending;
                                    };
                                    
                                    let updatedRequests = Array.append(chama.joinRequests, [newRequest]);
                                    let updatedChama: Chama = {
                                        id = chama.id;
                                        name = chama.name;
                                        description = chama.description;
                                        creator = chama.creator;
                                        admins = chama.admins;
                                        members = chama.members;
                                        joinRequests = updatedRequests;
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
                                    #ok(newRequest)
                                };
                            };
                        };
                    };
                };
            };
        };

        // Approve join request
        public func approveJoinRequest(chamaId: ChamaId, userId: UserId) : ChamaResult {
            switch (chamas.get(chamaId)) {
                case null {
                    #err(#NotFound)
                };
                case (?chama) {
                    // Find the pending request using manual search
                    var requestIndex: ?Nat = null;
                    var i: Nat = 0;
                    
                    for (request in chama.joinRequests.vals()) {
                        if (request.userId == userId and request.status == #pending) {
                            requestIndex := ?i;
                        };
                        i += 1;
                    };
                    
                    switch (requestIndex) {
                        case null {
                            #err(#NotFound)
                        };
                        case (?index) {
                            // Check if chama is at capacity
                            if (chama.members.size() >= chama.maxMembers) {
                                return #err(#MaxMembersReached);
                            };
                            
                            // Create new member
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
                            
                            // Update the request status
                            let updatedRequests = Array.tabulate<JoinRequest>(
                                chama.joinRequests.size(),
                                func(i: Nat) : JoinRequest {
                                    let request = chama.joinRequests[i];
                                    if (i == index) {
                                        {
                                            userId = request.userId;
                                            chamaId = request.chamaId;
                                            requestedAt = request.requestedAt;
                                            message = request.message;
                                            status = #approved;
                                        }
                                    } else {
                                        request
                                    }
                                }
                            );
                            
                            let updatedMembers = Array.append(chama.members, [newMember]);
                            let updatedChama: Chama = {
                                id = chama.id;
                                name = chama.name;
                                description = chama.description;
                                creator = chama.creator;
                                admins = chama.admins;
                                members = updatedMembers;
                                joinRequests = updatedRequests;
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

        // Reject join request
        public func rejectJoinRequest(chamaId: ChamaId, userId: UserId) : Bool {
            switch (chamas.get(chamaId)) {
                case null { false };
                case (?chama) {
                    let updatedRequests = Array.map<JoinRequest, JoinRequest>(
                        chama.joinRequests,
                        func(request: JoinRequest) : JoinRequest {
                            if (request.userId == userId and request.status == #pending) {
                                {
                                    userId = request.userId;
                                    chamaId = request.chamaId;
                                    requestedAt = request.requestedAt;
                                    message = request.message;
                                    status = #rejected;
                                }
                            } else {
                                request
                            }
                        }
                    );
                    
                    let updatedChama: Chama = {
                        id = chama.id;
                        name = chama.name;
                        description = chama.description;
                        creator = chama.creator;
                        admins = chama.admins;
                        members = chama.members;
                        joinRequests = updatedRequests;
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
                    true
                };
            };
        };

        // Get pending join requests for a chama
        public func getPendingJoinRequests(chamaId: ChamaId) : [JoinRequest] {
            switch (chamas.get(chamaId)) {
                case null { [] };
                case (?chama) {
                    Array.filter<JoinRequest>(chama.joinRequests, func(request) {
                        request.status == #pending
                    })
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
                        joinRequests = chama.joinRequests;
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
                        joinRequests = chama.joinRequests;
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
                        joinRequests = chama.joinRequests;
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
        public func searchChamas(searchQuery: Text) : [Chama] {
            let allChamas = chamas.vals() |> Iter.toArray(_);
            Array.filter<Chama>(allChamas, func(chama: Chama) : Bool {
                let lowerName = Text.toLowercase(chama.name);
                let lowerDesc = Text.toLowercase(chama.description);
                let lowerQuery = Text.toLowercase(searchQuery);
                let nameMatch = Text.contains(lowerName, #text lowerQuery);
                let descMatch = Text.contains(lowerDesc, #text lowerQuery); 
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