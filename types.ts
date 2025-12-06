export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isPartial?: boolean;
}

export interface StudyTopic {
  id: string;
  name: string;
  timestamp: Date;
  status: 'active' | 'completed';
  summary?: string;
}

export interface StudyStats {
  totalSessions: number;
  topicsCovered: number;
  lastTopic: string | null;
}

export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error',
}

// Audio Types for manual encoding/decoding
export interface PcmAudioBlob {
  data: string; // Base64 encoded
  mimeType: string;
}
