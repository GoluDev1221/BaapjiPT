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

             {/* Grounding Sources (Search Results) */}
             {message.sources && message.sources.length > 0 && (
               <div className="mt-3 pt-3 border-t border-white/10">
                 <p className="text-[10px] uppercase tracking-wider text-brand-muted font-bold mb-2 flex items-center gap-1">
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                   Sources
                 </p>
                 <div className="flex flex-wrap gap-2">
                   {message.sources.map((source, idx) => (
                     <a 
                       key={idx} 
                       href={source.uri} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="text-[10px] bg-black/30 hover:bg-black/50 text-blue-300 px-2 py-1 rounded border border-white/5 truncate max-w-[200px] transition-colors"
                     >
                       {source.title}
                     </a>
                   ))}
                 </div>
               </div>
             )}
          </div>
        </div>

      </div>
    </div>
  );
};
