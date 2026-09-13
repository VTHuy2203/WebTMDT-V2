import React, { useEffect, useState } from 'react';
import type { Order } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { StatusBadge } from '@marketplace/ui';
import { formatCurrency, formatDate } from '@marketplace/utils';

export const AdminOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function load() {
      const data = await adminApi.getAllOrders();
      setOrders(data);
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Quản Trị Toàn Bộ Đơn Hàng Sàn TMĐT</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Danh sách đơn hàng của tất cả người mua và người bán trên hệ thống
        </p>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {orders.map((ord) => (
          <div key={ord.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-blue-600 block">#{ord.orderCode}</span>
                <span className="font-semibold text-slate-800 text-[11px]">{ord.shop.name}</span>
              </div>
              <StatusBadge status={ord.status} />
            </div>

            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
              <div className="text-slate-700 font-medium line-clamp-1">{ord.items[0]?.productName}</div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Người nhận: {ord.shippingAddress.recipientName} ({ord.shippingAddress.phoneNumber})</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                {ord.paymentMethod === 'SEPAY_QR' ? 'SePay VietQR' : 'COD'}
              </span>
              <span className="font-black text-slate-900 text-sm">{formatCurrency(ord.total)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table (>= md: iPad & Desktop) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 min-w-[130px]">Mã Đơn Hàng</th>
                <th className="p-4 min-w-[160px]">Gian Hàng</th>
                <th className="p-4 min-w-[160px]">Khách Hàng</th>
                <th className="p-4 min-w-[180px]">Sản Phẩm</th>
                <th className="p-4 min-w-[130px]">Tổng Tiền</th>
                <th className="p-4 min-w-[120px]">Thanh Toán</th>
                <th className="p-4 min-w-[110px] text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {orders.map((ord) => (
                <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4 font-mono font-bold text-blue-600">#{ord.orderCode}</td>
                  <td className="p-4 font-semibold text-slate-800">{ord.shop.name}</td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-900 block">{ord.shippingAddress.recipientName}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{ord.shippingAddress.phoneNumber}</span>
                  </td>
                  <td className="p-4 text-slate-700">{ord.items[0]?.productName}</td>
                  <td className="p-4 font-bold text-slate-900">{formatCurrency(ord.total)}</td>
                  <td className="p-4 text-slate-600">
                    {ord.paymentMethod === 'SEPAY_QR' ? 'SePay VietQR' : 'COD'}
                  </td>
                  <td className="p-4 text-right">
                    <StatusBadge status={ord.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
