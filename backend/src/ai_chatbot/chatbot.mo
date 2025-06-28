// AI Chatbot Data Layer and Logic
import Types "../shared/types";
import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Array "mo:base/Array";
import Iter "mo:base/Iter";
import Debug "mo:base/Debug";
import Int "mo:base/Int";
import Nat "mo:base/Nat";

module {
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

  public class ChatBotDB() {
    // Session storage
    private var sessions = HashMap.HashMap<Text, ChatSession>(0, Text.equal, Text.hash);
    private var userSessions = HashMap.HashMap<Types.UserId, [Text]>(0, Principal.equal, Principal.hash);
    private var sessionCounter: Nat = 0;

    // Generate unique session ID
    private func generateSessionId() : Text {
      sessionCounter += 1;
      "chat_" # Nat.toText(sessionCounter) # "_" # Int.toText(Time.now())
    };

    // Generate unique message ID
    private func generateMessageId() : Text {
      "msg_" # Int.toText(Time.now())
    };

    // Create new chat session
    public func createSession(userId: Types.UserId) : Text {
      let sessionId = generateSessionId();
      let now = Time.now();

      let newSession: ChatSession = {
        sessionId = sessionId;
        userId = userId;
        messages = [];
        startTime = now;
        lastActivity = now;
        isActive = true;
      };

      sessions.put(sessionId, newSession);
      
      // Update user sessions index
      switch (userSessions.get(userId)) {
        case null {
          userSessions.put(userId, [sessionId]);
        };
        case (?existingSessions) {
          userSessions.put(userId, Array.append(existingSessions, [sessionId]));
        };
      };

      Debug.print("Created chat session: " # sessionId);
      sessionId
    };

    // Process user message and generate AI response
    public func processMessage(
      sessionId: Text,
      userId: Types.UserId,
      userMessage: Text,
      context: ?Text
    ) : async ChatResponse {
      switch (sessions.get(sessionId)) {
        case null {
          {
            message = "I'm sorry, I couldn't find your chat session. Please start a new conversation.";
            suggestions = ["Start New Chat"];
            requiresData = false;
            dataType = null;
          }
        };
        case (?session) {
          // Verify user owns the session
          if (session.userId != userId) {
            return {
              message = "I'm sorry, you don't have access to this chat session.";
              suggestions = ["Start New Chat"];
              requiresData = false;
              dataType = null;
            };
          };

          let now = Time.now();
          let messageId = generateMessageId();

          // Create user message
          let userMsg: ChatMessage = {
            id = messageId # "_user";
            userId = userId;
            message = userMessage;
            isUserMessage = true;
            timestamp = now;
            context = context;
          };

          // Generate AI response based on message content
          let aiResponse = await generateAIResponse(userMessage, context);

          // Create AI message
          let aiMsg: ChatMessage = {
            id = messageId # "_ai";
            userId = userId;
            message = aiResponse.message;
            isUserMessage = false;
            timestamp = now;
            context = null;
          };

          // Update session with new messages
          let updatedMessages = Array.append(session.messages, [userMsg, aiMsg]);
          let updatedSession: ChatSession = {
            sessionId = session.sessionId;
            userId = session.userId;
            messages = updatedMessages;
            startTime = session.startTime;
            lastActivity = now;
            isActive = session.isActive;
          };

          sessions.put(sessionId, updatedSession);
          aiResponse
        };
      };
    };

    // Generate AI response based on user input
    private func generateAIResponse(userMessage: Text, context: ?Text) : async ChatResponse {
      let lowerMessage = Text.toLowercase(userMessage);

      // Simple intent recognition
      if (Text.contains(lowerMessage, #text "hello") or Text.contains(lowerMessage, #text "hi")) {
        return {
          message = "Hello! I'm your Chama AI assistant. I can help you with your savings group activities, check balances, answer questions about contributions, and guide you through the platform. How can I assist you today?";
          suggestions = [
            "Check my contribution status",
            "Show my chama balance",
            "When is my next meeting?",
            "How do I make a contribution?"
          ];
          requiresData = false;
          dataType = null;
        };
      };

      if (Text.contains(lowerMessage, #text "contribution") or Text.contains(lowerMessage, #text "contribute")) {
        return {
          message = "I can help you with contributions! You can check your contribution status, make new contributions, or see your contribution history. What would you like to know about contributions?";
          suggestions = [
            "Check my contribution status",
            "How to make a contribution",
            "View contribution history",
            "Set contribution reminders"
          ];
          requiresData = true;
          dataType = ?"contributions";
        };
      };

      if (Text.contains(lowerMessage, #text "balance") or Text.contains(lowerMessage, #text "money")) {
        return {
          message = "I can show you your chama balances and financial information. Let me fetch your current balance data.";
          suggestions = [
            "Show detailed breakdown",
            "Compare with last month",
            "Show all chamas",
            "Download statement"
          ];
          requiresData = true;
          dataType = ?"balance";
        };
      };

      if (Text.contains(lowerMessage, #text "chama") and Text.contains(lowerMessage, #text "create")) {
        return {
          message = "I can guide you through creating a new chama! Creating a chama involves setting up the group details, contribution rules, and member management. Would you like me to walk you through the process?";
          suggestions = [
            "Start chama creation",
            "Learn about chama types",
            "View chama templates",
            "Requirements for creating"
          ];
          requiresData = false;
          dataType = null;
        };
      };

      if (Text.contains(lowerMessage, #text "meeting") or Text.contains(lowerMessage, #text "schedule")) {
        return {
          message = "I can help you with chama meetings! I can show you upcoming meetings, help schedule new ones, or provide meeting agendas.";
          suggestions = [
            "Show upcoming meetings",
            "Schedule new meeting",
            "View past meetings",
            "Get meeting reminders"
          ];
          requiresData = true;
          dataType = ?"meetings";
        };
      };

      if (Text.contains(lowerMessage, #text "help") or Text.contains(lowerMessage, #text "what can you do")) {
        return {
          message = "I'm your Chama AI assistant! I can help you with:\n\n• Check contribution status and balances\n• Guide you through chama creation\n• Show meeting schedules\n• Answer questions about platform features\n• Provide financial insights\n• Help with member management\n\nWhat would you like to explore?";
          suggestions = [
            "Check my contributions",
            "Show my chamas",
            "Platform tour",
            "Financial insights"
          ];
          requiresData = false;
          dataType = null;
        };
      };

      // Default response for unrecognized queries
      {
        message = "I understand you're asking about '" # userMessage # "'. While I'm learning to better understand all queries, I can definitely help you with chama management, contributions, balances, and platform navigation. Could you please rephrase your question or choose from the suggestions below?";
        suggestions = [
          "Check my contributions",
          "Show chama balance",
          "View my chamas",
          "Get help with platform"
        ];
        requiresData = false;
        dataType = null;
      }
    };

    // Get session by ID
    public func getSession(sessionId: Text, userId: Types.UserId) : ?ChatSession {
      switch (sessions.get(sessionId)) {
        case null { null };
        case (?session) {
          if (session.userId == userId) {
            ?session
          } else {
            null
          }
        };
      };
    };

    // Get all sessions for a user
    public func getUserSessions(userId: Types.UserId) : [ChatSession] {
      switch (userSessions.get(userId)) {
        case null { [] };
        case (?sessionIds) {
          Array.mapFilter<Text, ChatSession>(sessionIds, func(id) {
            sessions.get(id)
          })
        };
      };
    };

    // End a chat session
    public func endSession(sessionId: Text, userId: Types.UserId) : Bool {
      switch (sessions.get(sessionId)) {
        case null { false };
        case (?session) {
          if (session.userId == userId) {
            let updatedSession: ChatSession = {
              sessionId = session.sessionId;
              userId = session.userId;
              messages = session.messages;
              startTime = session.startTime;
              lastActivity = Time.now();
              isActive = false;
            };
            sessions.put(sessionId, updatedSession);
            true
          } else {
            false
          }
        };
      };
    };

    // Get session count for health check
    public func getSessionCount() : Text {
      Nat.toText(sessions.size())
    };
  };
}