import React, { useEffect, useState } from 'react';
import type { AppAccountProduct, BuyerFieldDefinition } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { FulfillmentTypeBadge, Price } from '@marketplace/ui';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  Eye,
  ShieldAlert,
  Clock,
  Key,
  Info,
} from 'lucide-react';

const FORBIDDEN_SECURITY_TERMS = [
  'password', 'pass', 'mat khau', 'mật khẩu', 'pwd',
  'otp', 'ma otp', 'mã otp', 'pin', 'cvv', 'cvc', 'security code',
  'two-factor', '2fa code', 'xac nhan', 'xác thực',
];

export const AdminAppModerationView: React.FC = () => {
  const [products, setProducts] = useState<AppAccountProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Inspection Modal
  const [inspectingProduct, setInspectingProduct] = useState<AppAccountProduct | null>(null);

  // Action Modal
  const [selectedProduct, setSelectedProduct] = useState<AppAccountProduct | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'HIDE' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getAppAccountProducts();
      setProducts(list);
    } catch (err) {
      console.error('Failed to load app products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleActionClick = (product: AppAccountProduct, type: 'APPROVE' | 'REJECT' | 'HIDE') => {
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
      await adminApi.reviewAppAccountProduct(selectedProduct.id, actionType, actionReason);
      setSelectedProduct(null);
      setActionType(null);
      setActionReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thực hiện thao tác kiểm duyệt.');
    } finally {
      setSubmitting(false);
    }
  };

  // Security scanner check on fields
  const detectSecurityRisks = (product: AppAccountProduct): string[] => {
    const risks: string[] = [];
    for (const plan of product.plans || []) {
      for (const f of plan.requiredBuyerFields || []) {
        const text = `${f.key} ${f.label} ${f.helpText || ''}`.toLowerCase();
        for (const term of FORBIDDEN_SECURITY_TERMS) {
          if (text.includes(term)) {
            risks.push(`[${plan.name}] Trường "${f.label}" chứa từ cấm "${term}".`);
          }
        }
      }
    }
    return risks;
  };

  const filteredProducts = products.filter((p) => {
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.applicationName && p.applicationName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.shop?.name && p.shop.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span>Kiểm Duyệt Sản Phẩm Tài Khoản Ứng Dụng & AI</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Duyệt sản phẩm đa gói cước, kiểm tra an toàn bảo mật các trường thu thập thông tin người mua.
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-2 text-slate-500 hover:text-slate-800 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold shadow-xs"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Làm mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
          >
            <option value="all">Tất cả trạng thái duyệt</option>
            <option value="PENDING_REVIEW">Chờ kiểm duyệt</option>
            <option value="ACTIVE">Đang hoạt động</option>
            <option value="REJECTED">Đã từ chối</option>
            <option value="HIDDEN">Đang bị ẩn</option>
          </select>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên sản phẩm, ứng dụng, gian hàng..."
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[950px] text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 min-w-[220px]">Sản phẩm & Ứng dụng</th>
                <th className="py-3.5 px-4 min-w-[150px]">Gian hàng bán</th>
                <th className="py-3.5 px-4 min-w-[110px]">Số gói cước</th>
                <th className="py-3.5 px-4 min-w-[110px]">Giá từ</th>
                <th className="py-3.5 px-4 min-w-[160px]">Quét rủi ro bảo mật</th>
                <th className="py-3.5 px-4 min-w-[120px]">Trạng thái</th>
                <th className="py-3.5 px-4 min-w-[140px] text-right">Thao tác duyệt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Đang tải danh sách sản phẩm...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-slate-400">
                    Không có sản phẩm nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const risks = detectSecurityRisks(p);
                  const minPrice =
                    p.plans && p.plans.length > 0
                      ? Math.min(...p.plans.map((pl) => pl.price))
                      : (p as any).price || 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.thumbnail || p.images?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'}
                            alt={p.name}
                            className="w-10 h-10 rounded-xl object-contain border border-slate-200 p-1 bg-white flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 line-clamp-1">{p.name}</p>
                            <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 inline-block mt-0.5">
                              {p.applicationName || 'App'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{p.shop?.name || 'Gian hàng'}</p>
                        <p className="text-[10px] text-slate-400">{p.shop?.isOfficial ? 'Shop Official' : 'Đối tác'}</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-700">{p.plans?.length || 1} gói cước</span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-rose-600">
                          <Price amount={minPrice} />
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        {risks.length > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>Cảnh báo: {risks.length} trường nhạy cảm!</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>An toàn</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {(p.status === 'PENDING_REVIEW' || (p.status as any) === 'PENDING') && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Chờ duyệt
                          </span>
                        )}
                        {p.status === 'ACTIVE' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Hoạt động
                          </span>
                        )}
                        {p.status === 'REJECTED' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Đã từ chối
                          </span>
                        )}
                        {p.status === 'HIDDEN' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                            <EyeOff className="w-3.5 h-3.5" />
                            Đang ẩn
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setInspectingProduct(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 cursor-pointer"
                            title="Xem chi tiết các gói"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {p.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleActionClick(p, 'APPROVE')}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Duyệt
                            </button>
                          )}

                          {p.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleActionClick(p, 'REJECT')}
                              className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors cursor-pointer"
                            >
                              Từ chối
                            </button>
                          )}

                          {p.status === 'ACTIVE' && (
                            <button
                              onClick={() => handleActionClick(p, 'HIDE')}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                              title="Tạm ẩn sản phẩm"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
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

      {/* INSPECTION MODAL */}
      {inspectingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Chi tiết kiểm duyệt: {inspectingProduct.name}</span>
              </h3>
              <button
                onClick={() => setInspectingProduct(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <p><strong>Mô tả:</strong> {inspectingProduct.description}</p>
                <p><strong>Chính sách bảo hành:</strong> {inspectingProduct.warrantyPolicy || 'N/A'}</p>
              </div>

              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Danh sách {inspectingProduct.plans?.length || 0} gói cước:
              </h4>

              <div className="space-y-3">
                {inspectingProduct.plans?.map((pl, idx) => (
                  <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-900">{pl.name}</span>
                      <FulfillmentTypeBadge type={pl.fulfillmentType} />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Giá bán:</span>
                        <span className="font-bold text-rose-600"><Price amount={pl.price} /></span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Thời hạn:</span>
                        <span className="font-semibold text-slate-800">
                          {pl.serviceDuration?.value} {pl.serviceDuration?.unit}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Bảo hành:</span>
                        <span className="font-semibold text-emerald-700">
                          {pl.warrantyDuration?.value} {pl.warrantyDuration?.unit}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Trạng thái:</span>
                        <span className="font-semibold text-slate-800">{pl.status || 'ACTIVE'}</span>
                      </div>
                    </div>

                    {/* Buyer Fields in Plan */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Key className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Trường dữ liệu yêu cầu người mua cung cấp ({pl.requiredBuyerFields?.length || 0}):</span>
                      </span>

                      {pl.requiredBuyerFields && pl.requiredBuyerFields.length > 0 ? (
                        <div className="space-y-1">
                          {pl.requiredBuyerFields.map((f, fIdx) => {
                            const isViolated = FORBIDDEN_SECURITY_TERMS.some((t) =>
                              `${f.key} ${f.label} ${f.helpText || ''}`.toLowerCase().includes(t)
                            );
                            return (
                              <div
                                key={fIdx}
                                className={`flex items-center justify-between p-2 rounded-lg border text-[11px] ${
                                  isViolated
                                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-700'
                                }`}
                              >
                                <div>
                                  <span className="font-bold">{f.label}</span>{' '}
                                  <span className="text-slate-400 font-mono">({f.key})</span>
                                  {f.helpText && <p className="text-[10px] text-slate-500 mt-0.5">{f.helpText}</p>}
                                </div>
                                {isViolated && (
                                  <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded">
                                    VI PHẠM BẢO MẬT
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 italic">Không yêu cầu thông tin nào.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setInspectingProduct(null)}
                className="px-5 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTION MODAL */}
      {selectedProduct && actionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              {actionType === 'APPROVE' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              {actionType === 'REJECT' && <XCircle className="w-5 h-5 text-rose-600" />}
              {actionType === 'HIDE' && <EyeOff className="w-5 h-5 text-amber-600" />}
              <span>
                {actionType === 'APPROVE' && 'Xác nhận Duyệt Sản Phẩm'}
                {actionType === 'REJECT' && 'Từ Chối Sản Phẩm'}
                {actionType === 'HIDE' && 'Tạm Ẩn Sản Phẩm'}
              </span>
            </h3>

            <p className="text-xs text-slate-600">
              Bạn đang thao tác với sản phẩm: <strong>{selectedProduct.name}</strong> của{' '}
              <strong>{selectedProduct.shop?.name}</strong>.
            </p>

            {(actionType === 'REJECT' || actionType === 'HIDE') && (
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700">Lý do xử lý (Sẽ gửi thông báo cho shop) *</label>
                <textarea
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Nhập lý do chi tiết..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSelectedProduct(null);
                  setActionType(null);
                }}
                className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                disabled={submitting}
                className={`px-6 py-2 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50 ${
                  actionType === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : actionType === 'REJECT'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-amber-600 hover:bg-amber-700'
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
