
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName } from "../types";
import { decodeBase64ToUint8Array, decodePCMToAudioBuffer, mergeAudioBuffers, audioBufferToWav } from "../utils/audioUtils";

export class TTSService {
  private ai: GoogleGenAI;
  private audioContext: AudioContext;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  }

  /**
   * Split text into manageable chunks
   */
  private chunkText(text: string, maxWords: number = 800): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += maxWords) {
      chunks.push(words.slice(i, i + maxWords).join(' '));
    }
    return chunks;
  }

  /**
   * Generates speech for a given text using a specified voice
   */
  async generateSpeech(
    text: string, 
    voice: VoiceName, 
    style: string = "natural and professional",
    onProgress?: (progress: number) => void
  ): Promise<{ blob: Blob; buffer: AudioBuffer }> {
    const chunks = this.chunkText(text);
    const audioBuffers: AudioBuffer[] = [];

    for (let i = 0; i < chunks.length; i++) {
      if (onProgress) onProgress((i / chunks.length) * 100);
      
      const prompt = `Style instruction: ${style}. Please say the following clearly: ${chunks[i]}`;
      
      try {
        const response = await this.ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) {
          throw new Error("No audio data returned from Gemini API");
        }

        const uint8Array = decodeBase64ToUint8Array(base64Audio);
        const buffer = await decodePCMToAudioBuffer(uint8Array, this.audioContext);
        audioBuffers.push(buffer);
      } catch (err: any) {
        console.error(`Error generating chunk ${i}:`, err);
        throw err;
      }
    }

    if (onProgress) onProgress(100);

    const mergedBuffer = mergeAudioBuffers(audioBuffers, this.audioContext);
    const wavBlob = audioBufferToWav(mergedBuffer);

    return {
      blob: wavBlob,
      buffer: mergedBuffer
    };
  }
}
