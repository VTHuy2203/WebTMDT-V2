import React, { useEffect, useState } from 'react';
import { sellerApi } from '@marketplace/api-client';
import { formatCurrency } from '@marketplace/utils';
import { Button, StatusBadge } from '@marketplace/ui';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  TrendingUp,
  Star,
  ArrowUpRight,
  Package,
} from 'lucide-react';

export interface SellerDashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const SellerDashboardView: React.FC<SellerDashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const [dash, ords] = await Promise.all([
        sellerApi.getDashboard(),
        sellerApi.getOrders(),
      ]);
      setStats(dash);
      setOrders(ords);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tổng Quan Gian Hàng</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi hiệu suất bán hàng công nghệ và trạng thái xử lý đơn hàng
          </p>
        </div>
        <Button onClick={() => onNavigate('product-new')} size="sm" className="flex items-center gap-1.5">
          <span>+ Đăng sản phẩm mới</span>
        </Button>
      </div>

      {/* Compliance & Policy Status Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 text-amber-950 flex items-start gap-3.5 text-xs shadow-xs">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 font-bold text-slate-900 flex-wrap">
            <span>Chỉ Số Vận Hành & Tuân Thủ Chính Sách (Sao Quả Tạ)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-200">
              ✓ Điểm phạt: 0 / 15 (Hoạt động tốt)
            </span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            Gian hàng của bạn hiện không có vi phạm hoặc án phạt nào từ Ban Quản Trị sàn. Hãy luôn đảm bảo bảo hành đúng hạn, giữ mật khẩu tài khoản bảo mật và hỗ trợ người mua kịp thời để duy trì huy hiệu uy tín.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Doanh Thu Tháng Này</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(stats?.revenue || 145800000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+18.4% so với tháng trước</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Đơn Hàng Đã Bán</span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.ordersCount || 48}</div>
          <p className="text-[11px] text-slate-400">Tỷ lệ hủy đơn: 1.2% (Rất tốt)</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Cần Chuẩn Bị Hàng</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-600">{stats?.pendingShipmentCount || 5}</div>
          <p className="text-[11px] text-slate-400">Đơn đã thanh toán qua SePay VietQR</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Cảnh Báo Hết Hàng</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600">{stats?.lowStockCount || 2} SKU</div>
          <button
            onClick={() => onNavigate('inventory')}
            className="text-[11px] font-semibold text-blue-600 hover:underline"
          >
            Xem danh sách kho →
          </button>
        </div>
      </div>

      {/* Finance Quick Bar */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 font-semibold">Số dư khả dụng có thể rút ngay về ngân hàng:</span>
          <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 mt-1">
            {formatCurrency(82500000)}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Đang giữ ký quỹ (escrow cho các đơn đang giao): <strong>{formatCurrency(62600000)}</strong>
          </p>
        </div>
        <Button
          onClick={() => onNavigate('finance')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
        >
          <span>Tạo Lệnh Rút Tiền</span>
          <ArrowUpRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-sm text-slate-900">Đơn Hàng Cần Xử Lý Gần Đây</h3>
          </div>
          <button
            onClick={() => onNavigate('orders')}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            Xem tất cả đơn →
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {orders.slice(0, 3).map((ord) => (
            <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
              <div>
                <span className="font-mono font-bold text-blue-600">#{ord.orderCode}</span>
                <p className="font-semibold text-slate-900 mt-0.5">{ord.items[0]?.productName}</p>
                <p className="text-slate-400 text-[11px]">{ord.shippingAddress?.recipientName} • {ord.shippingAddress?.phoneNumber}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="font-bold text-slate-900 block">{formatCurrency(ord.total)}</span>
                <StatusBadge status={ord.status} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
