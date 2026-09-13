import React, { useEffect, useState } from 'react';
import type { DigitalOrderListItem, DigitalDispute } from '@marketplace/types';
import { sellerApi, digitalDisputeApi, digitalDeliveryApi } from '@marketplace/api-client';
import { DigitalDeliveryBadge } from '@marketplace/ui';
import {
  ShoppingBag,
  Search,
  Filter,
  RefreshCw,
  Eye,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Send,
} from 'lucide-react';

export const SellerDigitalOrdersView: React.FC = () => {
  const [orders, setOrders] = useState<DigitalOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dispute & Detail modal
  const [selectedOrder, setSelectedOrder] = useState<DigitalOrderListItem | null>(null);
  const [dispute, setDispute] = useState<DigitalDispute | null>(null);
  const [sellerReply, setSellerReply] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const list = await sellerApi.getDigitalOrders();
      setOrders(list);
    } catch (err) {
      console.error('Failed to load digital orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOpenDetail = async (order: DigitalOrderListItem) => {
    setSelectedOrder(order);
    setSellerReply('');
    setDispute(null);
    if (order.disputeStatus) {
      try {
        const disputes = await digitalDisputeApi.getDisputes('SELLER');
        setDispute(disputes.find((item) => item.orderId === order.id) ?? null);
      } catch (err) {
        console.error('Failed to load dispute:', err);
      }
    }
  };

  const handleSendSellerReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispute || !sellerReply.trim()) return;
    setSendingReply(true);
    try {
      const updated = await digitalDisputeApi.sellerRespond(dispute.id, sellerReply.trim());
      setDispute(updated);
      setSellerReply('');
    } catch (err: any) {
      alert(err.message || 'Lỗi khi gửi phản hồi tranh chấp.');
    } finally {
      setSendingReply(false);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const buyer = o.buyerName || '';
    const matchesSearch =
      searchQuery === '' ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buyer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || o.deliveryStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShoppingBag className="w-7 h-7 text-indigo-600" />
            Đơn Hàng Tài Khoản Game (Digital Orders)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi trạng thái giao mã đăng nhập và xử lý khiếu nại của khách hàng
          </p>
        </div>

        <button
          onClick={loadOrders}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors self-end sm:self-auto"
          title="Tải lại danh sách"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        <div className="w-full md:flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn, tên tài khoản, tên người mua..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả trạng thái bàn giao</option>
            <option value="READY">Sẵn sàng (Chưa mở xem)</option>
            <option value="REVEALED">Khách đã mở thông tin mật</option>
            <option value="REPORTED">Đang có khiếu nại (Reported)</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[950px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 min-w-[120px]">Mã đơn</th>
                <th className="px-6 py-3.5 min-w-[220px]">Sản phẩm tài khoản</th>
                <th className="px-6 py-3.5 min-w-[140px]">Người mua</th>
                <th className="px-6 py-3.5 min-w-[120px]">Giá trị</th>
                <th className="px-6 py-3.5 min-w-[160px]">Trạng thái bàn giao</th>
                <th className="px-6 py-3.5 min-w-[130px]">Tranh chấp</th>
                <th className="px-6 py-3.5 min-w-[120px]">Ngày mua</th>
                <th className="px-6 py-3.5 min-w-[110px] text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách đơn hàng...
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Chưa có đơn hàng tài khoản game nào.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800">
                      {ord.id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 line-clamp-1">
                        {ord.productName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {ord.buyerName || 'Khách hàng'}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600 text-xs">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(ord.totalAmount || ord.total || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <DigitalDeliveryBadge status={ord.deliveryStatus} />
                    </td>
                    <td className="px-6 py-4">
                      {ord.disputeStatus ? (
                        <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800 flex items-center gap-1 w-fit">
                          <AlertTriangle className="w-3 h-3" />
                          {ord.disputeStatus}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {new Date(ord.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetail(ord)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL & DISPUTE MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Chi tiết đơn #{selectedOrder.id}</h3>
                <span className="text-xs text-slate-500">{selectedOrder.productName}</span>
              </div>
              <DigitalDeliveryBadge status={selectedOrder.deliveryStatus} />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl">
                <div>
                  <span className="text-slate-500 block">Người mua:</span>
                  <span className="font-semibold text-slate-800">{selectedOrder.buyerName || 'Khách hàng'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Số tiền:</span>
                  <span className="font-bold text-indigo-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(selectedOrder.totalAmount || selectedOrder.total || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Ngày đặt:</span>
                  <span className="text-slate-800">{new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Bảo mật Vault:</span>
                  <span className="text-slate-800 font-semibold">Tự động khóa & mã hoá</span>
                </div>
              </div>

              {/* Dispute Section if present */}
              {selectedOrder.disputeStatus && (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-rose-800 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                    Khiếu nại từ người mua ({selectedOrder.disputeStatus})
                  </div>

                  {dispute && (
                    <div className="space-y-2 text-xs text-rose-950">
                      <div>
                        <strong>Loại sự cố:</strong> {dispute.issueType}
                      </div>
                      <div>
                        <strong>Mô tả của người mua:</strong>
                        <p className="mt-1 p-2 bg-white/80 rounded border border-rose-100">{dispute.description}</p>
                      </div>
                      <div>
                        <strong>Yêu cầu mong muốn:</strong> {dispute.desiredSolution}
                      </div>

                      {/* Evidence Images */}
                      {dispute.evidenceImages && dispute.evidenceImages.length > 0 && (
                        <div>
                          <strong>Ảnh bằng chứng:</strong>
                          <div className="flex gap-2 mt-1">
                            {dispute.evidenceImages.map((img, idx) => (
                              <a key={idx} href={img} target="_blank" rel="noreferrer">
                                <img src={img} alt="Evidence" className="w-16 h-16 object-cover rounded border border-rose-300" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Seller Response Form */}
                      <form onSubmit={handleSendSellerReply} className="mt-3 pt-3 border-t border-rose-200">
                        <label className="block font-bold text-slate-800 mb-1">
                          Phản hồi của Shop tới Người mua & Admin:
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={sellerReply}
                            onChange={(e) => setSellerReply(e.target.value)}
                            placeholder="Nhập thông tin đối chất, cấp pass mới hoặc đồng ý hoàn tiền..."
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500"
                          />
                          <button
                            type="submit"
                            disabled={sendingReply || !sellerReply.trim()}
                            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg text-xs flex items-center gap-1 hover:bg-indigo-700 disabled:opacity-50"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Gửi
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-5 border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
