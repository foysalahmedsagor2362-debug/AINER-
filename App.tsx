import React from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import { ConnectionStatus } from './types';
import Orb from './components/Orb';
import Visualizer from './components/Visualizer';
import ChatInterface from './components/ChatInterface';
import StudyTracker from './components/StudyTracker';

const App: React.FC = () => {
  const { connect, disconnect, status, messages, topics, volume } = useGeminiLive();

  const handleToggleConnection = () => {
    if (status === ConnectionStatus.CONNECTED || status === ConnectionStatus.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-cyan-500/30 relative">
      {/* Background Gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-7xl mx-auto h-screen p-4 flex flex-col md:flex-row gap-6">
        
        {/* Left Column: Visuals & Controls */}
        <div className="flex-1 flex flex-col justify-between">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center font-bold text-black">
              AI
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Neon Tutor</h1>
              <p className="text-xs text-gray-400">Powered by Gemini Live</p>
            </div>
          </div>

          {/* Visualizer Stage */}
          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[300px]">
             <Visualizer active={status === ConnectionStatus.CONNECTED} />
             <Orb status={status} volume={volume} />
             
             <div className="mt-8 text-center">
               <p className="text-sm font-medium tracking-widest text-cyan-300 uppercase opacity-80 animate-pulse">
                 {status === ConnectionStatus.DISCONNECTED && "Ready to Start"}
                 {status === ConnectionStatus.CONNECTING && "Establishing Link..."}
                 {status === ConnectionStatus.CONNECTED && "Listening & Analyzing"}
                 {status === ConnectionStatus.ERROR && "Connection Error"}
               </p>
             </div>
          </div>

          {/* Controls */}
          <div className="flex justify-center pb-8">
            <button
              onClick={handleToggleConnection}
              className={`
                group relative px-8 py-4 rounded-full font-semibold transition-all duration-300
                flex items-center gap-3 shadow-lg hover:shadow-cyan-500/20
                ${status === ConnectionStatus.CONNECTED 
                  ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20' 
                  : 'bg-white text-black hover:scale-105'
                }
              `}
            >
              {status === ConnectionStatus.CONNECTED ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  End Session
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 9.375v1.875h3.75a.75.75 0 010 1.5h-9a.75.75 0 010-1.5h3.75v-1.875A6.751 6.751 0 015.25 12.75v-1.5a.75.75 0 01.75-.75z" />
                  </svg>
                  Start Studying
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Dashboard */}
        <div className="flex-1 md:max-w-md flex flex-col gap-4 h-[40vh] md:h-full">
           <div className="flex-1 min-h-0">
             <ChatInterface messages={messages} />
           </div>
           <div className="h-1/3 min-h-[200px]">
             <StudyTracker topics={topics} />
           </div>
        </div>

      </div>
    </div>
  );
};

export default App;
