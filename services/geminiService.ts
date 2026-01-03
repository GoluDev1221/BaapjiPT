import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message, Role } from '../types';
import { GEMINI_MODEL } from '../constants';

const apiKey = process.env.API_KEY;

if (!apiKey) {
  console.error("API_KEY is missing from environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || '' });

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