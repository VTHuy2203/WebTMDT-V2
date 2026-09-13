import React from 'react';
import type { GamePlatform } from '@marketplace/types';
import { Monitor, Smartphone, Gamepad2, Layers } from 'lucide-react';

export interface GamePlatformBadgeProps {
  platform: GamePlatform;
  className?: string;
}

export const GamePlatformBadge: React.FC<GamePlatformBadgeProps> = ({ platform, className = '' }) => {
  const configs: Record<GamePlatform, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
    PC: {
      label: 'PC / Máy tính',
      icon: <Monitor className="w-3 h-3" />,
      bg: 'bg-indigo-50 border-indigo-200',
      text: 'text-indigo-800',
    },
    MOBILE: {
      label: 'Di Động (iOS / Android)',
      icon: <Smartphone className="w-3 h-3" />,
      bg: 'bg-emerald-50 border-emerald-200',
      text: 'text-emerald-800',
    },
    PLAYSTATION: {
      label: 'PlayStation',
      icon: <Gamepad2 className="w-3 h-3" />,
      bg: 'bg-blue-50 border-blue-200',
      text: 'text-blue-800',
    },
    XBOX: {
      label: 'Xbox',
      icon: <Gamepad2 className="w-3 h-3" />,
      bg: 'bg-green-50 border-green-200',
      text: 'text-green-800',
    },
    NINTENDO_SWITCH: {
      label: 'Nintendo Switch',
      icon: <Gamepad2 className="w-3 h-3" />,
      bg: 'bg-red-50 border-red-200',
      text: 'text-red-800',
    },
    CROSS_PLATFORM: {
      label: 'Đa Nền Tảng (Cross-Play)',
      icon: <Layers className="w-3 h-3" />,
      bg: 'bg-purple-50 border-purple-200',
      text: 'text-purple-800',
    },
  };

  const current = configs[platform] || configs.PC;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${current.bg} ${current.text} ${className}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
