// Chama-Specific Knowledge Base
import Text "mo:base/Text";

module {
  // Chama terminology and definitions
  public let chamaTerms = [
    ("chama", "A savings group where members pool money together for mutual benefit"),
    ("harambee", "A Kenyan tradition of community self-help events"),
    ("merry-go-round", "A rotating savings system where each member receives the pot in turns"),
    ("table banking", "A community-based savings method where members sit around a table"),
    ("contribution", "Regular money put into the chama by members"),
    ("treasury", "The total funds held by the chama"),
    ("quorum", "Minimum number of members needed for official meetings")
  ];

  // Common chama questions and answers
  public let faqResponses = [
    ("How do I join a chama?", "You can browse public chamas on our platform and send a join request. The chama admin will review and approve your request."),
    ("What is the minimum contribution?", "Each chama sets its own minimum contribution amount. You can see this information in the chama details."),
    ("When can I withdraw my money?", "Withdrawal rules vary by chama. Check your chama's rules for specific withdrawal policies and notice periods."),
    ("How are loans handled?", "Many chamas offer loans to members. Interest rates and repayment terms are set by each chama's rules."),
    ("What happens if I miss a contribution?", "Most chamas have late fees for missed contributions. Check your chama's penalty structure.")
  ];

  // Platform navigation help
  public let navigationHelp = [
    ("dashboard", "Your dashboard shows an overview of all your chama activities, balances, and recent transactions."),
    ("my chamas", "View all chamas you're a member of, including those you've created and joined."),
    ("create chama", "Start a new savings group by setting up contribution rules, member limits, and group settings."),
    ("browse chamas", "Discover and join public chamas that match your savings goals."),
    ("transactions", "View your complete transaction history across all chamas.")
  ];

  // Financial guidance
  public let financialTips = [
    "Set up automatic reminders for your contribution dates",
    "Track your savings goals using our analytics dashboard",
    "Consider diversifying across multiple chamas for different goals",
    "Review your chama's performance regularly",
    "Communicate with your chama members about any payment difficulties"
  ];

  // Function to search knowledge base
  public func searchKnowledge(query: Text) : ?Text {
    let lowerQuery = Text.toLowercase(query);
    
    // Search chama terms
    for ((term, definition) in chamaTerms.vals()) {
      if (Text.contains(lowerQuery, #text term)) {
        return ?definition;
      };
    };

    // Search FAQ
    for ((question, answer) in faqResponses.vals()) {
      if (Text.contains(Text.toLowercase(question), #text lowerQuery) or 
          Text.contains(lowerQuery, #text Text.toLowercase(question))) {
        return ?answer;
      };
    };

    // Search navigation help
    for ((feature, help) in navigationHelp.vals()) {
      if (Text.contains(lowerQuery, #text feature)) {
        return ?help;
      };
    };

    null
  };

  // Get random financial tip
  public func getFinancialTip() : Text {
    // Simple rotation through tips (in a real implementation, you'd use proper randomization)
    financialTips[0]
  };
}