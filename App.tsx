
import React, { useState, useEffect, useCallback } from 'react';
import { SMSLog, GatewayConfig, Stats } from './types';
import { ICONS, COLORS } from './constants';
import { GlassCard } from './components/GlassCard';
import { SMSFeed } from './components/SMSFeed';
import { SimStatus } from './components/SimStatus';
import { SetupWizard } from './components/SetupWizard';
import { 
  Smartphone, 
  LayoutDashboard, 
  Settings, 
  ShieldCheck, 
  Activity, 
  Globe, 
  Lock, 
  ShieldAlert, 
  Zap, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  HardDrive, 
  Wifi, 
  Fingerprint,
  RefreshCw,
  Plus,
  X,
  Eye,
  EyeOff,
  ShieldX,
  Info,
  ShieldEllipsis,
  Bug,
  Copy,
  AlertTriangle,
  Code2,
  ServerCrash,
  Cpu,
  BellRing,
  Trash2
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'settings'>('home');
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isServiceActive, setIsServiceActive] = useState(true);
  const [isBackgroundPersistent, setIsBackgroundPersistent] = useState(true);
  const [config, setConfig] = useState<GatewayConfig>(INITIAL_CONFIG);
  const [newSenderInput, setNewSenderInput] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [logs, setLogs] = useState<SMSLog[]>([]);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<'idle' | 'online' | 'error' | 'restricted'>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const [showFixSnippet, setShowFixSnippet] = useState(false);
  
  const [stats, setStats] = useState({
    totalReceived: 0,
    successfulForwards: 0,
    activeRetries: 0,
    blockedUnauthorized: 0,
    uptimeSeconds: 0,
  });

  useEffect(() => {
    let timer: number;
    if (isServiceActive) {
      timer = window.setInterval(() => {
        setStats(prev => ({ ...prev, uptimeSeconds: prev.uptimeSeconds + 1 }));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isServiceActive]);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d}d ${h}h ${m}m ${s}s`;
  };

  const handleTestWebhook = async () => {
    const url = config.webhookUrl.trim();
    if (!url || !config.secretKey) {
      alert("Configuration Incomplete: Webhook URL and Secret Key are required.");
      setWebhookStatus('error');
      return;
    }

    // Basic URL Validation
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setLastError("Invalid Protocol: Webhook URL must start with http:// or https://");
      setWebhookStatus('error');
      return;
    }

    setIsTestingWebhook(true);
    setWebhookStatus('idle');
    setLastError(null);
    setShowFixSnippet(false);

    const payload = {
      action: "RECEIVE_SMS",
      secret: config.secretKey,
      sender: "08012345678",
      message: "DGV6_BRIDGE_TEST_CONNECTION"
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setWebhookStatus('online');
      } else {
        const errorText = await response.text();
        setLastError(`Server Error (HTTP ${response.status}): ${errorText.substring(0, 100) || 'The endpoint rejected the request.'}`);
        setWebhookStatus('error');
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        setLastError("Connection Timeout: The server took too long to respond. Check if the URL is correct and the server is awake.");
        setWebhookStatus('error');
      } else {
        try {
          // Fallback Diagnostic: Low-level Handshake (no-cors)
          await fetch(url, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
          });

          setWebhookStatus('restricted');
          setLastError("CORS Policy Block: The server is online, but the browser preview is blocked. This is resolved by adding CORS headers to your PHP file (see below) or running in the Android APK.");
          setShowFixSnippet(true);
        } catch (innerError) {
          setLastError("Host Unreachable: We couldn't establish a connection. Possible causes: DNS failure, invalid SSL, or the server is down.");
          setWebhookStatus('error');
        }
      }
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleClearLogs = () => {
    if (logs.length === 0) return;
    const confirmed = window.confirm("Are you sure you want to clear all SMS logs? This action cannot be undone.");
    if (confirmed) {
      setLogs([]);
    }
  };

  const handleAddSender = () => {
    const trimmed = newSenderInput.trim().toUpperCase();
    if (trimmed && !config.authorizedSenders.includes(trimmed)) {
      setConfig({
        ...config,
        authorizedSenders: [...config.authorizedSenders, trimmed]
      });
      setNewSenderInput('');
    }
  };

  const handleRemoveSender = (senderToRemove: string) => {
    setConfig({
      ...config,
      authorizedSenders: config.authorizedSenders.filter(s => s !== senderToRemove)
    });
  };

  const toggleRestriction = () => {
    setConfig({
      ...config,
      isSenderRestrictionEnabled: !config.isSenderRestrictionEnabled
    });
  };

  if (!isSetupComplete) {
    return <SetupWizard onComplete={() => setIsSetupComplete(true)} />;
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto relative bg-[#0A0E17] overflow-hidden select-none">
      <div className="flex-1 overflow-y-auto px-5 pt-8 pb-32 no-scrollbar">
        
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <div className={`w-5 h-5 bg-blue-600 rounded-md flex items-center justify-center ${isServiceActive ? 'animate-pulse shadow-[0_0_15px_rgba(37,99,235,0.5)]' : ''}`}>
                <Zap size={12} className="text-white fill-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter text-white uppercase">DGV6 Bridge <span className="text-blue-500 ml-1">v2.0</span></h1>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isServiceActive ? 'bg-green-500 shadow-[0_0_12px_#22c55e]' : 'bg-red-500 shadow-[0_0_12px_#EB5757]'} animate-pulse`} />
              <span className="text-[9px] uppercase font-black text-white/30 tracking-[0.2em]">
                {isServiceActive ? 'Bridge Core: Persistent' : 'Bridge Core: Paused'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 glass rounded-xl flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5">
              <Fingerprint size={22} />
            </div>
          </div>
        </header>

        {activeTab === 'home' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Persistence Engine Card */}
            <GlassCard className="!p-4 border-blue-500/10 bg-blue-500/5 relative overflow-hidden group">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[60px] rounded-full -translate-y-1/2 translate-x-1/2 transition-opacity duration-1000 ${isServiceActive ? 'opacity-100' : 'opacity-0'}`} />
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl flex items-center justify-center ${isServiceActive ? 'bg-blue-600/20 text-blue-400' : 'bg-white/5 text-white/20'}`}>
                    <Cpu size={20} className={isServiceActive ? 'animate-spin-slow' : ''} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">Persistence Engine</h3>
                    <p className="text-[9px] font-bold text-white/30 uppercase mt-0.5">Active Foreground Service</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <span className={`text-[10px] font-black tracking-tighter ${isServiceActive ? 'text-green-400' : 'text-red-400'}`}>
                     {isServiceActive ? 'SYSTEM_LOCKED' : 'SYSTEM_PAUSED'}
                   </span>
                   <span className="text-[8px] font-bold text-white/10 uppercase mt-1">Ref: Wakelock v2.1</span>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="!p-4 border-white/5 bg-gradient-to-br from-blue-600/5 to-transparent">
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={12} className="text-blue-400" />
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Service Session</p>
                </div>
                <h4 className="text-sm font-black text-white tabular-nums tracking-tight">{formatUptime(stats.uptimeSeconds)}</h4>
              </GlassCard>
              <GlassCard className="!p-4 border-white/5">
                <div className="flex items-center gap-2 mb-2">
                  <Globe size={12} className="text-blue-400" />
                  <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em]">Server Link</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    webhookStatus === 'online' ? 'bg-green-500' : 
                    webhookStatus === 'restricted' ? 'bg-blue-500' :
                    webhookStatus === 'error' ? 'bg-red-500' : 'bg-white/20'
                  }`} />
                  <h4 className={`text-sm font-black uppercase ${
                    webhookStatus === 'online' ? 'text-green-400' : 
                    webhookStatus === 'restricted' ? 'text-blue-400' :
                    webhookStatus === 'error' ? 'text-red-400' : 'text-white/40'
                  }`}>
                    {webhookStatus === 'idle' ? 'STANDBY' : webhookStatus}
                  </h4>
                </div>
              </GlassCard>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="!p-4 bg-white/5">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Bridged Traffic</p>
                <h4 className="text-3xl font-black text-white tabular-nums">{stats.successfulForwards}</h4>
                <div className="text-[8px] font-bold text-white/20 mt-2 uppercase flex items-center gap-1">
                  <CheckCircle2 size={10} /> Forwarding Active
                </div>
              </GlassCard>
              <GlassCard className="!p-4 bg-white/5">
                <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">Filtered Drop</p>
                <h4 className="text-3xl font-black text-white/20 tabular-nums">{stats.blockedUnauthorized}</h4>
                <div className="text-[8px] font-bold text-white/10 mt-2 uppercase flex items-center gap-1">
                  <ShieldAlert size={10} /> {config.isSenderRestrictionEnabled ? 'Filter On' : 'Filter Off'}
                </div>
              </GlassCard>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
                  <HardDrive size={12} /> SMS Hardware Bus
                </h3>
              </div>
              <SimStatus slot={1} nickname={config.simNicknames.slot1} isActive={isServiceActive} signalStrength={0} />
              <SimStatus slot={2} nickname={config.simNicknames.slot2} isActive={isServiceActive} signalStrength={0} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={handleTestWebhook}
                disabled={isTestingWebhook || !config.webhookUrl}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-blue-600 font-black text-[10px] uppercase tracking-widest text-white shadow-lg shadow-blue-600/20 active:scale-95 transition-all disabled:opacity-30"
              >
                {isTestingWebhook ? <RefreshCw size={14} className="animate-spin" /> : <Wifi size={14} />}
                Test Endpoint
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 active:bg-white/10 transition-all"
              >
                <Terminal size={14} /> Bridge Config
              </button>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-2">
                <Terminal size={20} className="text-blue-400" />
                <h3 className="text-2xl font-black uppercase">Audit Trail</h3>
              </div>
              <button 
                onClick={handleClearLogs}
                disabled={logs.length === 0}
                className="p-2.5 rounded-xl bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all disabled:opacity-10"
                title="Clear Audit Trail"
              >
                <Trash2 size={20} />
              </button>
            </div>
            <SMSFeed logs={logs} />
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500 pb-12">
            <div className="px-2">
              <h3 className="text-2xl font-black uppercase">Configuration</h3>
              <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest mt-1">Hardware Interface: Native Kotlin</p>
            </div>
            
            <div className="space-y-4">
              {/* Uptime Management Card */}
              <GlassCard title="Uptime Engine" icon={<BellRing size={18} />}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
                    <div>
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Keep-Alive (Wakelock)</p>
                      <p className="text-[8px] text-white/20 uppercase font-bold">Prevent CPU sleep during high traffic</p>
                    </div>
                    <button 
                      onClick={() => setIsBackgroundPersistent(!isBackgroundPersistent)}
                      className={`w-10 h-5 rounded-full relative transition-all ${isBackgroundPersistent ? 'bg-blue-600' : 'bg-white/10'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isBackgroundPersistent ? 'left-5.5' : 'left-0.5'}`} />
                    </button>
                  </div>
                  <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/10">
                    <p className="text-[8px] font-black text-green-400 uppercase tracking-widest mb-1">Android Requirement</p>
                    <p className="text-[9px] text-white/40 leading-relaxed italic">The native build must register a 'ForegroundService' to maintain this heartbeat in the background.</p>
                  </div>
                </div>
              </GlassCard>

              {lastError && (
                <div className={`p-4 rounded-2xl border flex flex-col gap-3 animate-in fade-in ${webhookStatus === 'restricted' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                  <div className="flex items-start gap-3">
                    {webhookStatus === 'restricted' ? <ServerCrash size={18} className="text-blue-400 mt-1 shrink-0" /> : <AlertTriangle size={18} className="text-red-400 mt-1 shrink-0" />}
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${webhookStatus === 'restricted' ? 'text-blue-400' : 'text-red-400'}`}>
                        {webhookStatus === 'restricted' ? 'Diagnostic Handshake Success' : 'Endpoint Synchronisation Failed'}
                      </p>
                      <p className="text-[9px] text-white/80 mt-1 leading-relaxed">{lastError}</p>
                    </div>
                  </div>
                  {showFixSnippet && (
                    <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                          <Code2 size={10} /> Endpoint.php CORS Fix
                        </span>
                        <button onClick={() => {
                          navigator.clipboard.writeText(`header("Access-Control-Allow-Origin: *");\nheader("Access-Control-Allow-Headers: Content-Type, Accept");\nheader("Content-Type: application/json");`);
                          alert("Fix snippet copied!");
                        }} className="text-white/20 hover:text-white"><Copy size={12} /></button>
                      </div>
                      <pre className="text-[7px] font-mono text-white/40 overflow-x-auto p-2 bg-black/20 rounded-lg">
                        {`header("Access-Control-Allow-Origin: *");\nheader("Access-Control-Allow-Headers: Content-Type, Accept");\nheader("Content-Type: application/json");`}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              <GlassCard title="Remote V6 Endpoint" icon={<Globe size={18} />}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">Webhook URL</label>
                    <input className="w-full p-4 bg-black/40 rounded-2xl text-xs font-mono border border-white/10 focus:border-blue-500/50 focus:outline-none text-white" placeholder="https://your-api.com/v6/sms.php" value={config.webhookUrl} onChange={(e) => setConfig({...config, webhookUrl: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/30 uppercase tracking-widest ml-1">API Secret Key</label>
                    <div className="relative">
                      <input type={showSecret ? "text" : "password"} className="w-full p-4 bg-black/40 rounded-2xl text-xs font-mono border border-white/10 focus:border-blue-500/50 focus:outline-none text-blue-400 pr-12" value={config.secretKey} onChange={(e) => setConfig({...config, secretKey: e.target.value})} />
                      <button onClick={() => setShowSecret(!showSecret)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-blue-400 transition-colors">{showSecret ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                  </div>
                </div>
              </GlassCard>

              <button 
                onClick={() => {
                  alert("Bridge Active: Service will remain persistent in background.");
                  setIsServiceActive(true);
                }}
                className="w-full py-5 rounded-[28px] bg-blue-600 font-black text-sm shadow-xl shadow-blue-600/20 active:scale-95 transition-transform flex items-center justify-center gap-2 text-white uppercase tracking-widest"
              >
                <Zap size={16} className="fill-white" />
                INITIATE PERSISTENT BRIDGE
              </button>
            </div>
          </div>
        )}

      </div>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bottom-nav-glass h-24 px-10 pb-6 flex items-center justify-between z-[150]">
        {[
          { id: 'home', icon: <LayoutDashboard size={24} />, label: 'DASH' },
          { id: 'activity', icon: <Activity size={24} />, label: 'LOGS' },
          { id: 'settings', icon: <Settings size={24} />, label: 'SETUP' },
        ].map((tab) => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${activeTab === tab.id ? 'text-blue-500 scale-110' : 'text-white/20 hover:text-white/40'}`}
          >
            <div className={`p-2.5 rounded-2xl transition-all duration-500 ${activeTab === tab.id ? 'bg-blue-500/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]' : ''}`}>
              {tab.icon}
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.2em]">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};

export default App;
