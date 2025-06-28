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
import AIService "./ai_service";

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
      
      // Check if this is a simple greeting or help request (handle locally)
      if (Text.contains(lowerMessage, #text "hello") or Text.contains(lowerMessage, #text "hi")) {
        return {
          message = "Hello! I'm your Chama AI assistant. I can help you with your savings group activities, check balances, answer questions about contributions, and guide you through the platform. How can I assist you today?";
          suggestions = AIService.generateSuggestions(userMessage, []);
          requiresData = false;
          dataType = null;
        };
      };

      if (Text.contains(lowerMessage, #text "help") or Text.contains(lowerMessage, #text "what can you do")) {
        return {
          message = "I'm your Chama AI assistant! I can help you with:\n\n• Check contribution status and balances\n• Guide you through chama creation\n• Show meeting schedules\n• Answer questions about platform features\n• Provide financial insights\n• Help with member management\n\nWhat would you like to explore?";
          suggestions = AIService.generateSuggestions(userMessage, []);
          requiresData = false;
          dataType = null;
        };
      };

      // For complex queries, we'll use enhanced local responses
      let topics = AIService.extractTopics(userMessage);
      let (needsData, dataType) = AIService.requiresUserData(userMessage);
      
      // Enhanced local responses based on topics
      if (Text.contains(lowerMessage, #text "contribution") or Text.contains(lowerMessage, #text "contribute")) {
        return {
          message = "I can help you with contributions! You can check your contribution status, make new contributions, view your history, or set up reminders. Contributions are the backbone of any successful chama - regular payments help build trust and grow your savings together.";
          suggestions = AIService.generateSuggestions(userMessage, topics);
          requiresData = needsData;
          dataType = if (needsData) { dataType } else { null };
        };
      };

      if (Text.contains(lowerMessage, #text "balance") or Text.contains(lowerMessage, #text "money")) {
        return {
          message = "I can show you your chama balances and financial information. This includes your individual contributions, the group's treasury balance, and any loans or withdrawals. Keeping track of your finances helps you plan better and stay committed to your savings goals.";
          suggestions = AIService.generateSuggestions(userMessage, topics);
          requiresData = needsData;
          dataType = if (needsData) { dataType } else { null };
        };
      };

      if (Text.contains(lowerMessage, #text "chama")) {
        if (Text.contains(lowerMessage, #text "create")) {
          return {
            message = "Creating a chama is exciting! You'll need to set up group details like contribution amounts, meeting frequency, and member rules. A well-structured chama with clear rules helps prevent conflicts and ensures everyone benefits. Would you like me to guide you through the creation process?";
            suggestions = [
              "Start chama creation wizard",
              "Learn about contribution rules",
              "See chama templates",
              "Member management tips"
            ];
            requiresData = false;
            dataType = null;
          };
        } else {
          return {
            message = "Chamas are the heart of community savings in Kenya! Whether you want to join an existing group or start your own, I can help you navigate the platform and understand how chamas work. What specific aspect of chamas interests you?";
            suggestions = AIService.generateSuggestions(userMessage, topics);
            requiresData = needsData;
            dataType = if (needsData) { dataType } else { null };
          };
        };
      };

      if (Text.contains(lowerMessage, #text "meeting") or Text.contains(lowerMessage, #text "schedule")) {
        return {
          message = "Chama meetings are essential for group decision-making and maintaining member relationships. I can help you view upcoming meetings, schedule new ones, or check past meeting decisions. Regular meetings keep everyone informed and engaged!";
          suggestions = AIService.generateSuggestions(userMessage, topics);
          requiresData = needsData;
          dataType = if (needsData) { dataType } else { null };
        };
      };

      if (Text.contains(lowerMessage, #text "loan")) {
        return {
          message = "Chama loans can help members access credit for personal or business needs. I can explain loan terms, help you apply, or check your loan status. Remember, timely repayments help maintain trust and keep the chama strong for everyone!";
          suggestions = [
            "Check loan eligibility",
            "View loan terms",
            "Apply for loan",
            "Check repayment schedule"
          ];
          requiresData = needsData;
          dataType = if (needsData) { dataType } else { null };
        };
      };

      // Default enhanced response for unrecognized queries
      {
        message = "I understand you're asking about '" # userMessage # "'. As your chama assistant, I'm here to help with savings groups, contributions, financial planning, and platform navigation. Could you tell me more about what specific aspect you'd like help with?";
        suggestions = [
          "Tell me about chamas",
          "Check my account status", 
          "Platform features",
          "Financial guidance"
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