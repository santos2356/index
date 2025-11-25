import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';
import { Send, Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';

interface ChatModeProps {
  apiKey: string;
}

const ChatMode: React.FC<ChatModeProps> = ({ apiKey }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (apiKey && !chatSessionRef.current) {
      const ai = new GoogleGenAI({ apiKey });
      chatSessionRef.current = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: 'You are a helpful, witty, and concise AI assistant.',
        },
      });
    }
  }, [apiKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatSessionRef.current || isLoading) return;

    const userMsg = inputValue;
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      // Stream the response
      const resultStream = await chatSessionRef.current.sendMessageStream({ message: userMsg });
      
      let fullResponseText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]); // Placeholder

      for await (const chunk of resultStream) {
        const c = chunk as GenerateContentResponse;
        const textChunk = c.text || '';
        fullResponseText += textChunk;
        
        setMessages(prev => {
          const newHistory = [...prev];
          const lastMsg = newHistory[newHistory.length - 1];
          if (lastMsg.role === 'model') {
            lastMsg.text = fullResponseText;
          }
          return newHistory;
        });
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, something went wrong.', isError: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] bg-neutral-900/50 rounded-xl border border-neutral-800 shadow-2xl overflow-hidden">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-neutral-500">
            <Bot size={48} className="mb-4 opacity-50" />
            <p>Start a conversation with Gemini Flash.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
              ${msg.role === 'user' ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
              {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
            </div>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed
              ${msg.role === 'user' 
                ? 'bg-indigo-600/20 text-indigo-100 rounded-tr-none' 
                : msg.isError 
                  ? 'bg-red-900/20 text-red-200 border border-red-800'
                  : 'bg-neutral-800 text-neutral-200 rounded-tl-none'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-neutral-900 border-t border-neutral-800">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            placeholder="Type your message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center w-12"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatMode;