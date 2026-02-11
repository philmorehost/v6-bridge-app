
import React from 'react';
import { SMSLog } from '../types';
import { ICONS } from '../constants';
import { RefreshCw, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

interface SMSFeedProps {
  logs: SMSLog[];
}

export const SMSFeed: React.FC<SMSFeedProps> = ({ logs }) => {
  return (
    <div className="space-y-4">
      {logs.length === 0 ? (
        <div className="text-center py-20 glass rounded-[32px] border-dashed border-white/5">
          <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="text-white/20 animate-spin-slow" size={24} />
          </div>
          <p className="text-sm font-medium text-white/30">Monitoring encrypted channels...</p>
        </div>
      ) : (
        logs.map((log) => (
          <div 
            key={log.id} 
            className={`relative group overflow-hidden flex flex-col p-5 rounded-[24px] transition-all duration-500 border ${
              log.status === 'success' 
                ? 'bg-white/5 border-white/10' 
                : log.status === 'failed' 
                ? 'bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(235,87,87,0.05)]' 
                : 'bg-orange-500/10 border-orange-500/20 shadow-[0_0_20px_rgba(242,153,74,0.1)]'
            }`}
          >
            {/* Background Glow for Status */}
            <div className={`absolute -right-4 -top-4 w-24 h-24 blur-3xl rounded-full opacity-20 ${
              log.status === 'success' ? 'bg-blue-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-orange-500'
            }`} />

            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  log.status === 'success' ? 'bg-blue-500/10 text-blue-400' : log.status === 'failed' ? 'bg-red-500/10 text-red-400' : 'bg-orange-500/10 text-orange-400'
                }`}>
                  {log.status === 'success' ? <CheckCircle size={20} /> : log.status === 'failed' ? <AlertTriangle size={20} /> : <RefreshCw size={20} className="animate-spin" />}
                </div>
                <div>
                  <h4 className="font-black text-white text-sm tracking-tight">{log.sender}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-white/40">{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="w-1 h-1 rounded-full bg-white/10" />
                    <span className="text-[10px] font-bold text-blue-400/80 uppercase tracking-widest">{log.simNickname}</span>
                  </div>
                </div>
              </div>

              {log.status === 'queued' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
                  <span className="text-[9px] font-black text-orange-400 uppercase tracking-tighter">Retrying</span>
                </div>
              )}
            </div>

            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-3 border border-white/5 mb-4">
              <p className="text-xs text-white/80 leading-relaxed font-medium">
                {log.message}
              </p>
            </div>
            
            <div className="flex items-center justify-between relative z-10">
               <div className="flex items-center gap-2">
                 <div className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                   log.status === 'success' ? 'bg-green-500/20 text-green-400' : log.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-orange-500/20 text-orange-400'
                 }`}>
                   {log.status}
                 </div>
                 {log.retries > 0 && (
                   <span className="text-[9px] font-bold text-white/30 uppercase">
                     Attempt {log.retries + 1}
                   </span>
                 )}
               </div>
               
               {log.status === 'success' && (
                 <div className="flex items-center gap-1 text-[9px] font-bold text-green-400/60 uppercase">
                   <CheckCircle size={10} /> Forwarded
                 </div>
               )}
            </div>
          </div>
        ))
      )}
    </div>
  );
};
