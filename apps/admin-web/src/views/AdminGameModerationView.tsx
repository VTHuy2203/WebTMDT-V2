import React, { useEffect, useState } from 'react';
import type { GameAccountProduct } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { GamePlatformBadge } from '@marketplace/ui';
import {
  Gamepad2,
  CheckCircle2,
  XCircle,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Eye,
  ShieldAlert,
} from 'lucide-react';

export const AdminGameModerationView: React.FC = () => {
  const [products, setProducts] = useState<GameAccountProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Action modal
  const [selectedProduct, setSelectedProduct] = useState<GameAccountProduct | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'HIDE' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getGameAccountProducts();
      setProducts(list);
    } catch (err) {
      console.error('Failed to load game products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleActionClick = (product: GameAccountProduct, type: 'APPROVE' | 'REJECT' | 'HIDE') => {
    setSelectedProduct(product);
    setActionType(type);
    setActionReason('');
  };

  const handleConfirmAction = async () => {
    if (!selectedProduct || !actionType) return;
    if ((actionType === 'REJECT' || actionType === 'HIDE') && !actionReason.trim()) {
      alert('Vui lòng nhập lý do từ chối hoặc ẩn bài đăng.');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.reviewGameAccountProduct(selectedProduct.id, actionType, actionReason.trim());
      setSelectedProduct(null);
      setActionType(null);
      setActionReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Thao tác thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const gameTitle = p.gameName || p.game?.name || '';
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      gameTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.moderationStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getModerationBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Đã duyệt</span>;
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Chờ duyệt</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-100 text-rose-800">Từ chối</span>;
      case 'SUSPENDED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">Đã ẩn</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Gamepad2 className="w-7 h-7 text-purple-600" />
            Kiểm Duyệt Sản Phẩm Tài Khoản Game
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm duyệt thông tin, hình ảnh chụp màn hình che mờ thông tin nhạy cảm và điều khoản bảo hành
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors self-end sm:self-auto"
          title="Tải lại"
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
            placeholder="Tìm theo mã tin, tên bài đăng, tựa game..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tất cả trạng thái duyệt</option>
            <option value="PENDING">Chờ duyệt (Pending)</option>
            <option value="APPROVED">Đã duyệt (Approved)</option>
            <option value="REJECTED">Bị từ chối (Rejected)</option>
            <option value="SUSPENDED">Tạm ẩn (Suspended)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[950px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 min-w-[110px]">Mã tin</th>
                <th className="px-6 py-3.5 min-w-[220px]">Tiêu đề tài khoản</th>
                <th className="px-6 py-3.5 min-w-[140px]">Tựa game</th>
                <th className="px-6 py-3.5 min-w-[110px]">Hệ máy</th>
                <th className="px-6 py-3.5 min-w-[120px]">Giá bán</th>
                <th className="px-6 py-3.5 min-w-[120px]">Bảo hành</th>
                <th className="px-6 py-3.5 min-w-[140px]">Trạng thái duyệt</th>
                <th className="px-6 py-3.5 min-w-[130px] text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-600" />
                    Đang tải danh sách kiểm duyệt...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    Không có sản phẩm nào cần kiểm duyệt hoặc không khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{p.id}</td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900 line-clamp-1">{p.name}</span>
                      <span className="text-xs text-slate-400">Server: {p.server}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{p.gameName || p.game?.name}</td>
                    <td className="px-6 py-4">
                      <GamePlatformBadge platform={p.platform} />
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600 text-xs">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(p.price || p.basePrice || 0)}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-emerald-600">
                      {p.warrantyPeriodHours || p.warrantyHours || 0}h
                    </td>
                    <td className="px-6 py-4">{getModerationBadge(p.moderationStatus || 'APPROVED')}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.moderationStatus !== 'APPROVED' && (
                          <button
                            onClick={() => handleActionClick(p, 'APPROVE')}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="Phê duyệt"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        )}
                        {p.moderationStatus !== 'REJECTED' && (
                          <button
                            onClick={() => handleActionClick(p, 'REJECT')}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                            title="Từ chối"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                        {p.moderationStatus === 'APPROVED' && (
                          <button
                            onClick={() => handleActionClick(p, 'HIDE')}
                            className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg"
                            title="Tạm ẩn"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CONFIRM / REASON MODAL */}
      {selectedProduct && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {actionType === 'APPROVE' && 'Phê duyệt tài khoản game'}
              {actionType === 'REJECT' && 'Từ chối đăng bán tài khoản'}
              {actionType === 'HIDE' && 'Tạm ẩn bài đăng tài khoản'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Mã tin: <span className="font-mono font-semibold">{selectedProduct.id}</span> - {selectedProduct.name}
            </p>

            {actionType === 'APPROVE' ? (
              <p className="text-sm text-slate-600 mb-5">
                Bạn có chắc chắn muốn duyệt bài đăng này lên sàn cho khách hàng tìm kiếm và mua?
              </p>
            ) : (
              <div className="space-y-3 mb-5">
                <label className="block text-xs font-bold text-slate-700">
                  Lý do {actionType === 'REJECT' ? 'từ chối' : 'tạm ẩn'} *
                </label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Ví dụ: Ảnh chụp màn hình chưa che mờ UID / email, thông tin bảo hành không rõ ràng..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`px-5 py-2 text-sm font-bold text-white rounded-xl shadow-sm disabled:opacity-50 ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {submitting ? 'Đang xử lý...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
