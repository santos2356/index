import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Radio, Activity, Volume2 } from 'lucide-react';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../utils/audio';

interface LiveModeProps {
  apiKey: string;
}

const LiveMode: React.FC<LiveModeProps> = ({ apiKey }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Helper to stop all audio
  const stopAllAudio = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.suspend(); // Quickly silence
      audioSourcesRef.current.forEach(source => {
        try { source.stop(); } catch (e) {}
      });
      audioSourcesRef.current.clear();
      nextStartTimeRef.current = 0;
      audioContextRef.current.resume();
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    // Cleanup audio nodes
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    stopAllAudio();
    setIsConnected(false);
    setIsSpeaking(false);
  }, [stopAllAudio]);

  const handleConnect = async () => {
    if (isConnected) {
      handleDisconnect();
      return;
    }

    try {
      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioContextClass({ sampleRate: 24000 }); // Output at 24kHz for Gemini
      audioContextRef.current = audioCtx;
      
      const inputCtx = new AudioContextClass({ sampleRate: 16000 }); // Input at 16kHz for Gemini

      // Setup Gemini Client
      const ai = new GoogleGenAI({ apiKey });
      
      // Setup Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Connect to Live API
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log('Gemini Live Connected');
            setIsConnected(true);

            // Setup Microphone Stream
            const source = inputCtx.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            // Script Processor for PCM conversion
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createPcmBlob(inputData);
              
              // Send to Gemini
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              setIsSpeaking(true);
              
              const audioData = base64ToUint8Array(base64Audio);
              const audioBuffer = await decodeAudioData(
                  audioData, 
                  audioCtx, 
                  24000
              );

              // Schedule playback
              // Ensure we schedule in the future
              const now = audioCtx.currentTime;
              const startTime = Math.max(now, nextStartTimeRef.current);
              
              const source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtx.destination);
              
              source.onended = () => {
                audioSourcesRef.current.delete(source);
                if (audioSourcesRef.current.size === 0) {
                    setIsSpeaking(false);
                }
              };
              
              source.start(startTime);
              nextStartTimeRef.current = startTime + audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }

            // Handle Interruption
            if (message.serverContent?.interrupted) {
                console.log('Interrupted!');
                stopAllAudio();
                setIsSpeaking(false);
            }
          },
          onclose: () => {
            console.log('Gemini Live Closed');
            handleDisconnect();
          },
          onerror: (err) => {
            console.error('Gemini Live Error', err);
            handleDisconnect();
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          },
          systemInstruction: "You are a helpful, quick-witted, and conversational voice assistant. Keep answers concise.",
        }
      });

    } catch (error) {
      console.error('Connection failed', error);
      handleDisconnect();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center space-y-12">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-white tracking-tight">Gemini Live Voice</h2>
        <p className="text-neutral-400 max-w-md mx-auto">
          Have a real-time, low-latency conversation with Gemini. 
          Interrupt at any time.
        </p>
      </div>

      <div className="relative">
        {/* Visualizer Circles */}
        {isConnected && (
            <>
            <div className={`absolute inset-0 bg-blue-500/20 rounded-full blur-3xl transition-all duration-300 ${isSpeaking ? 'scale-150 opacity-100' : 'scale-100 opacity-50'}`}></div>
            <div className={`absolute inset-0 bg-indigo-500/20 rounded-full blur-2xl transition-all duration-500 delay-75 ${isSpeaking ? 'scale-125 opacity-100' : 'scale-90 opacity-40'}`}></div>
            </>
        )}

        <button
          onClick={handleConnect}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl border-4
            ${isConnected 
              ? 'bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20' 
              : 'bg-indigo-600 border-transparent text-white hover:bg-indigo-700 hover:scale-105'
            }`}
        >
          {isConnected ? <MicOff size={40} /> : <Mic size={40} />}
        </button>

        {/* Status Pill */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 whitespace-nowrap">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                isConnected 
                ? 'bg-green-900/30 border-green-800 text-green-400' 
                : 'bg-neutral-800 border-neutral-700 text-neutral-500'
            }`}>
                {isConnected ? (
                    <>
                        <Activity size={16} className="animate-pulse" />
                        <span className="text-sm font-medium">Live Connection Active</span>
                    </>
                ) : (
                    <>
                        <Radio size={16} />
                        <span className="text-sm font-medium">Ready to Connect</span>
                    </>
                )}
            </div>
        </div>
      </div>
        
       {/* Speaking Indicator */}
       <div className={`h-8 transition-opacity duration-300 flex items-center gap-2 text-indigo-400 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}>
          <Volume2 size={20} className="animate-pulse" />
          <span className="text-sm font-medium">Gemini is speaking...</span>
       </div>
    </div>
  );
};

export default LiveMode;