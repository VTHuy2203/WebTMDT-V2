import React from 'react';
import type { GameAccountChangeability } from '@marketplace/types';
import { CheckCircle2, XCircle, AlertCircle, ShieldAlert } from 'lucide-react';

export interface AccountChangeabilityCardProps {
  changeability: GameAccountChangeability;
}

export const AccountChangeabilityCard: React.FC<AccountChangeabilityCardProps> = ({ changeability }) => {
  const items = [
    {
      label: 'Đổi Mật Khẩu',
      allowed: changeability.canChangePassword,
      description: changeability.canChangePassword
        ? 'Người mua có thể tự đổi mật khẩu mới ngay sau khi nhận'
        : 'Mật khẩu cố định hoặc cấp quyền đăng nhập ủy quyền',
    },
    {
      label: 'Đổi Email Liên Kết',
      allowed: changeability.canChangeEmail,
      description: changeability.canChangeEmail
        ? 'Email trắng hoặc sẵn sàng chuyển giao mã OTP sang email của bạn'
        : 'Email không đổi được (dùng tài khoản đăng nhập trực tiếp)',
    },
    {
      label: 'Đổi Số Điện Thoại',
      allowed: changeability.canChangePhone,
      description: changeability.canChangePhone
        ? 'Tài khoản chưa gán SĐT hoặc hỗ trợ gỡ số cũ để thêm số mới'
        : 'Chưa hỗ trợ thay đổi SĐT bảo mật',
    },
    {
      label: 'Gỡ Liên Kết Mạng Xã Hội',
      allowed: changeability.canRemoveLinkedServices,
      description: changeability.canRemoveLinkedServices
        ? 'Tài khoản độc lập, không bị kẹt liên kết Facebook, Google, Apple'
        : 'Có thể phụ thuộc vào chính sách gỡ liên kết của nhà phát hành',
    },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <ShieldAlert className="w-5 h-5 text-indigo-600" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Khả Năng Thay Đổi Thông Tin Bảo Mật</h2>
          <p className="text-xs text-slate-500 mt-0.5">Xác minh quyền quản trị và chuyển giao tài khoản</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border transition-all ${
              item.allowed
                ? 'bg-emerald-50/40 border-emerald-200'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-xs text-slate-900">{item.label}</span>
              {item.allowed ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Hỗ trợ đổi</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200 text-slate-700">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Không đổi</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
