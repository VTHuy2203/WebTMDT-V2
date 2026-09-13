import React, { useState } from 'react';
import type { UserReportReason, UserReportTargetType } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { ShieldAlert, Flag, CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface ReportViolationModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  shopName: string;
  productId?: string;
  productName?: string;
}

export const ReportViolationModal: React.FC<ReportViolationModalProps> = ({
  isOpen,
  onClose,
  shopId,
  shopName,
  productId,
  productName,
}) => {
  const [targetType, setTargetType] = useState<UserReportTargetType>(
    productId ? 'PRODUCT' : 'SHOP'
  );
  const [reason, setReason] = useState<UserReportReason>('FRAUD');
  const [reasonTitle, setReasonTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !reporterName.trim() || !reporterEmail.trim()) {
      alert('Vui lòng điền đầy đủ họ tên, email và nội dung tố cáo.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminApi.submitUserReport({
        reporterName: reporterName.trim(),
        reporterEmail: reporterEmail.trim(),
        reporterPhone: reporterPhone.trim() || undefined,
        targetType,
        targetId: targetType === 'PRODUCT' && productId ? productId : shopId,
        targetName: targetType === 'PRODUCT' && productName ? productName : shopName,
        shopId,
        shopName,
        reason,
        reasonTitle:
          reasonTitle.trim() ||
          (reason === 'FRAUD'
            ? 'Lừa đảo / Chiếm đoạt tiền'
            : reason === 'INVALID_ACCOUNT'
            ? 'Tài khoản sai mật khẩu / Bị đổi thông tin'
            : reason === 'FAKE_PRODUCT'
            ? 'Hàng giả / Key bản quyền lậu'
            : reason === 'NO_WARRANTY'
            ? 'Shop trốn tránh bảo hành'
            : reason === 'ABUSIVE_BEHAVIOR'
            ? 'Thái độ khiếm nhã / Đe dọa'
            : 'Vi phạm quy chuẩn sàn'),
        description: description.trim(),
        evidenceImages: [],
        priority: reason === 'FRAUD' || reason === 'INVALID_ACCOUNT' ? 'URGENT' : 'HIGH',
      });

      setSubmittedTicket(res.ticketCode);
    } catch (err) {
      console.error('Submit report failed:', err);
      alert('Gửi báo cáo thất bại, vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmittedTicket(null);
    setDescription('');
    setReasonTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50 duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
        {submittedTicket ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900">Gửi Tố Cáo Thành Công!</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
              Mã vé phản ánh:{' '}
              <strong className="text-purple-700 font-mono text-sm">{submittedTicket}</strong>. Ban Quản Trị sàn sẽ
              kiểm tra bằng chứng và phản hồi kết quả xử lý qua email{' '}
              <strong className="text-slate-900">{reporterEmail}</strong> trong vòng 24 giờ.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Đã hiểu & Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <Flag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Báo Cáo Vi Phạm Cho Admin</h3>
                  <p className="text-[11px] text-slate-400">Gửi trực tiếp đến Trung tâm An toàn & Kiểm duyệt sàn</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Đối tượng cần phản ánh:</label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {productId && (
                  <button
                    type="button"
                    onClick={() => setTargetType('PRODUCT')}
                    className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                      targetType === 'PRODUCT'
                        ? 'border-rose-500 bg-rose-50/50 text-rose-700'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    📦 Sản phẩm này
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setTargetType('SHOP')}
                  className={`p-2.5 rounded-xl border text-left font-semibold transition-all cursor-pointer ${
                    targetType === 'SHOP'
                      ? 'border-rose-500 bg-rose-50/50 text-rose-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🏪 Gian hàng ({shopName})
                </button>
              </div>
            </div>

            {/* Reason Select */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý do báo cáo <span className="text-rose-500">*</span>:
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as UserReportReason)}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden bg-slate-50/50"
              >
                <option value="FRAUD">Lừa đảo / Gian lận chiếm đoạt tiền</option>
                <option value="INVALID_ACCOUNT">Tài khoản lỗi, sai mật khẩu, bị back nick</option>
                <option value="FAKE_PRODUCT">Hàng giả, hàng nhái, key lậu không dùng được</option>
                <option value="NO_WARRANTY">Shop trốn tránh trách nhiệm bảo hành</option>
                <option value="ABUSIVE_BEHAVIOR">Thái độ khiếm nhã, chửi bới, đe dọa khách</option>
                <option value="SCAM_LINK">Gửi đường link hoặc file chứa mã độc độc hại</option>
                <option value="OTHER">Lý do khác</option>
              </select>
            </div>

            {/* Title / Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả chi tiết nội dung vi phạm <span className="text-rose-500">*</span>:
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả cụ thể vấn đề bạn gặp phải, số tiền, thời gian và bằng chứng..."
                className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            {/* Reporter Info */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Họ tên bạn <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Email nhận phản hồi <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="email"
                  required
                  value={reporterEmail}
                  onChange={(e) => setReporterEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                {submitting ? 'Đang gửi...' : 'Gửi Báo Cáo Cho Admin'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
