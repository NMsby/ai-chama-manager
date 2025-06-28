// Main ChatBot Component
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import { chatService, ChatMessage, ChatResponse, ChatSession } from '../services/chatService';
import ChatMessageComponent from './ChatMessage';
import ChatInput from './ChatInput';

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ isOpen, onClose }) => {
  const { isAuthenticated, user } = useAuth();
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat session when opened
  useEffect(() => {
    if (isOpen && isAuthenticated && !currentSession) {
      initializeChat();
    }
  }, [isOpen, isAuthenticated]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sessionId = await chatService.startChatSession();
      
      // Create initial session object
      const newSession: ChatSession = {
        sessionId,
        userId: user!.id,
        messages: [],
        startTime: BigInt(Date.now() * 1000000), // Convert to nanoseconds
        lastActivity: BigInt(Date.now() * 1000000),
        isActive: true
      };

      setCurrentSession(newSession);
      setMessages([]);
      
      // Send welcome message
      await sendWelcomeMessage(sessionId);
    } catch (err) {
      console.error('Failed to initialize chat:', err);
      setError('Failed to start chat session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendWelcomeMessage = async (sessionId: string) => {
    try {
      const response = await chatService.sendMessage(sessionId, 'hello', 'welcome');
      handleChatResponse(response);
    } catch (err) {
      console.error('Failed to send welcome message:', err);
    }
  };

  const sendMessage = async (message: string, context?: string) => {
    if (!currentSession || !message.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Add user message to display immediately
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}`,
        userId: user!.id,
        message: message.trim(),
        isUserMessage: true,
        timestamp: BigInt(Date.now() * 1000000),
        context
      };

      setMessages(prev => [...prev, userMessage]);

      // Send to backend and get AI response
      const response = await chatService.sendMessage(currentSession.sessionId, message, context);
      handleChatResponse(response);

    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatResponse = (response: ChatResponse) => {
    // Add AI message to display
    const aiMessage: ChatMessage = {
      id: `ai_${Date.now()}`,
      userId: user!.id,
      message: chatService.formatMessage(response.message),
      isUserMessage: false,
      timestamp: BigInt(Date.now() * 1000000)
    };

    setMessages(prev => [...prev, aiMessage]);
    setSuggestions(response.suggestions);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleClose = () => {
    if (currentSession) {
      chatService.endChatSession(currentSession.sessionId).catch(console.error);
      setCurrentSession(null);
      setMessages([]);
      setSuggestions([]);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold">Chama AI Assistant</h3>
              <p className="text-xs opacity-90">Here to help with your chama</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!isAuthenticated ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Please log in to use the AI assistant.</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-500">{error}</p>
              <button
                onClick={initializeChat}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessageComponent
                  key={message.id}
                  message={message}
                  timestamp={chatService.formatTimestamp(message.timestamp)}
                />
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 border-t">
            <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors"
                  disabled={isLoading}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        {isAuthenticated && currentSession && (
          <ChatInput
            onSendMessage={sendMessage}
            disabled={isLoading}
            placeholder="Ask me about your chama..."
          />
        )}
      </div>
    </div>
  );
};

export default ChatBot;