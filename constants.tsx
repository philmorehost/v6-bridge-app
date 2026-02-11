
import React from 'react';
import { Shield, Settings, LayoutDashboard, Activity, Database, Smartphone, Bell, ChevronRight } from 'lucide-react';

export const ICONS = {
  Dashboard: <LayoutDashboard size={20} />,
  Settings: <Settings size={20} />,
  Security: <Shield size={20} />,
  Stats: <Activity size={20} />,
  Database: <Database size={20} />,
  SIM: <Smartphone size={20} />,
  Alert: <Bell size={20} />,
  ArrowRight: <ChevronRight size={16} />,
};

export const COLORS = {
  bg: '#0A0E17',
  primary: '#3B82F6',
  success: '#27AE60',
  error: '#EB5757',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};
