import React from 'react';
import type { AppAccountFulfillmentType } from '@marketplace/types';
import { UserCheck, Mail, Users, KeyRound, Headphones } from 'lucide-react';

export interface FulfillmentTypeBadgeProps {
  type: AppAccountFulfillmentType;
  className?: string;
  showIcon?: boolean;
}

export const fulfillmentTypeConfig: Record<
  AppAccountFulfillmentType,
  { label: string; shortLabel: string; bg: string; text: string; icon: React.ReactNode; description: string }
> = {
  PRE_CREATED_ACCOUNT: {
    label: 'Tài khoản cấp sẵn (Giao tức thì)',
    shortLabel: 'Cấp sẵn',
    bg: 'bg-indigo-50 border-indigo-200',
    text: 'text-indigo-800',
    icon: <UserCheck className="w-3.5 h-3.5" />,
    description: 'Nhận tài khoản & mật khẩu đăng nhập ngay sau khi thanh toán',
  },
  BUYER_EMAIL_ACTIVATION: {
    label: 'Kích hoạt / Nâng cấp chính chủ (Email của bạn)',
    shortLabel: 'Email chính chủ',
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    icon: <Mail className="w-3.5 h-3.5" />,
    description: 'Người bán nâng cấp gói cước trực tiếp lên email cá nhân của bạn',
  },
  FAMILY_OR_TEAM_INVITATION: {
    label: 'Mời vào nhóm Family / Team',
    shortLabel: 'Mời Family/Team',
    bg: 'bg-purple-50 border-purple-200',
    text: 'text-purple-800',
    icon: <Users className="w-3.5 h-3.5" />,
    description: 'Nhận link hoặc email mời tham gia gói gia đình/đội nhóm',
  },
  LICENSE_KEY: {
    label: 'Key bản quyền / Redeem code',
    shortLabel: 'Key bản quyền',
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    icon: <KeyRound className="w-3.5 h-3.5" />,
    description: 'Nhận chuỗi mã bản quyền và kích hoạt trên trang chủ ứng dụng',
  },
  MANUAL_SERVICE: {
    label: 'Hỗ trợ thiết lập thủ công',
    shortLabel: 'Hỗ trợ thủ công',
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-800',
    icon: <Headphones className="w-3.5 h-3.5" />,
    description: 'Người bán sẽ liên hệ và hỗ trợ thiết lập theo yêu cầu riêng',
  },
};

export const FulfillmentTypeBadge: React.FC<FulfillmentTypeBadgeProps> = ({
  type,
  className = '',
  showIcon = true,
}) => {
  const config = fulfillmentTypeConfig[type] || fulfillmentTypeConfig.PRE_CREATED_ACCOUNT;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${className}`}
      title={config.description}
    >
      {showIcon && config.icon}
      <span>{config.label}</span>
    </span>
  );
};
