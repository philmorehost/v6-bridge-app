
import React, { useState } from 'react';
import { ICONS } from '../constants';
import { Shield, Smartphone, Zap, MoreVertical, CheckCircle, BatteryCharging } from 'lucide-react';

interface SetupWizardProps {
  onComplete: () => void;
}

export const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: "Welcome to DGV6 Bridge",
      description: "Initialize your zero-touch SMS gateway for 24/7 background operation.",
      icon: <Zap size={48} className="text-blue-400" />
    },
    {
      title: "Allow Restricted Settings",
      description: "CRITICAL: Tap 'App Info', then the three-dots (⋮) in the top-right and select 'Allow Restricted Settings'.",
      icon: <MoreVertical size={48} className="text-purple-400" />
    },
    {
      title: "Battery Optimization",
      description: "Ensure 'Don't Optimize' is selected. This allows the bridge to run 24/7 without Android killing the process.",
      icon: <BatteryCharging size={48} className="text-orange-400" />
    },
    {
      title: "Foreground Service",
      description: "The app will display a persistent notification. This is necessary to maintain the bridge while minimized.",
      icon: <Shield size={48} className="text-green-400" />
    }
  ];

  const next = () => {
    if (step < steps.length - 1) setStep(step + 1);
    else onComplete();
  };

  return (
    <div className="fixed inset-0 z-[200] setup-wizard-overlay p-8 flex flex-col justify-between overflow-hidden">
      <div className="flex justify-center pt-12">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
          <div className="relative glass p-8 rounded-[40px] flex items-center justify-center">
            {steps[step].icon}
          </div>
        </div>
      </div>

      <div className="space-y-4 text-center">
        <h2 className="text-3xl font-bold text-white leading-tight animate-in slide-in-from-bottom duration-500">
          {steps[step].title}
        </h2>
        <p className="text-white/60 leading-relaxed text-lg animate-in slide-in-from-bottom delay-100 duration-500">
          {steps[step].description}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex justify-center gap-2">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1.5 transition-all duration-500 rounded-full ${i === step ? 'w-8 bg-blue-500' : 'w-2 bg-white/10'}`} 
            />
          ))}
        </div>
        
        <button 
          onClick={next}
          className="w-full py-5 rounded-[24px] bg-blue-600 font-bold text-xl shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {step === steps.length - 1 ? "Start Bridge" : "Continue"}
          <CheckCircle size={20} />
        </button>
      </div>
    </div>
  );
};
