import React from 'react';
import { Persona, PersonaId } from '../types';
import { PERSONAS } from '../constants';

interface SidebarProps {
  currentPersonaId: PersonaId;
  onSelectPersona: (id: PersonaId) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentPersonaId, onSelectPersona, isOpen, onToggle }) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-20 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onToggle}
      />

      {/* Sidebar Content */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-30 w-72 bg-brand-panel border-r border-white/5 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} flex flex-col`}
      >
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <img 
            src="https://api.dicebear.com/9.x/avataaars/svg?seed=Baapji&backgroundColor=b6e3f4" 
            alt="BaapjiPT Logo" 
            className="w-12 h-12 rounded-xl shadow-lg border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-accent to-pink-500 truncate">
              BaapjiPT
            </h1>
            <p className="text-xs text-brand-muted truncate">Meme-Grade Intelligence</p>
          </div>
          <button onClick={onToggle} className="md:hidden text-brand-muted hover:text-white flex-shrink-0 ml-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          <div>
            <h3 className="text-xs font-semibold text-brand-muted uppercase tracking-wider mb-3 px-2">Select Personality</h3>
            <div className="space-y-2">
              {(Object.values(PERSONAS) as Persona[]).map((persona) => (
                <button
                  key={persona.id}
                  onClick={() => {
                    onSelectPersona(persona.id);
                    if (window.innerWidth < 768) onToggle();
                  }}
                  className={`w-full flex items-start p-3 rounded-xl transition-all duration-200 border ${
                    currentPersonaId === persona.id 
                      ? 'bg-white/10 border-brand-accent/50 shadow-lg shadow-brand-accent/10' 
                      : 'hover:bg-white/5 border-transparent'
                  }`}
                >
                  <span className="text-2xl mr-3">{persona.avatarEmoji}</span>
                  <div className="text-left">
                    <div className={`font-semibold ${persona.color}`}>{persona.name}</div>
                    <div className="text-xs text-brand-muted leading-tight mt-1">{persona.tagline}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="px-2">
             <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-white/10">
                <h4 className="text-sm font-bold text-white mb-2">Upgrade to Baapji+</h4>
                <p className="text-xs text-brand-muted mb-3">Get faster roasts and flirty responses.</p>
                <button className="w-full py-2 px-3 bg-white text-black text-xs font-bold rounded-lg hover:bg-gray-200 transition-colors">
                  Coming Soon
                </button>
             </div>
          </div>

        </div>

        <div className="p-4 border-t border-white/5 text-center">
           <p className="text-xs text-brand-muted">Powered by Gemini 3.0</p>
        </div>
      </aside>
    </>
  );
};
