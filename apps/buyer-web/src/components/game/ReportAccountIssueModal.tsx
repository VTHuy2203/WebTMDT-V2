import React, { useState } from 'react';
import type { DigitalIssueType } from '@marketplace/types';
import { Modal, Button, Input, Select } from '@marketplace/ui';
import { AlertTriangle, ShieldCheck, Image, AlertCircle } from 'lucide-react';

export interface ReportAccountIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    issueType: DigitalIssueType;
    description: string;
    evidenceImages: string[];
    desiredSolution: 'SUPPORT' | 'REPLACEMENT' | 'REFUND';
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export const ReportAccountIssueModal: React.FC<ReportAccountIssueModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting = false,
}) => {
  const [issueType, setIssueType] = useState<DigitalIssueType>('CANNOT_LOGIN');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [desiredSolution, setDesiredSolution] = useState<'SUPPORT' | 'REPLACEMENT' | 'REFUND'>('SUPPORT');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || description.length < 10) {
      setError('Vui lòng mô tả chi tiết sự cố ít nhất 10 ký tự');
      return;
    }
    if (!privacyAgreed) {
      setError('Bạn cần cam kết không để lộ mật khẩu trong mô tả hoặc hình ảnh');
      return;
    }

    setError('');
    const evidenceImages = evidenceUrl.trim()
      ? [evidenceUrl.trim()]
      : ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800'];

    await onSubmit({
      issueType,
      description,
      evidenceImages,
      desiredSolution,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Báo Cáo Sự Cố & Yêu Cầu Hỗ Trợ Đơn Hàng">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Chính sách bảo hành và giải quyết sự cố</span>
          </div>
          <p className="text-[11px] leading-relaxed text-rose-800">
            Hệ thống sẽ giữ tiền thanh toán của bạn và chuyển yêu cầu tới Người bán để hỗ trợ xử lý trong vòng 24 giờ.
            Nếu người bán không phản hồi, Quản trị viên sàn sẽ can thiệp để hoàn tiền hoặc đổi mới.
          </p>
        </div>

        {/* Issue Type */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Vấn đề gặp phải</label>
          <select
            value={issueType}
            onChange={(e) => setIssueType(e.target.value as DigitalIssueType)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="CANNOT_LOGIN">Không thể đăng nhập vào tài khoản</option>
            <option value="WRONG_CREDENTIALS">Sai mật khẩu hoặc tên đăng nhập</option>
            <option value="ACCOUNT_NOT_AS_DESCRIBED">Tài khoản không đúng mô tả (thiếu skin/tướng/rank)</option>
            <option value="ACCOUNT_RECOVERED_BY_PREVIOUS_OWNER">Bị chủ cũ lấy lại tài khoản (bị back acc)</option>
            <option value="MISSING_RECOVERY_INFORMATION">Thiếu thông tin khôi phục / Mã 2FA</option>
            <option value="ACCOUNT_BANNED_OR_RESTRICTED">Tài khoản bị cấm / Khóa bởi nhà phát hành</option>
            <option value="OTHER">Lý do khác</option>
          </select>
        </div>

        {/* Desired Solution */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Phương án mong muốn</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'SUPPORT', label: 'Hỗ trợ kỹ thuật' },
              { id: 'REPLACEMENT', label: 'Đổi tài khoản khác' },
              { id: 'REFUND', label: 'Hoàn tiền' },
            ].map((sol) => (
              <button
                key={sol.id}
                type="button"
                onClick={() => setDesiredSolution(sol.id as any)}
                className={`py-2 px-2.5 rounded-xl border text-center transition-all ${
                  desiredSolution === sol.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {sol.label}
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Mô tả chi tiết sự cố</label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (error) setError('');
            }}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nêu rõ thông báo lỗi hiển thị khi đăng nhập hoặc sai lệch cụ thể..."
          />
        </div>

        {/* Evidence Image URL */}
        <div className="space-y-1">
          <label className="font-semibold text-slate-700">Hình ảnh bằng chứng (URL ảnh chụp màn hình lỗi)</label>
          <Input
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://... (nếu có, hoặc để trống sẽ dùng ảnh mẫu)"
          />
        </div>

        {/* Privacy Checkbox */}
        <label className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
          <input
            type="checkbox"
            checked={privacyAgreed}
            onChange={(e) => {
              setPrivacyAgreed(e.target.checked);
              if (error) setError('');
            }}
            className="mt-0.5 rounded text-blue-600"
          />
          <span className="text-[11px] text-slate-700 leading-snug">
            Tôi xác nhận rằng ảnh chụp màn hình và nội dung mô tả <strong>không làm lộ mật khẩu hoặc mã bí mật</strong> cho người ngoài.
          </span>
        </label>

        {error && (
          <p className="text-red-600 flex items-center gap-1 text-[11px]">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
            Hủy bỏ
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting} className="bg-red-600 hover:bg-red-700 text-white">
            {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
