import React, { useState, useEffect, useRef } from 'react';
import { Chat } from "@google/genai";
import { Sidebar } from './components/Sidebar';
import { ChatBubble } from './components/ChatBubble';
import { PersonaId, Message, Role, Persona } from './types';
import { PERSONAS, INITIAL_GREETINGS } from './constants';
import { createChatSession, sendMessageStream } from './services/geminiService';

const App: React.FC = () => {
  const [currentPersonaId, setCurrentPersonaId] = useState<PersonaId>(PersonaId.DRUV);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Refs for managing chat session and auto-scroll
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentPersona = PERSONAS[currentPersonaId];

  // Initialize or reset chat when persona changes
  useEffect(() => {
    // Start fresh
    const initialGreeting: Message = {
      id: 'init-1',
      role: Role.MODEL,
      text: INITIAL_GREETINGS[currentPersonaId],
      timestamp: Date.now()
    };
    
    setMessages([initialGreeting]);
    chatSessionRef.current = createChatSession(currentPersona.systemInstruction);
  }, [currentPersonaId, currentPersona.systemInstruction]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputText.trim() || isLoading || !chatSessionRef.current) return;

    const userMessageText = inputText.trim();
    setInputText(''); // Clear input immediately
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userMessageText,
      timestamp: Date.now()
    };

    // Add user message to UI
    setMessages(prev => [...prev, userMessage]);

    // Create a placeholder for the bot response
    const botMessageId = (Date.now() + 1).toString();
    const botMessagePlaceholder: Message = {
      id: botMessageId,
      role: Role.MODEL,
      text: '', // Start empty
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, botMessagePlaceholder]);

    try {
      await sendMessageStream(
        chatSessionRef.current,
        userMessageText,
        (chunkText) => {
          // Update the specific bot message in state with the new chunk
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, text: msg.text + chunkText }
              : msg
          ));
        }
      );
    } catch (error) {
      console.error("Failed to send message", error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: "**Error:** Baapji is currently unreachable. Check your connection or API Key." }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen w-full bg-brand-dark overflow-hidden font-sans">
      
      {/* Sidebar Navigation */}
      <Sidebar 
        currentPersonaId={currentPersonaId}
        onSelectPersona={setCurrentPersonaId}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-full relative">
        
        {/* Header (Mobile Only / Status) */}
        <header className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 bg-brand-dark/95 backdrop-blur z-10">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden text-white p-2 -ml-2 hover:bg-white/5 rounded-lg"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
          </button>
          
          <div className="flex flex-col items-center mx-auto md:mx-0 md:items-start">
             <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{currentPersona.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] bg-white/10 ${currentPersona.color} border border-white/5`}>
                  {currentPersona.tagline}
                </span>
             </div>
          </div>
          
          <div className="w-8 md:w-auto" /> {/* Spacer */}
        </header>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-2">
           <div className="max-w-3xl mx-auto w-full pb-4">
              {messages.map((msg) => (
                <ChatBubble 
                  key={msg.id} 
                  message={msg} 
                  persona={currentPersona} 
                />
              ))}
              {isLoading && (
                 <div className="flex items-center gap-2 text-brand-muted text-sm ml-12 animate-pulse">
                    <span>{currentPersona.avatarEmoji}</span>
                    <span>Typing...</span>
                 </div>
              )}
              <div ref={messagesEndRef} />
           </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-brand-dark/95 backdrop-blur border-t border-white/5">
          <div className="max-w-3xl mx-auto w-full">
            <div className="relative flex items-end gap-2 bg-brand-panel border border-white/10 rounded-2xl p-2 focus-within:border-brand-accent/50 focus-within:ring-1 focus-within:ring-brand-accent/20 transition-all shadow-lg">
              
              <button className="p-2 text-brand-muted hover:text-white transition-colors rounded-lg hover:bg-white/5" title="Upload Image (Coming Soon)">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
              </button>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${currentPersona.name}...`}
                className="flex-1 max-h-32 bg-transparent text-white placeholder-zinc-500 focus:outline-none resize-none py-2 px-1 text-sm md:text-base scrollbar-hide"
                rows={1}
                style={{ minHeight: '44px' }}
              />

              <button 
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
                  inputText.trim() && !isLoading
                    ? 'bg-brand-accent text-white hover:bg-purple-600 shadow-lg shadow-purple-900/20' 
                    : 'bg-white/5 text-zinc-600 cursor-not-allowed'
                }`}
              >
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-zinc-600 mt-2">
              BaapjiPT can make mistakes. Roast responsibly.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
};

export default App;