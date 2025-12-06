import React, { useEffect, useRef } from 'react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full overflow-hidden glass-panel rounded-2xl">
      <div className="p-4 border-b border-white/10 bg-white/5">
        <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider">Live Transcript</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-10 italic">
            Start the session to begin studying...
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-purple-600/20 border border-purple-500/30 text-purple-100 rounded-br-none' 
                  : 'bg-cyan-600/20 border border-cyan-500/30 text-cyan-100 rounded-bl-none'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatInterface;
