import React, { useEffect, useState } from 'react';
import { Modal, Button, StatusBadge } from '@marketplace/ui';
import { formatCurrency } from '@marketplace/utils';
import type { SePayPaymentInfo } from '@marketplace/types';
import { paymentApi } from '@marketplace/api-client';
import { appConfig } from '@marketplace/config';
import { CheckCircle2, Copy, Clock, ShieldCheck, QrCode, AlertCircle } from 'lucide-react';

export interface SePayModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentId: string;
  sepayInfo?: SePayPaymentInfo;
  onPaymentSuccess: () => void;
}

export const SePayModal: React.FC<SePayModalProps> = ({
  isOpen,
  onClose,
  paymentId,
  sepayInfo,
  onPaymentSuccess,
}) => {
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 mins countdown
  const [copied, setCopied] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [status, setStatus] = useState<'PENDING' | 'PAID' | 'EXPIRED'>('PENDING');

  // Reset state when opening a new payment transaction
  useEffect(() => {
    if (isOpen) {
      setTimeLeft(15 * 60);
      setStatus('PENDING');
      setCopied(null);
    }
  }, [isOpen, paymentId]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || status !== 'PENDING') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setStatus('EXPIRED');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, status]);

  // Polling simulation for payment check - strictly ceases on PAID or EXPIRED
  useEffect(() => {
    if (!isOpen || status !== 'PENDING') return;
    const pollInterval = setInterval(async () => {
      try {
        const result = await paymentApi.checkStatus(paymentId);
        if (result.isPaid) {
          setStatus('PAID');
          clearInterval(pollInterval);
          setTimeout(() => {
            onPaymentSuccess();
          }, 1500);
        }
      } catch {
        // ignore polling error
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isOpen, paymentId, status, onPaymentSuccess]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);
    try {
      await paymentApi.simulatePaymentSuccess(paymentId);
      setStatus('PAID');
      setTimeout(() => {
        onPaymentSuccess();
      }, 1500);
    } finally {
      setIsSimulating(false);
    }
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (!sepayInfo) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cổng Thanh Toán Qua Mã QR 24/7" maxWidth="lg">
      <div className="flex flex-col items-center">
        {status === 'PAID' ? (
          <div className="flex flex-col items-center py-8 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 mb-1">Thanh toán qua QR thành công!</h4>
            <p className="text-sm text-slate-500 mb-6">Đơn hàng của bạn đã được xác nhận và chuyển sang kho xử lý.</p>
            <Button onClick={onPaymentSuccess} className="w-full">
              Xem đơn hàng ngay
            </Button>
          </div>
        ) : status === 'EXPIRED' ? (
          <div className="flex flex-col items-center py-8 text-center animate-in zoom-in-95 space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-10 h-10" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Mã QR Thanh Toán Đã Hết Hạn</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Phiên giao dịch quá 15 phút mà chưa ghi nhận chuyển khoản. Vui lòng quay lại danh sách đơn hàng và nhấn "Thanh toán ngay" để lấy mã QR mới.
              </p>
            </div>
            <Button variant="outline" onClick={onClose} className="w-full">
              Đóng cửa sổ
            </Button>
          </div>
        ) : (
          <>
            {/* Countdown timer & Status */}
            <div className="flex items-center justify-between w-full px-4 py-2.5 mb-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Giao dịch hết hạn trong:</span>
              </div>
              <span className="font-mono font-bold text-sm text-amber-900">{formattedTime}</span>
            </div>

            {/* QR Code Container */}
            <div className="relative p-3 bg-white border-2 border-dashed border-blue-300 rounded-2xl shadow-inner mb-4 flex flex-col items-center">
              <img
                src={sepayInfo.qrUrl}
                alt="Mã QR Thanh Toán 24/7"
                className="w-52 h-52 object-contain"
              />
              <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quét mã bằng app ngân hàng bất kỳ (Mã QR 24/7)</span>
              </div>
            </div>

            {/* Bank details grid */}
            <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs space-y-2.5 mb-5">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-800">{sepayInfo.bankName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-800">{sepayInfo.accountHolder}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Số tài khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-blue-600 text-sm">{sepayInfo.accountNumber}</span>
                  <button
                    onClick={() => handleCopy(sepayInfo.accountNumber, 'acc')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    title="Sao chép số tài khoản"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copied === 'acc' && <span className="text-[10px] text-emerald-600 font-semibold">Đã chép</span>}
                </div>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-extrabold text-red-600 text-sm">{formatCurrency(sepayInfo.amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Nội dung chuyển khoản:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                    {sepayInfo.content}
                  </span>
                  <button
                    onClick={() => handleCopy(sepayInfo.content, 'content')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    title="Sao chép nội dung"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  {copied === 'content' && <span className="text-[10px] text-emerald-600 font-semibold">Đã chép</span>}
                </div>
              </div>
            </div>

            {/* Simulated QR webhook trigger for developer / user testing (Hidden in production) */}
            <div className="w-full pt-2 border-t border-slate-100 flex flex-col gap-2">
              {appConfig.appEnv !== 'production' && (
                <Button
                  variant="primary"
                  onClick={handleSimulatePayment}
                  isLoading={isSimulating}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                >
                  [Mô phỏng Test] Quét QR & Chuyển Khoản Thành Công
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={onClose} className="w-full">
                Để tôi quét mã sau
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
