import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { Message, Role, Source } from '../types';
import { GEMINI_MODEL } from '../constants';

// Helper to check if API key is configured
export const hasValidApiKey = (): boolean => {
  try {
    return typeof process !== 'undefined' && !!process.env && !!process.env.API_KEY;
  } catch (e) {
    return false;
  }
};

// Helper to safely initialize the AI client
// We allow this to return a client with an empty key if env is missing, 
// so the UI can load. The actual API call will fail gracefully later if the key is missing.
const getAiClient = () => {
  let apiKey = '';
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      apiKey = process.env.API_KEY;
    }
  } catch (e) {
    console.warn("Could not access process.env");
  }
  return new GoogleGenAI({ apiKey });
};

export const createChatSession = (systemInstruction: string, useSearch: boolean = false): Chat => {
  const ai = getAiClient();
  const tools = useSearch ? [{ googleSearch: {} }] : undefined;
  
  return ai.chats.create({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.9,
      topK: 40,
      topP: 0.95,
      tools: tools,
    },
  });
};

export const sendMessageStream = async (
  chat: Chat, 
  message: string, 
  imageBase64: string | null,
  onUpdate: (text: string, sources?: Source[]) => void
): Promise<string> => {
  try {
    let msgPayload: any = message;

    // If there is an image, we must send a "Parts" array containing both the image and the text.
    if (imageBase64) {
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
    let collectedSources: Source[] = [];
    
    for await (const chunk of resultStream) {
       const c = chunk as GenerateContentResponse;
       const chunkText = c.text;
       
       // Extract Grounding Metadata (Sources)
       if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
         const chunks = c.candidates[0].groundingMetadata.groundingChunks;
         chunks.forEach((g: any) => {
           if (g.web) {
             collectedSources.push({
               title: g.web.title,
               uri: g.web.uri
             });
           }
         });
       }

       if (chunkText) {
         fullText += chunkText;
         // Pass unique sources to the callback
         const uniqueSources = Array.from(new Map(collectedSources.map(s => [s.uri, s])).values());
         onUpdate(chunkText, uniqueSources.length > 0 ? uniqueSources : undefined);
       }
    }
    
    return fullText;
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }
};
