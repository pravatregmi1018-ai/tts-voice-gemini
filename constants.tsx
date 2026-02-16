
import { VoiceName, VoiceOption } from './types';

export const VOICE_OPTIONS: VoiceOption[] = [
  { id: VoiceName.ZEPHYR, name: 'Zephyr', description: 'Warm, helpful, and natural tone.', gender: 'neutral' },
  { id: VoiceName.KORE, name: 'Kore', description: 'Professional, articulate, and clear.', gender: 'female' },
  { id: VoiceName.PUCK, name: 'Puck', description: 'Energetic, youthful, and friendly.', gender: 'male' },
  { id: VoiceName.CHARON, name: 'Charon', description: 'Deep, resonant, and authoritative.', gender: 'male' },
  { id: VoiceName.FENRIR, name: 'Fenrir', description: 'Sophisticated, calm, and rhythmic.', gender: 'neutral' }
];

export const MAX_WORDS = 10000;
export const CHUNK_SIZE = 1000; // Words per API call for safety
