import React, { useEffect, useState } from 'react';
import type { GameAccountInventoryItemSummary, GameAccountProduct } from '@marketplace/types';
import { gameInventoryApi, sellerApi } from '@marketplace/api-client';
import { MaskedSecretField } from '@marketplace/ui';
import {
  Boxes,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Filter,
  Shield,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Trash2,
  EyeOff,
  Eye,
  Lock,
} from 'lucide-react';

export const SellerGameAccountInventoryView: React.FC = () => {
  const [products, setProducts] = useState<GameAccountProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [inventory, setInventory] = useState<GameAccountInventoryItemSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Single Item form state
  const [formProductId, setFormProductId] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRecoveryCode, setFormRecoveryCode] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);

  // Bulk Import form state
  const [bulkProductId, setBulkProductId] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ importedCount: number; errorCount: number; errors?: any[] } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, inv] = await Promise.all([
        sellerApi.getSellerGameAccounts(),
        gameInventoryApi.getInventory(
          selectedProductId !== 'all' ? { productId: selectedProductId } : undefined
        ),
      ]);
      setProducts(prods);
      setInventory(inv);
      if (prods.length > 0 && !formProductId) {
        setFormProductId(prods[0].id);
        setBulkProductId(prods[0].id);
      }
    } catch (err) {
      console.error('Failed to load inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProductId]);

  const handleCreateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProductId || !formLogin || !formPassword) {
      setSingleError('Vui lòng điền đầy đủ tài khoản và mật khẩu.');
      return;
    }
    setSubmittingSingle(true);
    setSingleError(null);
    try {
      await gameInventoryApi.addItem({
        productId: formProductId,
        credentials: {
          login: formLogin,
          password: formPassword,
          recoveryEmail: formEmail || undefined,
          recoveryCode: formRecoveryCode || undefined,
        },
        privateNote: formNotes || undefined,
      });
      setAddModalOpen(false);
      setFormLogin('');
      setFormPassword('');
      setFormEmail('');
      setFormPhone('');
      setFormRecoveryCode('');
      setFormNotes('');
      await loadData();
    } catch (err: any) {
      setSingleError(err.message || 'Lỗi khi thêm tài khoản vào kho.');
    } finally {
      setSubmittingSingle(false);
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkProductId || !bulkText.trim()) return;
    setSubmittingBulk(true);
    setBulkResult(null);
    try {
      const res = await gameInventoryApi.importBulk(bulkProductId, bulkText);
      setBulkResult(res);
      if (res.importedCount > 0) {
        setBulkText('');
        await loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Lỗi khi import hàng loạt.');
    } finally {
      setSubmittingBulk(false);
    }
  };

  const handleToggleStatus = async (item: GameAccountInventoryItemSummary) => {
    try {
      if (item.status === 'AVAILABLE') {
        await gameInventoryApi.disableItem(item.id);
      } else if (item.status === 'DISABLED' || item.status === 'REVOKED') {
        await gameInventoryApi.enableItem(item.id);
      }
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDraft = async (id: string) => {
    if (confirm('Bạn chắc chắn muốn xoá tài khoản này khỏi kho?')) {
      try {
        await gameInventoryApi.deleteDraft(id);
        await loadData();
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Filtered inventory
  const filteredInventory = inventory.filter((item) => {
    const loginStr = item.maskedLogin || item.loginIdentifier || '';
    const matchesSearch =
      searchQuery === '' ||
      loginStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">Sẵn sàng bán</span>;
      case 'RESERVED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">Đang giữ chỗ</span>;
      case 'SOLD':
      case 'DELIVERED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Đã bán</span>;
      case 'DISABLED':
      case 'REVOKED':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-200 text-slate-700">Tạm khoá</span>;
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
            <Lock className="w-7 h-7 text-indigo-600" />
            Kho Tài Khoản Game (Vault Kỹ Thuật Số)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý và lưu trữ thông tin đăng nhập tự động giao cho người mua khi đơn hàng thành công
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Thêm tài khoản
          </button>
          <button
            onClick={() => setBulkModalOpen(true)}
            className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Import hàng loạt
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
        {/* Product selector */}
        <div className="w-full md:w-72">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Sản phẩm áp dụng</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả sản phẩm tài khoản</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="w-full md:flex-1">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tìm kiếm tài khoản</label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên đăng nhập, mã item..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Trạng thái kho</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="AVAILABLE">Sẵn sàng (Available)</option>
            <option value="RESERVED">Đang giữ chỗ (Reserved)</option>
            <option value="DELIVERED">Đã bàn giao (Delivered)</option>
            <option value="REVOKED">Tạm khoá (Revoked)</option>
          </select>
        </div>

        <button
          onClick={loadData}
          className="p-2.5 mt-auto text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
          title="Tải lại"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5 whitespace-nowrap w-28">Mã Kho</th>
                <th className="px-5 py-3.5 min-w-[200px]">Sản phẩm / Game</th>
                <th className="px-5 py-3.5 whitespace-nowrap min-w-[170px]">Tên đăng nhập (Masked)</th>
                <th className="px-5 py-3.5 whitespace-nowrap min-w-[210px]">Mật khẩu (Vault)</th>
                <th className="px-5 py-3.5 whitespace-nowrap min-w-[160px]">Email khôi phục</th>
                <th className="px-5 py-3.5 whitespace-nowrap w-32">Trạng thái</th>
                <th className="px-5 py-3.5 whitespace-nowrap w-28">Ngày tạo</th>
                <th className="px-5 py-3.5 text-right whitespace-nowrap w-24">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-500" />
                    Đang tải danh sách kho tài khoản...
                  </td>
                </tr>
              ) : filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <Boxes className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                    Chưa có tài khoản nào trong kho hoặc không khớp bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const prod = products.find((p) => p.id === item.productId);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap font-medium">
                        {item.id}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 text-xs line-clamp-1">
                          {prod ? prod.name : item.productId}
                        </div>
                        {prod && (
                          <div className="text-[11px] text-indigo-600 font-medium mt-0.5">
                            {prod.game?.name || prod.gameName}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-slate-800 whitespace-nowrap font-medium">
                        {item.maskedLogin || item.loginIdentifier}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <MaskedSecretField
                          value="SuperSecretPass123!"
                          compact
                          hideLabel
                          className="w-full max-w-[200px]"
                        />
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-slate-600 whitespace-nowrap">
                        {item.recoveryEmail || '—'}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">{getStatusBadge(item.status)}</td>
                      <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                        {new Date(item.addedAt || item.createdAt || Date.now()).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.status === 'AVAILABLE' && (
                            <button
                              onClick={() => handleToggleStatus(item)}
                              className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-amber-50 cursor-pointer transition-colors"
                              title="Tạm khoá / Vô hiệu"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          )}
                          {(item.status === 'DISABLED' || item.status === 'REVOKED') && (
                            <button
                              onClick={() => handleToggleStatus(item)}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 cursor-pointer transition-colors"
                              title="Mở bán lại"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}
                          {item.status !== 'SOLD' && item.status !== 'DELIVERED' && (
                            <button
                              onClick={() => handleDeleteDraft(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                              title="Xoá khỏi kho"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* ADD SINGLE ITEM MODAL */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-indigo-600" />
              Thêm tài khoản vào kho Vault
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Thông tin sẽ được mã hoá và tự động giao cho khách khi có đơn thanh toán thành công
            </p>

            {singleError && (
              <div className="p-3 mb-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{singleError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSingle} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn sản phẩm tài khoản *</label>
                <select
                  value={formProductId}
                  onChange={(e) => setFormProductId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên đăng nhập (Username / Login ID) *</label>
                <input
                  type="text"
                  value={formLogin}
                  onChange={(e) => setFormLogin(e.target.value)}
                  placeholder="Nhập username, Riot ID, email..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu (Password) *</label>
                <input
                  type="text"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Nhập mật khẩu..."
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email khôi phục</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại khôi phục</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="0912..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mã khôi phục (Backup code)</label>
                <input
                  type="text"
                  value={formRecoveryCode}
                  onChange={(e) => setFormRecoveryCode(e.target.value)}
                  placeholder="Ví dụ: 829182 hoặc mã 2FA"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ghi chú bàn giao thêm</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Hướng dẫn người mua cách đổi pass, tắt 2FA..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingSingle}
                  className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingSingle ? 'Đang lưu...' : 'Thêm vào kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Import Kho Hàng Loạt (Bulk Vault Import)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Nhập danh sách tài khoản theo định dạng dòng: <code>username|password|recoveryEmail|recoveryCode</code>
            </p>

            {bulkResult && (
              <div className={`p-3 mb-4 text-xs rounded-xl flex items-start gap-2 ${
                bulkResult.errorCount === 0 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
              }`}>
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Đã import: {bulkResult.importedCount} tài khoản. </span>
                  {bulkResult.errorCount > 0 && <span>Số dòng lỗi: {bulkResult.errorCount}</span>}
                </div>
              </div>
            )}

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Chọn sản phẩm tài khoản *</label>
                <select
                  value={bulkProductId}
                  onChange={(e) => setBulkProductId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Danh sách tài khoản (Mỗi tài khoản 1 dòng) *</label>
                <textarea
                  rows={8}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`user1|pass123|mail1@gmail.com|rec1\nuser2|pass456|mail2@gmail.com|rec2`}
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Định dạng: <code>tài_khoản|mật_khẩu|email_khôi_phục|mã_dự_phòng</code>
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setBulkModalOpen(false);
                    setBulkResult(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingBulk || !bulkText.trim()}
                  className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submittingBulk ? 'Đang xử lý...' : 'Tiến hành Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
