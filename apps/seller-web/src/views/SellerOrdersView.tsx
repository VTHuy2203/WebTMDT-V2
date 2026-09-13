import React, { useEffect, useState } from 'react';
import type { Order } from '@marketplace/types';
import { sellerApi } from '@marketplace/api-client';
import { Button, StatusBadge } from '@marketplace/ui';
import { formatCurrency, formatDate } from '@marketplace/utils';
import { Package, Truck, CheckCircle2, ShieldCheck } from 'lucide-react';

export const SellerOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await sellerApi.getOrders(selectedStatus);
        setOrders(data);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [selectedStatus]);

  const handleUpdateStatus = async (orderId: string, nextStatus: Order['status']) => {
    await sellerApi.updateOrderStatus(orderId, nextStatus);
    const updated = await sellerApi.getOrders(selectedStatus);
    setOrders(updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Quản Lý Đơn Hàng Của Shop</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xác nhận thanh toán SePay, dán mã vận đơn và giao hàng cho shipper
          </p>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-200">
        {['ALL', 'PROCESSING', 'READY_TO_SHIP', 'SHIPPING', 'COMPLETED'].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedStatus === st
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {st === 'ALL'
              ? 'Tất cả'
              : st === 'PROCESSING'
              ? 'Chờ đóng gói'
              : st === 'READY_TO_SHIP'
              ? 'Chờ lấy hàng'
              : st === 'SHIPPING'
              ? 'Đang giao'
              : 'Hoàn thành'}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {orders.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-blue-600 text-sm">#{order.orderCode}</span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">{formatDate(order.createdAt, true)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  {order.paymentMethod === 'SEPAY_QR' ? 'VietQR SePay (Đã khớp tiền)' : 'COD'}
                </span>
                <StatusBadge status={order.status} />
              </div>
            </div>

            {/* Recipient & Items */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 text-xs">
              <div className="md:col-span-8 space-y-3">
                <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Thiết bị cần đóng gói ({order.items.length})
                </h4>
                {order.items.map((i) => (
                  <div key={i.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <img src={i.thumbnail} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                      <div>
                        <p className="font-bold text-slate-900">{i.productName}</p>
                        <p className="text-slate-500">{i.variantName} x{i.quantity}</p>
                        {i.serialNumber && (
                          <span className="text-[10px] font-mono text-blue-700 font-semibold">
                            Serial: {i.serialNumber}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{formatCurrency(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="md:col-span-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                  Thông tin người nhận
                </h4>
                <p className="font-bold text-slate-800">{order.shippingAddress.recipientName}</p>
                <p className="text-slate-600 font-mono">{order.shippingAddress.phoneNumber}</p>
                <p className="text-slate-500 leading-relaxed">
                  {order.shippingAddress.streetAddress}, {order.shippingAddress.ward},{' '}
                  {order.shippingAddress.district}, {order.shippingAddress.province}
                </p>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
                  <span>Tổng tiền thu:</span>
                  <span className="text-red-600">{formatCurrency(order.total)}</span>
                </div>
              </div>
            </div>

            {/* Actions for Seller */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              {order.status === 'PROCESSING' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(order.id, 'READY_TO_SHIP')}
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5" />
                  <span>Xác nhận đã đóng hộp & Dán tem bảo hành</span>
                </Button>
              )}

              {order.status === 'READY_TO_SHIP' && (
                <Button
                  size="sm"
                  onClick={() => handleUpdateStatus(order.id, 'SHIPPING')}
                  className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5"
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Bàn giao cho Shipper AhaMove</span>
                </Button>
              )}

              {order.status === 'SHIPPING' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                  className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Xác nhận đã giao — chờ người mua xác nhận
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
