import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Message, Role, Persona } from '../types';

interface ChatBubbleProps {
  message: Message;
  persona: Persona;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, persona }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-lg shadow-lg border border-white/10 ${
          isUser ? 'bg-zinc-700' : 'bg-black'
        }`}>
          {isUser ? '👤' : persona.avatarEmoji}
        </div>

        {/* Message Body */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className="flex items-baseline gap-2 mb-1">
             <span className={`text-sm font-bold ${isUser ? 'text-white' : persona.color}`}>
                {isUser ? 'You' : persona.name}
             </span>
             <span className="text-[10px] text-zinc-500">
                {new Date(message.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
             </span>
          </div>
          
          {/* Image Attachment */}
          {message.image && (
            <div className={`mb-2 rounded-xl overflow-hidden border border-white/10 shadow-lg ${isUser ? 'ml-auto' : 'mr-auto'}`}>
              <img 
                src={message.image} 
                alt="Uploaded meme" 
                className="max-w-full h-auto max-h-64 object-cover block"
              />
            </div>
          )}

          <div className={`px-4 py-3 rounded-2xl text-sm md:text-base leading-relaxed shadow-sm overflow-hidden ${
            isUser 
              ? 'bg-brand-accent text-white rounded-tr-sm' 
              : 'bg-brand-panel border border-white/5 text-gray-200 rounded-tl-sm'
          }`}>
             <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/30 prose-pre:p-2 prose-pre:rounded">
                <ReactMarkdown 
                    components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        a: ({node, ...props}) => <a className="text-brand-accent hover:underline" target="_blank" rel="noreferrer" {...props} />
                    }}
                >
                  {message.text}
                </ReactMarkdown>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
