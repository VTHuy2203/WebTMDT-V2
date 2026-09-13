import React, { useState } from 'react';
import { Modal, Button, Input } from '@marketplace/ui';
import { Lock, ShieldCheck, AlertCircle } from 'lucide-react';

export interface ReauthenticationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  isLoading?: boolean;
}

export const ReauthenticationDialog: React.FC<ReauthenticationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Vui lòng nhập mật khẩu tài khoản để xác thực');
      return;
    }
    setError('');
    onConfirm(password);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác Thực Bảo Mật Trước Khi Xem Tài Khoản">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 text-blue-900 border border-blue-100">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <p className="leading-relaxed">
            Để bảo vệ thông tin mật khẩu và dữ liệu bí mật của bạn, vui lòng nhập lại mật khẩu tài khoản mua sắm để tiếp tục.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-slate-700">Mật khẩu của bạn</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Nhập mật khẩu tài khoản..."
            autoFocus
          />
          {error && (
            <p className="text-red-600 flex items-center gap-1 text-[11px] mt-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button type="submit" size="sm" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {isLoading ? 'Đang xác thực...' : 'Xác nhận mở thông tin'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
