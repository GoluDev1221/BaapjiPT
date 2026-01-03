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
  imageBase64: string | null,
  onChunk: (text: string) => void
): Promise<string> => {
  try {
    let msgPayload: any = message;

    // If there is an image, we must send a "Parts" array containing both the image and the text.
    if (imageBase64) {
      // Extract the actual base64 string (remove data:image/jpeg;base64, prefix)
      const base64Data = imageBase64.split(',')[1];
      const mimeType = imageBase64.split(';')[0].split(':')[1];

      msgPayload = [
        { text: message },
        { 
          inlineData: { 
            mimeType: mimeType, 
            data: base64Data 
          } 
        }
      ];
    }

    const resultStream = await chat.sendMessageStream({ message: msgPayload });
    
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
