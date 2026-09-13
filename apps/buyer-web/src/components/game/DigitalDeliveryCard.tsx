import React from 'react';
import type { GameAccountProduct } from '@marketplace/types';
import { Zap, Clock, ShieldCheck, Key, FileText } from 'lucide-react';

export interface DigitalDeliveryCardProps {
  product: GameAccountProduct;
}

export const DigitalDeliveryCard: React.FC<DigitalDeliveryCardProps> = ({ product }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <Zap className="w-5 h-5 text-emerald-600" />
        <div>
          <h2 className="text-base font-bold text-slate-900">Cách Thức Giao Nhận & Bảo Hành</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quy trình bàn giao kỹ thuật số bảo mật</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 space-y-1.5">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>Phương Thức Giao</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">
            {product.deliveryMode === 'AUTO_AFTER_PAYMENT' ? 'Giao Tự Động 24/7' : 'Người Bán Xác Nhận'}
          </div>
          <p className="text-[11px] text-slate-600">
            {product.deliveryMode === 'AUTO_AFTER_PAYMENT'
              ? 'Hệ thống tự động cấp tài khoản ngay sau khi thanh toán qua QR thành công.'
              : `Người bán sẽ liên hệ và bàn giao trong khoảng ${product.deliveryEstimateMinutes || 15} phút.`}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1.5">
          <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Thời Gian Nhận</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">
            {product.deliveryMode === 'AUTO_AFTER_PAYMENT' ? 'Tức thì (< 1 phút)' : `${product.deliveryEstimateMinutes || 15} Phút`}
          </div>
          <p className="text-[11px] text-slate-600">
            Xem trực tiếp tại trang chi tiết đơn hàng của bạn trong mục "Nội dung giao hàng".
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1.5">
          <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Thời Hạn Bảo Hành</span>
          </div>
          <div className="text-sm font-extrabold text-slate-900">
            {product.warrantyHours > 0 ? `${product.warrantyHours} Giờ` : 'Bảo đảm khi nhận'}
          </div>
          <p className="text-[11px] text-slate-600">
            Hỗ trợ 1 đổi 1 hoặc hoàn tiền nếu tài khoản bị khóa trước khi giao hoặc sai mô tả.
          </p>
        </div>
      </div>

      {/* What buyer will receive */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
        <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
          <Key className="w-4 h-4 text-slate-600" />
          <span>Thông tin bạn sẽ nhận được sau khi thanh toán:</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Tên đăng nhập / Email quản trị
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Mật khẩu chính thức
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Mã khôi phục / Recovery Code (nếu có)
          </li>
          <li className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
            Hướng dẫn chuyển quyền sở hữu và bảo vệ tài khoản
          </li>
        </ul>
      </div>
    </div>
  );
};
