import { useState, useRef, useCallback, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, FunctionDeclaration, Type } from '@google/genai';
import { ConnectionStatus, Message, StudyTopic } from '../types';
import { decodeAudioData, createPcmBlob, base64ToUint8Array } from '../utils/audioUtils';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';

// Tool Definition for Study Tracking
const trackTopicFunction: FunctionDeclaration = {
  name: 'trackTopic',
  description: 'Log a new study topic or subject that the user is currently learning about.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      topicName: {
        type: Type.STRING,
        description: 'The name of the topic or subject (e.g., "Photosynthesis", "Linear Algebra").',
      },
      summary: {
        type: Type.STRING,
        description: 'A very brief one-sentence summary of what is being studied.',
      }
    },
    required: ['topicName'],
  },
};

export const useGeminiLive = () => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [messages, setMessages] = useState<Message[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [volume, setVolume] = useState<number>(0); // 0 to 1 for visualizer
  
  // Refs for audio and session management
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Initialize Audio Contexts
  const ensureAudioContexts = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    if (!inputContextRef.current) {
      inputContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    }
  };

  const connect = async () => {
    if (!process.env.API_KEY) {
      console.error("API Key missing");
      setStatus(ConnectionStatus.ERROR);
      return;
    }

    try {
      setStatus(ConnectionStatus.CONNECTING);
      ensureAudioContexts();
      
      // Resume contexts if suspended (browser policy)
      if (audioContextRef.current?.state === 'suspended') await audioContextRef.current.resume();
      if (inputContextRef.current?.state === 'suspended') await inputContextRef.current.resume();

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Setup Input Processing (Mic -> Gemini)
      const inputCtx = inputContextRef.current!;
      const source = inputCtx.createMediaStreamSource(stream);
      // Buffer size 4096 gives good balance of latency/performance for ScriptProcessor
      const processor = inputCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for visualizer
        let sum = 0;
        for(let i=0; i<inputData.length; i++) sum += inputData[i] * inputData[i];
        const rms = Math.sqrt(sum / inputData.length);
        setVolume(v => Math.max(rms * 5, v * 0.9)); // Smooth decay

        // Send to Gemini
        const pcmBlob = createPcmBlob(inputData);
        if (sessionPromiseRef.current) {
          sessionPromiseRef.current.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
          }).catch(err => console.error("Send Error:", err));
        }
      };

      source.connect(processor);
      processor.connect(inputCtx.destination);

      // Connect to Gemini Live
      sessionPromiseRef.current = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: `You are an advanced, futuristic AI Tutor. 
          Your voice should be warm, encouraging, and clear.
          Your goal is to help the user study, explain complex concepts simply, and quiz them if asked.
          You have a tool 'trackTopic'. Call this tool whenever the user starts a new specific subject or when you summarize a key concept they just learned.
          Be concise in your spoken responses unless asked to elaborate.`,
          tools: [{ functionDeclarations: [trackTopicFunction] }],
          inputAudioTranscription: {}, // Enable user transcription
          outputAudioTranscription: {}, // Enable model transcription for UI
        },
        callbacks: {
          onopen: () => {
            setStatus(ConnectionStatus.CONNECTED);
            setMessages([{
              id: 'init',
              role: 'ai',
              text: "System Online. I am your AI Tutor. What shall we study today?",
              timestamp: new Date()
            }]);
          },
          onmessage: async (msg: LiveServerMessage) => {
            handleServerMessage(msg);
          },
          onclose: () => {
            setStatus(ConnectionStatus.DISCONNECTED);
          },
          onerror: (err) => {
            console.error("Gemini Error:", err);
            setStatus(ConnectionStatus.ERROR);
          }
        }
      });

    } catch (e) {
      console.error("Connection Failed", e);
      setStatus(ConnectionStatus.ERROR);
    }
  };

  const handleServerMessage = async (msg: LiveServerMessage) => {
    const { serverContent, toolCall } = msg;

    // 1. Handle Audio Output
    const audioData = serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && audioContextRef.current) {
      const ctx = audioContextRef.current;
      const rawBytes = base64ToUint8Array(audioData);
      const buffer = await decodeAudioData(rawBytes, ctx);
      
      // Simple visualizer update from output
      setVolume(0.5 + Math.random() * 0.3); 

      // Schedule playback
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const destination = ctx.createGain(); // Use gain for volume control if needed
      destination.connect(ctx.destination);
      source.connect(destination);

      const currentTime = ctx.currentTime;
      // Ensure smooth playback sequence
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += buffer.duration;
      
      sourcesRef.current.add(source);
      source.onended = () => {
        sourcesRef.current.delete(source);
        if (sourcesRef.current.size === 0) setVolume(0); // Reset visualizer
      };
    }

    // 2. Handle Text Transcriptions (UI Chat)
    if (serverContent?.modelTurn?.parts?.[0]?.text) {
        // Usually Live API sends text in chunks if configured differently, 
        // but with Modality.AUDIO + outputAudioTranscription, we look for transcription fields.
    }
    
    // Handle Input Transcription (User Text)
    if (serverContent?.inputTranscription) {
       const text = serverContent.inputTranscription.text;
       if (text) {
          addMessage('user', text, true); // true = complete
       }
    }

    // Handle Output Transcription (AI Text)
    if (serverContent?.outputTranscription) {
        const text = serverContent.outputTranscription.text;
        if (text) {
            addMessage('ai', text, false); // false = might be partial, but for simplicity treat as stream append
        }
    }

    if (serverContent?.turnComplete) {
       // Finalize messages if we were doing partial updates
    }

    // 3. Handle Tool Calls (Study Tracking)
    if (toolCall) {
      for (const fc of toolCall.functionCalls) {
        if (fc.name === 'trackTopic') {
          const args = fc.args as any;
          const newTopic: StudyTopic = {
            id: Date.now().toString(),
            name: args.topicName,
            status: 'active',
            timestamp: new Date(),
            summary: args.summary
          };
          setTopics(prev => [newTopic, ...prev]);
          
          // Send response back to model
          if (sessionPromiseRef.current) {
            sessionPromiseRef.current.then(session => {
              session.sendToolResponse({
                functionResponses: {
                  id: fc.id,
                  name: fc.name,
                  response: { result: "Topic tracked successfully." }
                }
              });
            });
          }
        }
      }
    }
  };

  const addMessage = (role: 'user' | 'ai', text: string, isComplete: boolean) => {
    setMessages(prev => {
        const lastMsg = prev[prev.length - 1];
        // If the last message was from the same role and generated < 1 second ago, append (simple debounce)
        // Note: For a robust app, we'd use IDs. Here we append to keep the chat log clean.
        if (lastMsg && lastMsg.role === role && !lastMsg.isPartial && !isComplete) {
             // For streaming text updates
             return prev.map((m, i) => i === prev.length - 1 ? { ...m, text: m.text + text } : m);
        }
        
        return [...prev, {
            id: Date.now().toString(),
            role,
            text,
            timestamp: new Date(),
            isPartial: !isComplete
        }];
    });
  };

  const disconnect = () => {
    // Stop Mic
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    // Stop Audio Output
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();

    // Close Session
    // Note: The SDK doesn't expose a clean .close() on the session object easily if we don't store the session, 
    // but the sessionPromise resolves to it.
    // However, simply reloading or unmounting handles most cleanup in this demo scope. 
    // Ideally: session.close() if available in type.
    
    setStatus(ConnectionStatus.DISCONNECTED);
    setVolume(0);
    nextStartTimeRef.current = 0;
  };

  return {
    connect,
    disconnect,
    status,
    messages,
    topics,
    volume
  };
};
