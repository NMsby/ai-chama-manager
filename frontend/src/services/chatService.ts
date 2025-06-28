// Chat Service for AI Chatbot Integration
import { Actor, HttpAgent } from '@dfinity/agent';
import { Principal } from '@dfinity/principal';
import { authService } from './auth';
import { IDL } from '@dfinity/candid';

// Types matching the backend
export interface ChatMessage {
  id: string;
  userId: Principal;
  message: string;
  isUserMessage: boolean;
  timestamp: bigint;
  context?: string;
}

export interface ChatSession {
  sessionId: string;
  userId: Principal;
  messages: ChatMessage[];
  startTime: bigint;
  lastActivity: bigint;
  isActive: boolean;
}

export interface ChatResponse {
  message: string;
  suggestions: string[];
  requiresData: boolean;
  dataType?: string;
}

export interface ChatbotCapabilities {
  capabilities: string[];
  supportedLanguages: string[];
  chamaFeatures: string[];
}

// Candid interface for the chatbot canister
const chatbotIdlFactory = ({ IDL }: { IDL: any }) => {
  const UserId = IDL.Principal;
  const Time = IDL.Int;
  
  const ChatMessage = IDL.Record({
    'id': IDL.Text,
    'userId': UserId,
    'message': IDL.Text,
    'isUserMessage': IDL.Bool,
    'timestamp': Time,
    'context': IDL.Opt(IDL.Text),
  });

  const ChatSession = IDL.Record({
    'sessionId': IDL.Text,
    'userId': UserId,
    'messages': IDL.Vec(ChatMessage),
    'startTime': Time,
    'lastActivity': Time,
    'isActive': IDL.Bool,
  });

  const ChatResponse = IDL.Record({
    'message': IDL.Text,
    'suggestions': IDL.Vec(IDL.Text),
    'requiresData': IDL.Bool,
    'dataType': IDL.Opt(IDL.Text),
  });

  const ChatbotCapabilities = IDL.Record({
    'capabilities': IDL.Vec(IDL.Text),
    'supportedLanguages': IDL.Vec(IDL.Text),
    'chamaFeatures': IDL.Vec(IDL.Text),
  });

  return IDL.Service({
    'startChatSession': IDL.Func([], [IDL.Text], []),
    'sendMessage': IDL.Func([IDL.Text, IDL.Text, IDL.Opt(IDL.Text)], [ChatResponse], []),
    'getChatHistory': IDL.Func([IDL.Text], [IDL.Opt(ChatSession)], []),
    'getMySessions': IDL.Func([], [IDL.Vec(ChatSession)], []),
    'endChatSession': IDL.Func([IDL.Text], [IDL.Bool], []),
    'healthCheck': IDL.Func([], [IDL.Text], ['query']),
    'getChatbotCapabilities': IDL.Func([], [ChatbotCapabilities], ['query']),
  });
};

// Chatbot actor type
type ChatbotActor = {
  startChatSession(): Promise<string>;
  sendMessage(sessionId: string, message: string, context: [] | [string]): Promise<ChatResponse>;
  getChatHistory(sessionId: string): Promise<ChatSession | undefined>;
  getMySessions(): Promise<ChatSession[]>;
  endChatSession(sessionId: string): Promise<boolean>;
  healthCheck(): Promise<string>;
  getChatbotCapabilities(): Promise<ChatbotCapabilities>;
};

class ChatService {
  private chatbotActor: ChatbotActor | null = null;

  // Get chatbot canister ID from environment
  private getChatbotCanisterId(): string {
    const canisterId = process.env.REACT_APP_AI_CHATBOT_CANISTER_ID;
    if (!canisterId) {
      throw new Error('AI Chatbot canister ID not found in environment variables');
    }
    return canisterId;
  }

  // Get Chatbot Actor
  private async getChatbotActor(): Promise<ChatbotActor> {
    if (!this.chatbotActor) {
      const agent = await authService.getAgent();
      const canisterId = this.getChatbotCanisterId();
      
      this.chatbotActor = Actor.createActor(chatbotIdlFactory, {
        agent,
        canisterId,
      }) as ChatbotActor;
    }
    return this.chatbotActor;
  }

  // Reset actor (called when user logs out)
  resetActor() {
    this.chatbotActor = null;
  }

  // Start a new chat session
  async startChatSession(): Promise<string> {
    try {
      const actor = await this.getChatbotActor();
      return await actor.startChatSession();
    } catch (error) {
      console.error('Failed to start chat session:', error);
      throw new Error('Failed to start chat session');
    }
  }

  // Send a message to the chatbot
  async sendMessage(sessionId: string, message: string, context?: string): Promise<ChatResponse> {
    try {
      const actor = await this.getChatbotActor();
      // Fix: Pass context as optional parameter, not as array
      return await actor.sendMessage(sessionId, message, context ? [context] : []);
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new Error('Failed to send message');
    }
  }

  // Get chat history for a session
  async getChatHistory(sessionId: string): Promise<ChatSession | null> {
    try {
      const actor = await this.getChatbotActor();
      const result = await actor.getChatHistory(sessionId);
      return result || null;
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return null;
    }
  }

  // Get all user sessions
  async getMySessions(): Promise<ChatSession[]> {
    try {
      const actor = await this.getChatbotActor();
      return await actor.getMySessions();
    } catch (error) {
      console.error('Failed to get sessions:', error);
      return [];
    }
  }

  // End a chat session
  async endChatSession(sessionId: string): Promise<boolean> {
    try {
      const actor = await this.getChatbotActor();
      return await actor.endChatSession(sessionId);
    } catch (error) {
      console.error('Failed to end chat session:', error);
      return false;
    }
  }

  // Get chatbot capabilities
  async getChatbotCapabilities(): Promise<ChatbotCapabilities> {
    try {
      const actor = await this.getChatbotActor();
      return await actor.getChatbotCapabilities();
    } catch (error) {
      console.error('Failed to get chatbot capabilities:', error);
      return {
        capabilities: [],
        supportedLanguages: ['English'],
        chamaFeatures: []
      };
    }
  }

  // Health check
  async healthCheck(): Promise<string> {
    try {
      const actor = await this.getChatbotActor();
      return await actor.healthCheck();
    } catch (error) {
      console.error('Chatbot health check failed:', error);
      return 'Chatbot service unavailable';
    }
  }

  // Helper: Format timestamp for display
  formatTimestamp(timestamp: bigint): string {
    const date = new Date(Number(timestamp) / 1000000); // Convert nanoseconds to milliseconds
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  // Helper: Format message for better display
  formatMessage(message: string): string {
    // Add line breaks for bullet points
    return message
      .replace(/•/g, '\n•')
      .replace(/\n\n/g, '\n')
      .trim();
  }
}

// Export singleton instance
export const chatService = new ChatService();