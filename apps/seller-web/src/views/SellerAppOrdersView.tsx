import React, { useState, useEffect } from 'react';
import type { DigitalOrderListItem, AppDeliveryContent, DigitalOrderStatus } from '@marketplace/types';
import { sellerApi, appOrderApi } from '@marketplace/api-client';
import { FulfillmentTypeBadge, Price } from '@marketplace/ui';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Send,
  AlertTriangle,
  Mail,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

export const SellerAppOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<DigitalOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delivery Modal State
  const [selectedOrder, setSelectedOrder] = useState<DigitalOrderListItem | null>(null);
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [activationNotes, setActivationNotes] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await sellerApi.getSellerAppOrders();
      setOrders(list);
    } catch (err) {
      console.error('Failed to load seller app orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesStatus = statusFilter === 'all' || o.orderStatus === statusFilter;
    const buyerNameStr = o.buyerName || '';
    const matchesSearch =
      !searchQuery ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyerNameStr.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle Mark Activation Completed
  const handleConfirmActivation = async () => {
    if (!selectedOrder) return;
    setSubmittingAction(true);
    try {
      const deliveryPayload: Partial<AppDeliveryContent> = {
        orderId: selectedOrder.id,
        fulfillmentType: selectedOrder.fulfillmentType,
        targetEmail: (selectedOrder as any).buyerProvidedValues?.buyerEmail || selectedOrder.buyerName,
        instructions: [
          'Đã xử lý kích hoạt thành công gói cước trên hệ thống chính hãng.',
          activationNotes || 'Vui lòng đăng nhập hoặc kiểm tra hộp thư email để sử dụng dịch vụ.',
        ],
      };

      await appOrderApi.sellerMarkActivationCompleted(selectedOrder.id, deliveryPayload);
      setActionSuccessMessage(`Đã đánh dấu hoàn tất kích hoạt đơn hàng #${selectedOrder.id}`);
      setDeliveryModalOpen(false);
      setActivationNotes('');
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi cập nhật trạng thái đơn hàng.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Resend Invite
  const handleResendInvite = async (orderId: string) => {
    if (!window.confirm('Bạn có muốn gửi lại email lời mời cho người mua không?')) return;
    try {
      await appOrderApi.sellerResendInvite(orderId);
      alert('Đã kích hoạt gửi lại lời mời thành công!');
      await loadOrders();
    } catch (err: any) {
      alert(err.message || 'Không thể gửi lại lời mời.');
    }
  };

  const getStatusBadge = (status: DigitalOrderStatus) => {
    switch (status) {
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            Đang xử lý kích hoạt
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã bàn giao / Đã gửi lời mời
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            Hoàn tất thành công
          </span>
        );
      case 'DISPUTED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            Đang khiếu nại
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-emerald-600" />
            <span>Đơn Hàng Tài Khoản Ứng Dụng & AI</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý quy trình kích hoạt email, gửi lời mời nhóm family và kiểm tra trạng thái đơn hàng của người mua.
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors self-start sm:self-auto cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm mới</span>
        </button>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-xs font-bold shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Status Select */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái đơn</option>
            <option value="PROCESSING">Đang xử lý kích hoạt</option>
            <option value="DELIVERED">Đã bàn giao / Đã gửi lời mời</option>
            <option value="COMPLETED">Đã hoàn tất</option>
            <option value="DISPUTED">Đang khiếu nại</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo mã đơn, tên người mua, tên app..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Mã đơn & Ngày tạo</th>
                <th className="py-3.5 px-4">Sản phẩm & Gói cước</th>
                <th className="py-3.5 px-4">Hình thức</th>
                <th className="py-3.5 px-4">Người mua & Dữ liệu cung cấp</th>
                <th className="py-3.5 px-4">Số tiền</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Hành động xử lý</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    Chưa có đơn hàng tài khoản ứng dụng nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const buyerEmail =
                    (order as any).buyerProvidedValues?.buyerEmail ||
                    (order as any).buyerProvidedValues?.email ||
                    order.buyerName;

                  const orderTotal = order.totalAmount ?? order.total ?? 0;

                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">{order.id}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleString('vi-VN')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-bold text-slate-900 line-clamp-1">{order.productName}</p>
                        {order.planName && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 inline-block mt-0.5">
                            {order.planName}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <FulfillmentTypeBadge type={order.fulfillmentType || 'PRE_CREATED_ACCOUNT'} />
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-semibold text-slate-800">{order.buyerName || 'Khách mua'}</p>
                        {buyerEmail && (
                          <p className="text-[11px] text-emerald-700 font-mono mt-0.5 flex items-center gap-1">
                            <Mail className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{buyerEmail}</span>
                          </p>
                        )}
                        {(order as any).buyerProvidedValues &&
                          Object.entries((order as any).buyerProvidedValues)
                            .filter(([k]) => k !== 'buyerEmail' && k !== 'email')
                            .map(([k, v]) => (
                              <p key={k} className="text-[10px] text-slate-500 truncate">
                                {k}: <strong className="text-slate-700">{String(v)}</strong>
                              </p>
                            ))}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-black text-rose-600">
                          <Price amount={orderTotal} />
                        </span>
                      </td>

                      <td className="py-3.5 px-4">{getStatusBadge(order.orderStatus)}</td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* If email activation or family invitation and in PROCESSING state */}
                          {order.orderStatus === 'PROCESSING' &&
                            (order.fulfillmentType === 'BUYER_EMAIL_ACTIVATION' ||
                              order.fulfillmentType === 'FAMILY_OR_TEAM_INVITATION') && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(order);
                                  setDeliveryModalOpen(true);
                                }}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Xác nhận kích hoạt</span>
                              </button>
                            )}

                          {/* Resend invite button */}
                          {order.orderStatus === 'DELIVERED' &&
                            order.fulfillmentType === 'FAMILY_OR_TEAM_INVITATION' && (
                              <button
                                onClick={() => handleResendInvite(order.id)}
                                className="px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                title="Gửi lại thư mời cho người mua"
                              >
                                <Send className="w-3 h-3" />
                                <span>Gửi lại lời mời</span>
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM ACTIVATION MODAL */}
      {deliveryModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Xác nhận kích hoạt đơn #{selectedOrder.id}</span>
              </h3>
              <button
                onClick={() => setDeliveryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-xs border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Sản phẩm:</span>
                <span className="font-bold text-slate-900">{selectedOrder.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Gói cước:</span>
                <span className="font-semibold text-indigo-700">{selectedOrder.planName || 'Gói cước'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email người mua cung cấp:</span>
                <span className="font-mono font-bold text-emerald-700">
                  {(selectedOrder as any).buyerProvidedValues?.buyerEmail ||
                    (selectedOrder as any).buyerProvidedValues?.email ||
                    'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-slate-700">
                Ghi chú hoặc Hướng dẫn thêm cho người mua sau kích hoạt:
              </label>
              <textarea
                rows={3}
                value={activationNotes}
                onChange={(e) => setActivationNotes(e.target.value)}
                placeholder="VD: Đã kích hoạt 1 năm Google One 2TB, vui lòng vào mail kiểm tra thông báo nâng cấp dung lượng..."
                className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setDeliveryModalOpen(false)}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmActivation}
                disabled={submittingAction}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors cursor-pointer disabled:bg-emerald-400"
              >
                {submittingAction ? 'Đang cập nhật...' : 'Xác nhận Đã Kích Hoạt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
