import React, { useEffect, useState } from 'react';
import { adminApi } from '@marketplace/api-client';
import { formatCurrency } from '@marketplace/utils';
import {
  DollarSign,
  ShoppingBag,
  Users,
  Store,
  Clock,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export interface AdminDashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const data = await adminApi.getDashboard();
      setStats(data);
    }
    load();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Bảng Điều Khiển Ban Quản Trị</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Giám sát hoạt động toàn sàn, đối soát thanh toán SePay và hàng đợi phê duyệt
        </p>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng GMV Sàn (Tháng)</span>
            <div className="p-2 rounded-2xl bg-blue-50 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">
            {formatCurrency(stats?.gmv || 489000000)}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+24.5% so với cùng kỳ</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Doanh Thu Hoa Hồng (5%)</span>
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">
            {formatCurrency(stats?.revenue || 24450000)}
          </div>
          <p className="text-[11px] text-slate-400">Đã trừ chiết khấu voucher sàn</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Đơn Hàng Hoàn Tất</span>
            <div className="p-2 rounded-2xl bg-purple-50 text-purple-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.totalOrders || 142}</div>
          <p className="text-[11px] text-slate-400">Tỷ lệ thanh toán SePay thành công: 98.6%</p>
        </div>

        <div
          onClick={() => onNavigate('user-management')}
          className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3 cursor-pointer hover:border-purple-300 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Người Dùng Sàn</span>
            <div className="p-2 rounded-2xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.activeUsers || 1250} Người</div>
          <p className="text-[11px] text-purple-600 font-semibold flex items-center gap-1">
            <span>Quản lý & Chế tài người dùng</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* Moderation Pending Queues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Seller Queue */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Hàng Đợi Duyệt Gian Hàng Mới</h3>
                <p className="text-xs text-slate-400">Đơn vị kinh doanh đăng ký mở shop</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800">
              {stats?.pendingSellersCount || 1} Đang chờ
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Hồ sơ pháp lý, ảnh chụp CMND/CCCD và thông tin tài khoản ngân hàng thụ hưởng cần được xác minh trước khi cấp quyền bán hàng.
          </p>
          <button
            onClick={() => onNavigate('seller-approval')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <span>Đi đến hàng đợi duyệt Seller</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Product Queue */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Kiểm Duyệt Sản Phẩm Mới</h3>
                <p className="text-xs text-slate-400">Thông số kỹ thuật phần cứng & giá bán</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800">
              {stats?.pendingProductsCount || 0} Đang chờ
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Kiểm tra tính chính xác của chip CPU, RAM, GPU và chính sách bảo hành Serial/IMEI để đảm bảo chất lượng hàng hóa trên sàn.
          </p>
          <button
            onClick={() => onNavigate('product-moderation')}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <span>Đi đến hàng đợi duyệt sản phẩm</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
