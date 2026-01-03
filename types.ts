export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
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
}

export interface ChatSession {
  id: string;
  messages: Message[];
  personaId: PersonaId;
  title: string;
}