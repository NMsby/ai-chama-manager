// AI Chatbot Canister - Main Entry Point
import Types "../shared/types";
import ChatBot "./chatbot";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";

actor AIChatBot {
  // Chat message types
  public type ChatMessage = {
    id: Text;
    userId: Types.UserId;
    message: Text;
    isUserMessage: Bool;
    timestamp: Time.Time;
    context: ?Text;
  };

  public type ChatSession = {
    sessionId: Text;
    userId: Types.UserId;
    messages: [ChatMessage];
    startTime: Time.Time;
    lastActivity: Time.Time;
    isActive: Bool;
  };

  public type ChatResponse = {
    message: Text;
    suggestions: [Text];
    requiresData: Bool;
    dataType: ?Text;
  };

  private let chatBot = ChatBot.ChatBotDB();

  // Start a new chat session
  public shared(msg) func startChatSession() : async Text {
    let caller = msg.caller;
    Debug.print("Starting chat session for: " # Principal.toText(caller));
    chatBot.createSession(caller)
  };

  // Send a message to the chatbot
  public shared(msg) func sendMessage(
    sessionId: Text,
    message: Text,
    context: ?Text
  ) : async ChatResponse {
    let caller = msg.caller;
    Debug.print("Message from " # Principal.toText(caller) # ": " # message);
    
    // Process the message and generate response
    await chatBot.processMessage(sessionId, caller, message, context)
  };

  // Get chat history for a session
  public shared(msg) func getChatHistory(sessionId: Text) : async ?ChatSession {
    let caller = msg.caller;
    chatBot.getSession(sessionId, caller)
  };

  // Get active sessions for user
  public shared(msg) func getMySessions() : async [ChatSession] {
    let caller = msg.caller;
    chatBot.getUserSessions(caller)
  };

  // End a chat session
  public shared(msg) func endChatSession(sessionId: Text) : async Bool {
    let caller = msg.caller;
    chatBot.endSession(sessionId, caller)
  };

  // Health check
  public query func healthCheck() : async Text {
    "AI Chatbot Canister is running successfully! Sessions: " # chatBot.getSessionCount()
  };

  // Get chatbot capabilities
  public query func getChatbotCapabilities() : async {
    capabilities: [Text];
    supportedLanguages: [Text];
    chamaFeatures: [Text];
  } {
    {
      capabilities = [
        "Chama Information Queries",
        "Financial Guidance",
        "Platform Navigation",
        "Transaction Status",
        "Member Management Help",
        "Meeting Reminders"
      ];
      supportedLanguages = ["English", "Swahili"];
      chamaFeatures = [
        "Check contribution status",
        "View chama balance",
        "Get meeting schedules",
        "Loan information",
        "Member statistics"
      ];
    }
  };
}