// Individual Chat Message Component
import React from 'react';
import { ChatMessage as ChatMessageType } from '../services/chatService';

interface ChatMessageProps {
  message: ChatMessageType;
  timestamp: string;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, timestamp }) => {
  const isUser = message.isUserMessage;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex max-w-xs lg:max-w-md ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? 'bg-blue-600 ml-2' : 'bg-gray-400 mr-2'
        }`}>
          {isUser ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Message Bubble */}
        <div className="flex flex-col">
          <div className={`px-4 py-2 rounded-lg ${
            isUser 
              ? 'bg-blue-600 text-white rounded-br-none' 
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}>
            <div className="whitespace-pre-wrap break-words text-sm">
              {message.message}
            </div>
          </div>
          <div className={`text-xs text-gray-500 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {timestamp}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;