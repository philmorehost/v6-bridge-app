
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className = '', title, icon }) => {
  return (
    <div className={`glass rounded-2xl p-6 relative overflow-hidden ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-6">
          {icon && <div className="text-blue-400">{icon}</div>}
          {title && <h3 className="text-lg font-semibold text-white/90">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
};
