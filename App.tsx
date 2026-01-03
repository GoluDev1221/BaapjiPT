import React, { useState, useEffect, useRef } from 'react';
import { Chat } from "@google/genai";
import { Sidebar } from './components/Sidebar';
import { ChatBubble } from './components/ChatBubble';
import { PersonaId, Message, Role, Persona } from './types';
import { PERSONAS, INITIAL_GREETINGS } from './constants';
import { createChatSession, sendMessageStream, hasValidApiKey } from './services/geminiService';

const App: React.FC = () => {
  const [currentPersonaId, setCurrentPersonaId] = useState<PersonaId>(PersonaId.DRUV);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);
  
  // Refs
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentPersona = PERSONAS[currentPersonaId];

  // Check for API key on mount
  useEffect(() => {
    setIsApiKeyMissing(!hasValidApiKey());
  }, []);

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
    setSelectedImage(null);
    
    // Pass the useSearch flag to the service
    chatSessionRef.current = createChatSession(
      currentPersona.systemInstruction, 
      currentPersona.useSearch
    );
    
    // Focus input on persona switch
    if (!isSidebarOpen) {
       inputRef.current?.focus();
    }
  }, [currentPersonaId, currentPersona.systemInstruction, currentPersona.useSearch]);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading, selectedImage]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        // Focus back on text input to add a caption
        inputRef.current?.focus();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    // Allow sending if there is text OR an image
    if ((!inputText.trim() && !selectedImage) || isLoading || !chatSessionRef.current) return;

    const userMessageText = inputText.trim() || (selectedImage ? "Analyze this image" : "...");
    const imageToSend = selectedImage;
    
    setInputText(''); 
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    setIsLoading(true);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userMessageText,
      image: imageToSend || undefined,
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
        imageToSend,
        (chunkText, sources) => {
          // Update the specific bot message in state with the new chunk AND sources
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { 
                  ...msg, 
                  text: msg.text + chunkText,
                  sources: sources || msg.sources // Preserve existing sources if current chunk has none
                }
              : msg
          ));
        }
      );
    } catch (error) {
      console.error("Failed to send message", error);
      const errorMessage = !hasValidApiKey() 
        ? "**Configuration Missing:** Please add `VITE_API_KEY` (or `NEXT_PUBLIC_API_KEY`) to your environment variables." 
        : "**Connection Error:** The API key exists but might be invalid or the service is unreachable. \n\n*Tip: If on Vercel, try renaming `API_KEY` to `VITE_API_KEY` in settings.*";
      
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: errorMessage }
          : msg
      ));
    } finally {
      setIsLoading(false);
      // Re-focus input after sending
      setTimeout(() => inputRef.current?.focus(), 100);
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
             {currentPersona.useSearch && (
               <span className="hidden md:block text-[10px] text-brand-success mt-0.5">● Internet Connected</span>
             )}
          </div>
          
          <div className="w-8 md:w-auto" /> {/* Spacer */}
        </header>

        {/* API Key Warning Banner */}
        {isApiKeyMissing && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center animate-pulse-fast">
            <p className="text-xs md:text-sm text-red-400 font-medium">
              ⚠️ <strong>Configuration Missing:</strong> Env var <code>VITE_API_KEY</code> (or <code>NEXT_PUBLIC_API_KEY</code>) is not found.
            </p>
          </div>
        )}

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
                 <div className="flex items-center gap-3 ml-14 mt-2">
                    <span className="text-xl animate-bounce" style={{ animationDelay: '0ms' }}>{currentPersona.avatarEmoji}</span>
                    <div className="flex space-x-1">
                      <div className={`w-2 h-2 rounded-full ${currentPersona.color.replace('text-', 'bg-')} animate-bounce`} style={{ animationDelay: '0ms' }}></div>
                      <div className={`w-2 h-2 rounded-full ${currentPersona.color.replace('text-', 'bg-')} animate-bounce`} style={{ animationDelay: '150ms' }}></div>
                      <div className={`w-2 h-2 rounded-full ${currentPersona.color.replace('text-', 'bg-')} animate-bounce`} style={{ animationDelay: '300ms' }}></div>
                    </div>
                 </div>
              )}
              <div ref={messagesEndRef} />
           </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-brand-dark/95 backdrop-blur border-t border-white/5">
          <div className="max-w-3xl mx-auto w-full">
            
            {/* Image Preview */}
            {selectedImage && (
              <div className="mb-3 flex items-start">
                <div className="relative group">
                  <img 
                    src={selectedImage} 
                    alt="Preview" 
                    className="h-20 w-20 object-cover rounded-xl border border-white/20"
                  />
                  <button 
                    onClick={handleRemoveImage}
                    className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 shadow-lg border border-white/10 hover:bg-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                </div>
              </div>
            )}

            <div className="relative flex items-end gap-2 bg-brand-panel border border-white/10 rounded-2xl p-2 focus-within:border-brand-accent/50 focus-within:ring-1 focus-within:ring-brand-accent/20 transition-all shadow-lg">
              
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 transition-colors rounded-lg hover:bg-white/5 ${selectedImage ? 'text-brand-accent' : 'text-brand-muted hover:text-white'}`}
                title="Upload Image"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
              </button>

              <textarea
                ref={inputRef}
                autoFocus
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedImage ? `Describe this to ${currentPersona.name}...` : `Message ${currentPersona.name}...`}
                className="flex-1 max-h-32 bg-transparent text-white placeholder-zinc-500 focus:outline-none resize-none py-2 px-1 text-sm md:text-base scrollbar-hide"
                rows={1}
                style={{ minHeight: '44px' }}
              />

              <button 
                onClick={() => handleSendMessage()}
                disabled={isLoading || (!inputText.trim() && !selectedImage)}
                className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
                  (inputText.trim() || selectedImage) && !isLoading
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
