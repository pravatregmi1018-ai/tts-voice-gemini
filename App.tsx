
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TTSService } from './services/ttsService';
import { VoiceName, GeneratedSpeech, TTSState } from './types';
import { VOICE_OPTIONS, MAX_WORDS } from './constants';

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.ZEPHYR);
  const [styleInstruction, setStyleInstruction] = useState('Speak clearly with a natural pace and professional tone.');
  const [history, setHistory] = useState<GeneratedSpeech[]>([]);
  const [ttsState, setTtsState] = useState<TTSState>({
    status: 'idle',
    progress: 0,
    message: ''
  });

  const ttsServiceRef = useRef<TTSService | null>(null);

  useEffect(() => {
    ttsServiceRef.current = new TTSService();
  }, []);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const isTooLong = wordCount > MAX_WORDS;

  const handleGenerate = async () => {
    if (!text.trim() || !ttsServiceRef.current) return;
    if (isTooLong) {
      setTtsState({ status: 'error', progress: 0, message: `Text is too long (Max ${MAX_WORDS} words).` });
      return;
    }

    setTtsState({ status: 'processing', progress: 0, message: 'Initializing voice synthesizer...' });

    try {
      const { blob, buffer } = await ttsServiceRef.current.generateSpeech(
        text,
        selectedVoice,
        styleInstruction,
        (progress) => setTtsState(prev => ({ ...prev, progress, message: `Synthesizing audio: ${Math.round(progress)}%` }))
      );

      const url = URL.createObjectURL(blob);
      const newSpeech: GeneratedSpeech = {
        id: crypto.randomUUID(),
        text: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
        voice: selectedVoice,
        timestamp: Date.now(),
        duration: buffer.duration,
        audioBlob: blob,
        audioUrl: url
      };

      setHistory(prev => [newSpeech, ...prev]);
      setTtsState({ status: 'success', progress: 100, message: 'Speech generated successfully!' });
      
      // Clear after success
      setTimeout(() => setTtsState(prev => ({ ...prev, status: 'idle', progress: 0 })), 3000);
    } catch (err: any) {
      console.error(err);
      setTtsState({ 
        status: 'error', 
        progress: 0, 
        message: err.message || 'Failed to generate speech. Please check your API key and connection.' 
      });
    }
  };

  const downloadSpeech = (speech: GeneratedSpeech) => {
    const a = document.createElement('a');
    a.href = speech.audioUrl;
    a.download = `speech-${speech.voice}-${new Date(speech.timestamp).toLocaleDateString()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="py-8 px-6 max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold font-display bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
            Gemini Voice Studio
          </h1>
          <p className="text-slate-400 mt-2 font-medium">Professional Long-Form Text-to-Speech Synth</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map(i => (
              <img key={i} src={`https://picsum.photos/seed/face${i}/40/40`} className="w-10 h-10 rounded-full border-2 border-slate-900" alt="user" />
            ))}
          </div>
          <p className="text-sm text-slate-500 font-medium">Used by 10k+ creators</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input & Controls */}
        <div className="lg:col-span-8 space-y-6">
          <section className="glass rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-semibold uppercase tracking-wider text-slate-400">Content to Speak</label>
              <div className={`text-xs font-mono px-2 py-1 rounded ${isTooLong ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
                {wordCount} / {MAX_WORDS} words
              </div>
            </div>
            
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your script, article, or book chapter here... Supports up to 10,000 words across any language."
              className="w-full h-80 bg-transparent text-slate-100 placeholder-slate-600 border-none focus:ring-0 resize-none text-lg leading-relaxed custom-scrollbar"
            />

            <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300" style={{ width: `${(wordCount / MAX_WORDS) * 100}%` }} />
          </section>

          <section className="glass rounded-3xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-6">Voice Customization</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">Style & Emotional Tone</label>
                <input 
                  type="text"
                  value={styleInstruction}
                  onChange={(e) => setStyleInstruction(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="e.g. Exciting, somber, fast-paced, child-friendly..."
                />
                <p className="text-xs text-slate-500 italic">Describe how the AI should interpret your text.</p>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-slate-300">Voice Persona</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {VOICE_OPTIONS.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVoice(v.id)}
                      className={`px-3 py-2 rounded-xl border text-sm transition-all flex items-center justify-center gap-2 ${
                        selectedVoice === v.id 
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' 
                        : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${selectedVoice === v.id ? 'bg-indigo-400 animate-pulse' : 'bg-slate-600'}`} />
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="flex items-center gap-4">
            <button
              onClick={handleGenerate}
              disabled={ttsState.status === 'processing' || !text.trim() || isTooLong}
              className={`flex-1 relative group overflow-hidden rounded-2xl py-5 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 transition-all" />
              <span className="relative text-white font-bold text-lg tracking-wide flex items-center justify-center gap-3">
                {ttsState.status === 'processing' ? (
                  <>
                    <svg className="animate-spin h-6 w-6 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Synthesizing...
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Generate Speech
                  </>
                )}
              </span>
            </button>
          </div>

          {/* Status Message */}
          {ttsState.status !== 'idle' && (
            <div className={`p-4 rounded-2xl flex items-center gap-3 border transition-all ${
              ttsState.status === 'error' ? 'bg-red-500/10 border-red-500/50 text-red-400' : 
              ttsState.status === 'success' ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' :
              'bg-indigo-500/10 border-indigo-500/50 text-indigo-400'
            }`}>
              <div className="flex-1">
                <p className="font-semibold text-sm">{ttsState.message}</p>
                {ttsState.status === 'processing' && (
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300" 
                      style={{ width: `${ttsState.progress}%` }} 
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Library / Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          <section className="glass rounded-3xl p-6 flex flex-col h-[700px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Library</h3>
              <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-tighter">
                {history.length} Clips
              </span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-slate-800 rounded-2xl">
                  <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-slate-400 font-semibold mb-1">No audio yet</h4>
                  <p className="text-sm text-slate-600">Your generated speech will appear here for playback and download.</p>
                </div>
              ) : (
                history.map((speech) => (
                  <div key={speech.id} className="group bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{speech.voice}</span>
                      <span className="text-[10px] text-slate-500 font-mono">{new Date(speech.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-xs text-slate-300 line-clamp-2 mb-4 italic leading-relaxed">
                      "{speech.text}"
                    </p>
                    <div className="flex items-center gap-2">
                      <audio controls src={speech.audioUrl} className="h-8 flex-1 rounded-full audio-mini" />
                      <button 
                        onClick={() => downloadSpeech(speech)}
                        className="p-2 bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white rounded-xl transition-colors"
                        title="Download WAV"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="glass rounded-3xl p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
            <h4 className="text-white font-bold mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13.536 14.95a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM6.464 14.95a1 1 0 00-1.414 0l-.707.707a1 1 0 001.414 1.414l.707-.707a1 1 0 000-1.414z" />
              </svg>
              Pro Tip
            </h4>
            <p className="text-sm text-slate-400 leading-relaxed">
              Use <span className="text-indigo-300 font-mono">Style Instructions</span> to get specialized outputs like "Speak like an excited sports commentator" or "Read this as a soothing bedtime story".
            </p>
          </section>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        .audio-mini::-webkit-media-controls-panel {
          background-color: #1e293b;
        }
        .audio-mini::-webkit-media-controls-current-time-display,
        .audio-mini::-webkit-media-controls-time-remaining-display {
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;
