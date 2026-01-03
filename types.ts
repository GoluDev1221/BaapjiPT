export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Source {
  title: string;
  uri: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  image?: string; // Base64 data URL for displaying the image in chat
  sources?: Source[]; // Web sources from Google Search grounding
}

export enum PersonaId {
  BAMA = 'bama',
  GRDA = 'grda',
  DRUV = 'druv'
}

export interface Persona {
  id: PersonaId;
  name: string;
  tagline: string;
  description: string;
  avatarEmoji: string;
  color: string;
  systemInstruction: string;
  useSearch?: boolean; // Flag to enable Google Search for this persona
}

export interface ChatSession {
  id: string;
  messages: Message[];
  personaId: PersonaId;
  title: string;
}
