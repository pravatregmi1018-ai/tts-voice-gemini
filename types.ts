
export enum VoiceName {
  ZEPHYR = 'Zephyr',
  PUCK = 'Puck',
  CHARON = 'Charon',
  KORE = 'Kore',
  FENRIR = 'Fenrir'
}

export interface VoiceOption {
  id: VoiceName;
  name: string;
  description: string;
  gender: 'male' | 'female' | 'neutral';
}

export interface GeneratedSpeech {
  id: string;
  text: string;
  voice: VoiceName;
  timestamp: number;
  duration?: number;
  audioBlob: Blob;
  audioUrl: string;
}

export interface TTSState {
  status: 'idle' | 'processing' | 'success' | 'error';
  progress: number;
  message: string;
}
