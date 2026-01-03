import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message, Role } from '../types';
import { GEMINI_MODEL } from '../constants';

// Safely access process.env.API_KEY to prevent ReferenceError in browser environments
let apiKey = '';
try {
  if (typeof process !== 'undefined' && process.env) {
    apiKey = process.env.API_KEY || '';
  }
} catch (e) {
  console.warn("Could not access process.env.API_KEY");
}

// Initialize with a fallback to prevent immediate crash, though API calls will fail if key is invalid
const ai = new GoogleGenAI({ apiKey: apiKey || 'MISSING_API_KEY' });

export const createChatSession = (systemInstruction: string): Chat => {
  return ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.9, // Higher creativity for personas
      topK: 40,
      topP: 0.95,
    },
  });
};

export const sendMessageStream = async (
  chat: Chat, 
  message: string, 
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    const resultStream = await chat.sendMessageStream({ message });
    
    let fullText = '';
    
    for await (const chunk of resultStream) {
       const c = chunk as GenerateContentResponse;
       const chunkText = c.text;
       if (chunkText) {
         fullText += chunkText;
         onChunk(chunkText);
       }
    }
    
    return fullText;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};
