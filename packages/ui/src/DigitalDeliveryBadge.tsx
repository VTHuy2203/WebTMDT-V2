import React from 'react';
import type { DigitalDeliveryStatus } from '@marketplace/types';
import { Clock, ShieldAlert, CheckCircle2, Lock, Key, AlertTriangle } from 'lucide-react';

export interface DigitalDeliveryBadgeProps {
  status: DigitalDeliveryStatus;
  className?: string;
}

export const DigitalDeliveryBadge: React.FC<DigitalDeliveryBadgeProps> = ({ status, className = '' }) => {
  const configs: Record<DigitalDeliveryStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    NOT_AVAILABLE: {
      label: 'Chưa khả dụng',
      bg: 'bg-slate-100',
      text: 'text-slate-700 border-slate-200',
      icon: <Lock className="w-3 h-3" />,
    },
    PREPARING: {
      label: 'Đang chuẩn bị',
      bg: 'bg-amber-50',
      text: 'text-amber-800 border-amber-200',
      icon: <Clock className="w-3 h-3 animate-spin" />,
    },
    READY: {
      label: 'Sẵn sàng nhận',
      bg: 'bg-blue-50',
      text: 'text-blue-800 border-blue-200',
      icon: <Key className="w-3 h-3" />,
    },
    REVEALED: {
      label: 'Đã nhận tài khoản',
      bg: 'bg-emerald-50',
      text: 'text-emerald-800 border-emerald-200',
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    REPORTED: {
      label: 'Đang khiếu nại',
      bg: 'bg-rose-50',
      text: 'text-rose-800 border-rose-200',
      icon: <AlertTriangle className="w-3 h-3" />,
    },
  };

  const current = configs[status] || configs.NOT_AVAILABLE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${className}`}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
