import React, { useState } from 'react';
import { useAuthStore } from '@marketplace/auth';
import { authApi } from '@marketplace/api-client';
import { Button, Input } from '@marketplace/ui';
import { User, Lock, Mail, Phone, Cpu } from 'lucide-react';

export interface AuthViewProps {
  onSuccess: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, initialMode = 'login' }) => {
  const { setSession } = useAuthStore();
  const [isRegister, setIsRegister] = useState(initialMode === 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  React.useEffect(() => {
    if (initialMode) {
      setIsRegister(initialMode === 'register');
    }
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (isRegister) {
        const session = await authApi.register(fullName, email, phone, password);
        setSession(session);
      } else {
        const session = await authApi.login(email, password);
        setSession(session);
      }
      onSuccess();
    } catch (error: any) {
      setErrorMessage(error?.message || 'Không thể kết nối tới máy chủ. Vui lòng kiểm tra Backend API.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-12 rounded-2xl bg-slate-950 p-1 flex items-center justify-center mx-auto shadow-md border border-slate-800 overflow-hidden">
            <img
              src="/logo.png"
              alt="TechMarket Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">
              TECH<span className="text-blue-600">MARKET</span>
            </span>
            <span className="block text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Digital Solutions
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {isRegister ? 'Tạo Tài Khoản Mới' : 'Chào Mừng Trở Lại'}
          </h2>
          <p className="text-xs text-slate-500">
            {isRegister
              ? 'Đăng ký tài khoản để mua sắm và quản lý bảo hành thiết bị'
              : 'Đăng nhập để xem giỏ hàng và theo dõi đơn hàng công nghệ'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <Input
                label="Họ và tên"
                placeholder="Nguyễn Văn An"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              <Input
                label="Số điện thoại"
                placeholder="0901234567"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

          <Input
            type="email"
            label="Địa chỉ Email"
            placeholder="an.nguyen@example.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="password"
            label="Mật khẩu"
            placeholder="••••••••"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" isLoading={isLoading} className="w-full">
            {isRegister ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
          </Button>

          {errorMessage && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
              {errorMessage}
            </p>
          )}
        </form>

        <div className="text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            {isRegister ? 'Đã có tài khoản? Đăng nhập ngay' : 'Chưa có tài khoản? Đăng ký miễn phí'}
          </button>
        </div>

      </div>
    </div>
  );
};
