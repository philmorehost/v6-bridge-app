import React, { useState, useEffect } from 'react';
import { SMSLog, GatewayConfig } from './types';
import { GlassCard } from './components/GlassCard';
import { SMSFeed } from './components/SMSFeed';
import { SimStatus } from './components/SimStatus';
import { SetupWizard } from './components/SetupWizard';
import { 
  LayoutDashboard, 
  Settings, 
  Activity, 
  Globe, 
  Zap, 
  Terminal, 
  Wifi, 
  Fingerprint,
  RefreshCw,
  Smartphone,
  ShieldCheck,
  Cpu,
  Trash2,
  Lock,
  Database
} from 'lucide-react';

const INITIAL_CONFIG: GatewayConfig = {
  webhookUrl: 'https://v6.datagifting.com.ng/web/api/endpoint.php',
  secretKey: 'ff28521272bfef24ac887ebc75758aba',
  authorizedSenders: [],
  isSenderRestrictionEnabled: true,
  simNicknames: {
    slot1: 'SIM 1: MTN',
    slot2: 'SIM 2: AIRTEL',
  },
};

declare global {
  interface Window {
    NativeBridge?: {
      saveConfig: (url: string, key: string, sim1: string, sim2: string) => void;
    };
    onNativeSmsReceived?: (sender: string, message: string, sim: string) => void;
  }
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'settings'>('home');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isServiceActive, setIsServiceActive] = useState(true);
  const [config, setConfig] = useState<GatewayConfig>(INITIAL_CONFIG);
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'online' | 'error'>('idle');
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const [stats, setStats] = useState({
    totalReceived: 0,
    successfulForwards: 0,
    activeRetries: 0,
    uptimeSeconds: 0,
  });

  useEffect(() => {
    // Communication link from Kotlin layer
    window.onNativeSmsReceived = (sender, message, sim) => {
      const newLog: SMSLog = {
        id: Math.random().toString(36).substr(2, 9),
        sender,
        message,
        simNickname: sim,
        timestamp: new Date(),
        status: 'success',
        retries: 0
      };
      setLogs(prev => [newLog, ...prev].slice(0, 50));
      setStats(prev => ({ 
        ...prev, 
        totalReceived: prev.totalReceived + 1,
        successfulForwards: prev.successfulForwards + 1 
      }));
      setWebhookStatus('online');
      
      if ('vibrate' in navigator) navigator.vibrate(40);
      setTimeout(() => setWebhookStatus('idle'), 3000);
    };
    return () => { window.onNativeSmsReceived = undefined; };
  }, []);

  useEffect(() => {
    let timer: number;
    if (isServiceActive) {
      timer = window.setInterval(() => {
        setStats(prev => ({ ...prev, uptimeSeconds: prev.uptimeSeconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isServiceActive]);

  const handleSaveToNative = () => {
    setIsSyncing(true);
    if (window.NativeBridge) {
      setTimeout(() => {
        window.NativeBridge!.saveConfig(
          config.webhookUrl, 
          config.secretKey, 
          config.simNicknames.slot1, 
          config.simNicknames.slot2
        );
        setIsSyncing(false);
        setIsServiceActive(true);
      }, 1500);
    } else {
      setTimeout(() => {
        setIsSyncing(false);
        setIsServiceActive(true);
      }, 1000);
    }
  };

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true);
    try {
      const response = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: "TEST", secret: config.secretKey })
      });
      setWebhookStatus(response.ok ? 'online' : 'error');
    } catch (e) {
      setWebhookStatus('error');
    } finally {
      setTimeout(() => setIsTestingWebhook(false), 800);
    }
  };

  if (!isSetupComplete) {
    return <SetupWizard onComplete={() => setIsSetupComplete(true)} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#0A0E17] overflow-hidden select-none">
      {/* Dynamic Background Blurs */}
      <div className="absolute top-[-10%] left-[-20%] w-[120%] h-[50%] bg-blue-600/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="flex-1 overflow-y-auto px-6 pt-12 pb-32 no-scrollbar relative z-10">
        
        <header className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className={`w-7 h-7 bg-blue-600 rounded-xl flex items-center justify-center ${isServiceActive ? 'animate-pulse shadow-[0_0_20px_#2563eb66]' : ''}`}>
                <Zap size={16} className="text-white fill-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white uppercase italic">DGV6<span className="text-blue-500 not-italic ml-1">BRIDGE</span></h1>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <span className={`w-2 h-2 rounded-full ${isServiceActive ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-red-500'} animate-pulse`} />
              <span className="text-[10px] uppercase font-black text-white/40 tracking-[0.25em]">
                {isServiceActive ? 'Secure Link Active' : 'System Standby'}
              </span>
            </div>
          </div>
          <button onClick={() => { if ('vibrate' in navigator) navigator.vibrate(15); setActiveTab('settings'); }} className="w-14 h-14 glass rounded-3xl flex items-center justify-center text-blue-400 border border-white/10 shadow-2xl active:scale-90 transition-transform">
            <Fingerprint size={32} />
          </button>
        </header>

        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <GlassCard className={`!p-6 transition-all duration-1000 ${webhookStatus === 'online' ? 'border-green-500/40 bg-green-500/5 shadow-[0_0_30px_rgba(34,197,94,0.1)]' : 'border-blue-500/20 bg-blue-500/5 shadow-[0_0_30px_rgba(37,99,235,0.05)]'} relative overflow-hidden`}>
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-transparent opacity-50" />
               <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className={`p-3.5 rounded-2xl flex items-center justify-center ${isServiceActive ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30' : 'bg-white/5 text-white/20'}`}>
                    <Cpu size={28} className={isServiceActive ? 'animate-spin-slow' : ''} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Mainframe Node</h3>
                    <p className="text-[11px] font-bold text-white/40 uppercase mt-0.5 tracking-tight italic">Zero-Touch persistence enabled</p>
                  </div>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${isServiceActive ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                   <Lock size={18} />
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="!p-5 border-white/5 bg-gradient-to-br from-blue-600/10 to-transparent">
                <div className="flex items-center gap-2 mb-3 text-blue-400 uppercase tracking-[0.2em] font-black text-[10px]">
                  <Activity size={14} />
                  <span>Session</span>
                </div>
                <h4 className="text-lg font-black text-white tabular-nums tracking-tighter leading-none">{formatUptime(stats.uptimeSeconds)}</h4>
              </GlassCard>
              <GlassCard className="!p-5 border-white/5">
                <div className="flex items-center gap-2 mb-3 text-purple-400 uppercase tracking-[0.2em] font-black text-[10px]">
                  <Globe size={14} />
                  <span>API Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${webhookStatus === 'online' ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : webhookStatus === 'error' ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                  <h4 className="text-sm font-black uppercase text-white/60 tracking-tight">{webhookStatus === 'idle' ? 'Ready' : webhookStatus}</h4>
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="!p-6 bg-white/5 border-white/10 shadow-xl shadow-black/20">
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] mb-2 flex items-center gap-2">
                  <Database size={12} /> Bridged
                </p>
                <div className="flex items-baseline gap-2">
                  <h4 className="text-5xl font-black text-white tabular-nums tracking-tighter leading-none">{stats.successfulForwards}</h4>
                </div>
              </GlassCard>
              <GlassCard className="!p-6 bg-white/5 border-white/10">
                <p className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em] mb-2">Pending</p>
                <div className="flex items-baseline gap-2 opacity-30">
                  <h4 className="text-5xl font-black text-white tabular-nums tracking-tighter leading-none">0</h4>
                </div>
              </GlassCard>
            </div>

            <div className="space-y-4 pt-2">
              <SimStatus slot={1} nickname={config.simNicknames.slot1} isActive={isServiceActive} signalStrength={94} />
              <SimStatus slot={2} nickname={config.simNicknames.slot2} isActive={isServiceActive} signalStrength={78} />
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
              <button 
                onClick={handleTestWebhook} 
                disabled={isTestingWebhook} 
                className="flex items-center justify-center gap-3 py-6 rounded-[32px] bg-blue-600 font-black text-xs uppercase tracking-[0.2em] text-white active:scale-95 transition-all shadow-2xl shadow-blue-600/40 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-active:translate-x-0 transition-transform duration-300" />
                {isTestingWebhook ? <RefreshCw size={18} className="animate-spin" /> : <Wifi size={18} />} 
                <span className="relative z-10">Ping Test</span>
              </button>
              <button 
                onClick={() => setActiveTab('activity')} 
                className="flex items-center justify-center gap-3 py-6 rounded-[32px] bg-white/5 border border-white/10 text-xs font-black uppercase tracking-[0.2em] text-white/80 active:bg-white/10 transition-all backdrop-blur-md shadow-xl shadow-black/40"
              >
                <Terminal size={18} /> Trail
              </button>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-400">
            <div className="flex items-center justify-between px-2 mb-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-600/15 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg">
                  <Terminal size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic">Audit Trail</h3>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Live monitoring active</p>
                </div>
              </div>
              <button onClick={() => { if ('vibrate' in navigator) navigator.vibrate(20); setLogs([]); }} className="p-4 text-white/20 hover:text-red-400 transition-colors active:scale-90 bg-white/5 rounded-2xl border border-white/10">
                <Trash2 size={22} />
              </button>
            </div>
            <SMSFeed logs={logs} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 pb-12 animate-in slide-in-from-left duration-400">
            <div className="px-2 flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/15 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg">
                <Settings size={24} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic">Hardware</h3>
                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-0.5">Configuration locked</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <GlassCard className="border-white/10 bg-black/20 shadow-2xl">
                <div className="flex items-center gap-4 mb-8">
                   <Globe size={20} className="text-blue-500" />
                   <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">Production Webhook</span>
                </div>
                <div className="space-y-6">
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-white/25 uppercase tracking-[0.25em] ml-1">Endpoint URL</label>
                    <input className="w-full p-5 bg-black/60 rounded-3xl text-xs font-mono border border-white/10 text-white outline-none focus:border-blue-500/50 transition-colors shadow-inner" value={config.webhookUrl} onChange={(e) => setConfig({...config, webhookUrl: e.target.value})} />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-[10px] font-black text-white/25 uppercase tracking-[0.25em] ml-1">Hardware Secret</label>
                    <input type="password" placeholder="••••••••••••••••" className="w-full p-5 bg-black/60 rounded-3xl text-xs font-mono border border-white/10 text-blue-400 outline-none focus:border-blue-500/50 transition-colors shadow-inner" value={config.secretKey} onChange={(e) => setConfig({...config, secretKey: e.target.value})} />
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="border-white/10 bg-black/20">
                <div className="flex items-center gap-4 mb-8">
                   <Smartphone size={20} className="text-blue-500" />
                   <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/80">Labeling</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2.5">
                     <label className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em] ml-1">SIM SLOT 1</label>
                     <input className="w-full p-5 bg-black/60 rounded-2xl text-[11px] font-bold border border-white/10 text-white outline-none focus:border-blue-500/50 shadow-inner" value={config.simNicknames.slot1} onChange={(e) => setConfig({...config, simNicknames: {...config.simNicknames, slot1: e.target.value}})} />
                   </div>
                   <div className="space-y-2.5">
                     <label className="text-[9px] font-black text-white/25 uppercase tracking-[0.2em] ml-1">SIM SLOT 2</label>
                     <input className="w-full p-5 bg-black/60 rounded-2xl text-[11px] font-bold border border-white/10 text-white outline-none focus:border-blue-500/50 shadow-inner" value={config.simNicknames.slot2} onChange={(e) => setConfig({...config, simNicknames: {...config.simNicknames, slot2: e.target.value}})} />
                   </div>
                </div>
              </GlassCard>

              <button 
                onClick={handleSaveToNative}
                disabled={isSyncing}
                className="w-full py-7 rounded-[40px] bg-blue-600 font-black text-sm shadow-[0_20px_50px_#2563eb44] active:scale-[0.97] transition-all flex items-center justify-center gap-4 text-white uppercase tracking-[0.3em] mt-6 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] animate-shimmer" />
                {isSyncing ? <RefreshCw size={22} className="animate-spin" /> : <ShieldCheck size={22} />}
                <span className="relative z-10">{isSyncing ? 'Linking...' : 'Sync & Lock'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-10 left-6 right-6 h-22 glass rounded-[44px] flex items-center justify-around px-6 border border-white/15 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] z-[150] max-w-[400px] mx-auto backdrop-blur-3xl overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
        {[
          { id: 'home', icon: <LayoutDashboard size={26} />, label: 'Nodes' },
          { id: 'activity', icon: <Activity size={26} />, label: 'Audit' },
          { id: 'settings', icon: <Settings size={26} />, label: 'HW-CFG' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              if ('vibrate' in navigator) navigator.vibrate(10);
            }}
            className={`flex flex-col items-center gap-2 transition-all duration-500 relative ${activeTab === tab.id ? 'text-blue-500' : 'text-white/20 hover:text-white/40'}`}
          >
            {activeTab === tab.id && (
              <div className="absolute -top-1 w-12 h-12 bg-blue-500/20 blur-2xl rounded-full" />
            )}
            <div className={`p-3 rounded-2xl transition-all duration-500 ${activeTab === tab.id ? 'bg-blue-500/15 scale-110 shadow-inner' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-[0.25em]">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default App;