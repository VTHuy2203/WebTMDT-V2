import React from 'react';
import { AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';

export interface RiskNoticeProps {
  className?: string;
}

export const RiskNotice: React.FC<RiskNoticeProps> = ({ className = '' }) => {
  return (
    <div className={`rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs space-y-2.5 ${className}`}>
      <div className="flex items-center gap-2 text-amber-900 font-bold">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <span>Lưu Ý Rủi Ro & Nguyên Tắc Giao Dịch An Toàn</span>
      </div>

      <div className="space-y-1.5 text-slate-700 leading-relaxed text-[11px]">
        <p>
          • <strong>Điều khoản nhà phát hành:</strong> Một số nhà phát hành game có điều khoản hạn chế chuyển nhượng tài khoản. Người mua vui lòng tìm hiểu kỹ chính sách game trước khi đặt mua.
        </p>
        <p>
          • <strong>Giao dịch qua sàn bảo đảm:</strong> Mọi thanh toán chỉ thực hiện qua hệ thống SePay VietQR tự động của sàn. Tuyệt đối <strong>không giao dịch, chuyển khoản hoặc liên hệ Zalo/Telegram bên ngoài</strong> để tránh bị lừa đảo chiếm đoạt tài sản.
        </p>
        <p>
          • <strong>Kiểm tra ngay khi nhận:</strong> Hãy đăng nhập và đổi mật khẩu/email liên kết ngay khi hệ thống bàn giao tài khoản để đảm bảo quyền sở hữu trọn vẹn.
        </p>
      </div>

      <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-amber-800 font-medium">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Tiền được bảo vệ bởi sàn cho đến khi bạn xác nhận hài lòng hoặc hết hạn bảo hành.
        </span>
      </div>
    </div>
  );
};
