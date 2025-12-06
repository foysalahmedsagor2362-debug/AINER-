import React from 'react';
import { ConnectionStatus } from '../types';

interface OrbProps {
  status: ConnectionStatus;
  volume: number; // 0.0 to 1.0
}

const Orb: React.FC<OrbProps> = ({ status, volume }) => {
  // Base scale is 1, max scale adds volume factor
  const scale = 1 + Math.min(volume, 1.0) * 1.5; 
  
  let colorClass = "bg-gray-500";
  let pulseClass = "";

  if (status === ConnectionStatus.CONNECTING) {
    colorClass = "bg-yellow-400";
    pulseClass = "animate-pulse";
  } else if (status === ConnectionStatus.CONNECTED) {
    colorClass = "bg-cyan-400"; // AI standard color
    if (volume > 0.05) {
        colorClass = "bg-purple-500"; // Speaking/Listening active color
    }
  } else if (status === ConnectionStatus.ERROR) {
    colorClass = "bg-red-500";
  }

  return (
    <div className="relative flex items-center justify-center w-64 h-64">
      {/* Outer Glow */}
      <div 
        className={`absolute rounded-full opacity-30 blur-2xl transition-all duration-100 ease-out ${colorClass}`}
        style={{ width: `${120 * scale}px`, height: `${120 * scale}px` }}
      />
      
      {/* Core Orb */}
      <div 
        className={`relative z-10 w-32 h-32 rounded-full transition-all duration-100 ease-out shadow-2xl ${colorClass} ${pulseClass} flex items-center justify-center`}
        style={{ transform: `scale(${0.8 + (volume * 0.4)})` }}
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-white/20 to-transparent blur-sm" />
      </div>

      {/* Rings */}
      {status === ConnectionStatus.CONNECTED && (
        <>
            <div className="absolute w-48 h-48 border border-cyan-500/30 rounded-full animate-[spin_4s_linear_infinite]" />
            <div className="absolute w-56 h-56 border border-purple-500/20 rounded-full animate-[spin_10s_linear_infinite_reverse]" />
        </>
      )}
    </div>
  );
};

export default Orb;
