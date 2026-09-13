import React, { useState } from 'react';
import type { Order } from '@marketplace/types';
import { Button, StatusBadge, Modal, EmptyState } from '@marketplace/ui';
import { RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

export interface ReturnsViewProps {
  onContinueShopping: () => void;
}

export const ReturnsView: React.FC<ReturnsViewProps> = ({ onContinueShopping }) => {
  const [activeTab, setActiveTab] = useState('ALL');

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Yêu Cầu Trả Hàng & Hoàn Tiền
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quy trình xử lý hoàn tiền minh bạch, bảo vệ quyền lợi người mua hàng công nghệ
        </p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-blue-600" />
          <span>Chính Sách Đổi Trả Đồ Điện Tử</span>
        </h3>
        <p>• Hỗ trợ trả hàng trong vòng <strong>7 - 30 ngày</strong> kể từ khi đơn hàng giao thành công.</p>
        <p>• Áp dụng khi thiết bị: Giao sai mẫu mã/cấu hình, lỗi phần cứng nhà sản xuất, bể vỡ do vận chuyển.</p>
        <p>• Tiền hoàn sẽ được chuyển tự động về tài khoản ngân hàng sau khi đơn vị thẩm định nhận lại hàng.</p>
      </div>

      <EmptyState
        title="Bạn chưa có yêu cầu trả hàng / hoàn tiền nào"
        description="Nếu đơn hàng của bạn gặp lỗi phần cứng hoặc sự cố, hãy vào chi tiết Đơn hàng và nhấn 'Yêu cầu trả hàng / Hoàn tiền'."
        actionText="Xem danh sách đơn hàng"
        onAction={onContinueShopping}
      />
    </div>
  );
};
