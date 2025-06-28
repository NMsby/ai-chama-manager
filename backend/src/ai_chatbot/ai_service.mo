// AI Service Module for External AI Model Integration
import Debug "mo:base/Debug";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Result "mo:base/Result";

module {
  // AI Service configuration
  public let AI_MODEL_ENDPOINT = "http://localhost:11434/api/generate";
  public let AI_MODEL_NAME = "llama3.2:3b";
  
  // AI prompt templates for different contexts
  public let SYSTEM_PROMPT = "You are a helpful AI assistant for a Kenyan chama (savings group) management platform. You help users with chama-related questions, financial guidance, and platform navigation. Keep responses concise, friendly, and culturally appropriate for Kenyan users. Use simple language and provide practical advice.";

  public let CHAMA_CONTEXT_PROMPT = "Context: This is a chama management platform where users can create and join savings groups, make contributions, track finances, and manage group activities. Chamas are traditional Kenyan savings groups where members pool money together.";

  // Response formatting functions
  public func formatPrompt(userMessage: Text, context: ?Text) : Text {
    let basePrompt = SYSTEM_PROMPT # "\n\n" # CHAMA_CONTEXT_PROMPT # "\n\n";
    
    let contextPrompt = switch (context) {
      case null { "" };
      case (?ctx) { "Additional Context: " # ctx # "\n\n" };
    };

    basePrompt # contextPrompt # "User Question: " # userMessage # "\n\nAssistant Response:"
  };

  // Extract key topics from user message for context
  public func extractTopics(message: Text) : [Text] {
    let lowerMessage = Text.toLowercase(message);
    var topics: [Text] = [];

    // Check for chama-related topics
    if (Text.contains(lowerMessage, #text "contribution")) {
      topics := ["contributions"];
    };
    if (Text.contains(lowerMessage, #text "balance") or Text.contains(lowerMessage, #text "money")) {
      topics := ["balance", "finances"];
    };
    if (Text.contains(lowerMessage, #text "meeting")) {
      topics := ["meetings", "schedule"];
    };
    if (Text.contains(lowerMessage, #text "loan")) {
      topics := ["loans", "credit"];
    };
    if (Text.contains(lowerMessage, #text "member")) {
      topics := ["members", "management"];
    };

    topics
  };

  // Generate suggestions based on user message context
  public func generateSuggestions(userMessage: Text, topics: [Text]) : [Text] {
    let lowerMessage = Text.toLowercase(userMessage);

    if (Text.contains(lowerMessage, #text "hello") or Text.contains(lowerMessage, #text "hi")) {
      return [
        "Check my contribution status",
        "Show my chama balance", 
        "When is my next meeting?",
        "How do I create a chama?"
      ];
    };

    if (Text.contains(lowerMessage, #text "contribution")) {
      return [
        "View contribution history",
        "Set contribution reminders",
        "Check payment status",
        "Make a new contribution"
      ];
    };

    if (Text.contains(lowerMessage, #text "balance")) {
      return [
        "Show detailed breakdown",
        "Compare with last month",
        "Download statement",
        "View all chamas"
      ];
    };

    if (Text.contains(lowerMessage, #text "chama")) {
      return [
        "Create new chama",
        "Join existing chama",
        "Manage my chamas",
        "Browse public chamas"
      ];
    };

    // Default suggestions
    [
      "Check my contributions",
      "Show chama balance",
      "View upcoming meetings",
      "Get help with platform"
    ]
  };

  // Determine if query requires user data
  public func requiresUserData(message: Text) : (Bool, ?Text) {
    let lowerMessage = Text.toLowercase(message);

    if (Text.contains(lowerMessage, #text "my") or 
        Text.contains(lowerMessage, #text "balance") or
        Text.contains(lowerMessage, #text "contribution")) {
      return (true, ?"user_data");
    };

    if (Text.contains(lowerMessage, #text "meeting") and 
        Text.contains(lowerMessage, #text "next")) {
      return (true, ?"meetings");
    };

    if (Text.contains(lowerMessage, #text "chama") and 
        (Text.contains(lowerMessage, #text "my") or Text.contains(lowerMessage, #text "list"))) {
      return (true, ?"chamas");
    };

    (false, null)
  };

  // Format AI response for better readability
  public func formatAIResponse(rawResponse: Text) : Text {
    // Clean up the response
    let trimmed = Text.trim(rawResponse, #char ' ');
    
    // Add line breaks for better formatting
    let formatted = Text.replace(trimmed, #text ". ", ". \n\n");
    
    // Ensure it's not too long
    if (Text.size(formatted) > 500) {
      // Truncate and add continuation
      Text.take(formatted, 450) # "... \n\nWould you like me to explain more about any specific part?"
    } else {
      formatted
    }
  };
}