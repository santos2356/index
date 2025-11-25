export enum Tab {
  CHAT = 'CHAT',
  VISION = 'VISION',
  IMAGE_GEN = 'IMAGE_GEN',
  LIVE = 'LIVE'
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

export interface VisionState {
  image: string | null; // Base64
  prompt: string;
  response: string;
  isLoading: boolean;
}

export interface ImageGenState {
  prompt: string;
  generatedImage: string | null; // Base64
  isLoading: boolean;
}

// Live API Types
export interface LiveConfig {
  model: string;
  systemInstruction?: string;
  voiceName?: string;
}
