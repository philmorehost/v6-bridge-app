
import React from 'react';
import { ICONS } from '../constants';

interface SimStatusProps {
  nickname: string;
  slot: number;
  isActive: boolean;
  signalStrength: number; // 0-100
}

export const SimStatus: React.FC<SimStatusProps> = ({ nickname, slot, isActive, signalStrength }) => {
  // Determine color based on signal strength
  const getSignalColor = (strength: number) => {
    if (strength < 20) return '#EB5757'; // Crimson
    if (strength < 40) return '#F2994A'; // Orange
    if (strength < 70) return '#F2C94C'; // Yellow
    return '#3B82F6'; // Electric Blue
  };

  const currentColor = getSignalColor(signalStrength);

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div 
          className="p-3 rounded-2xl flex items-center justify-center transition-colors duration-500"
          style={{ backgroundColor: isActive ? `${currentColor}15` : 'rgba(255,255,255,0.05)', color: isActive ? currentColor : 'rgba(255,255,255,0.2)' }}
        >
          {ICONS.SIM}
        </div>
        <div className="overflow-hidden">
          <p className="text-[9px] text-white/30 font-black uppercase tracking-[0.15em]">Slot {slot}</p>
          <p className="text-sm font-bold text-white truncate max-w-[140px]">{nickname || `SIM Slot ${slot}`}</p>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-1.5">
        <div className="flex gap-0.5 items-end h-5">
          {[...Array(10)].map((_, i) => {
            const barStrength = (i + 1) * 10;
            const isActiveBar = signalStrength >= barStrength;
            return (
              <div 
                key={i} 
                className="w-1 rounded-full transition-all duration-700"
                style={{ 
                  height: `${20 + (i * 8)}%`,
                  backgroundColor: isActive && isActiveBar ? currentColor : 'rgba(255,255,255,0.05)',
                  boxShadow: isActive && isActiveBar ? `0 0 8px ${currentColor}44` : 'none'
                }}
              />
            );
          })}
        </div>
        <div className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest border transition-all duration-500 ${isActive ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
          {isActive ? 'ACTIVE' : 'OFFLINE'}
        </div>
      </div>
    </div>
  );
};
