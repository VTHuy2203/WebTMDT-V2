import React, { useState, useEffect } from 'react';
import type {
  AppAccountProduct,
  AppAccountInventoryItemSummary,
  AppPlanCapacity,
  CreateAppAccountInventoryItemInput,
} from '@marketplace/types';
import { appInventoryApi, sellerApi } from '@marketplace/api-client';
import { FulfillmentTypeBadge } from '@marketplace/ui';
import {
  Boxes,
  Plus,
  FileSpreadsheet,
  RefreshCw,
  Search,
  Key,
  Users,
  CheckCircle2,
  Trash2,
  Lock,
  Zap,
  Edit,
  ExternalLink,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Upload,
} from 'lucide-react';

export interface SellerAppAccountInventoryViewProps {
  onAddNewProduct?: () => void;
  onEditProduct?: (product: AppAccountProduct) => void;
}

export const SellerAppAccountInventoryView: React.FC<SellerAppAccountInventoryViewProps> = ({
  onAddNewProduct,
  onEditProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'vault' | 'capacity'>('products');
  const [products, setProducts] = useState<AppAccountProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // Vault Items State
  const [vaultItems, setVaultItems] = useState<AppAccountInventoryItemSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Quick Restock Modal
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockProduct, setRestockProduct] = useState<AppAccountProduct | null>(null);
  const [restockPlanId, setRestockPlanId] = useState('');
  const [restockText, setRestockText] = useState('');
  const [restockSubmitting, setRestockSubmitting] = useState(false);
  const [restockSuccessMsg, setRestockSuccessMsg] = useState<string | null>(null);

  // Single Item Add Modal
  const [singleModalOpen, setSingleModalOpen] = useState(false);
  const [formProductId, setFormProductId] = useState('');
  const [formPlanId, setFormPlanId] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRecoveryEmail, setFormRecoveryEmail] = useState('');
  const [formRecoveryCode, setFormRecoveryCode] = useState('');
  const [formTwoFactorSecret, setFormTwoFactorSecret] = useState('');
  const [formLicenseKey, setFormLicenseKey] = useState('');
  const [formActivationUrl, setFormActivationUrl] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [submittingSingle, setSubmittingSingle] = useState(false);
  const [singleError, setSingleError] = useState<string | null>(null);

  // Bulk Import Modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkProductId, setBulkProductId] = useState('');
  const [bulkPlanId, setBulkPlanId] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ importedCount: number; errorCount: number } | null>(null);

  // Capacity State
  const [capacities, setCapacities] = useState<Record<string, AppPlanCapacity[]>>({});
  const [editingCapacity, setEditingCapacity] = useState<{
    productId: string;
    planId: string;
    planName: string;
    totalSlots: number;
  } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appProducts, items] = await Promise.all([
        sellerApi.getSellerAppAccounts(),
        appInventoryApi.getInventory(
          selectedProductId !== 'all' ? { productId: selectedProductId } : undefined
        ),
      ]);
      setProducts(appProducts);
      setVaultItems(items);

      // Load capacities for all products
      const capMap: Record<string, AppPlanCapacity[]> = {};
      for (const p of appProducts) {
        try {
          const caps = await appInventoryApi.getPlanCapacities(p.id);
          capMap[p.id] = caps;
        } catch {
          capMap[p.id] = [];
        }
      }
      setCapacities(capMap);

      if (appProducts.length > 0 && !formProductId) {
        setFormProductId(appProducts[0].id);
        if (appProducts[0].plans && appProducts[0].plans.length > 0) {
          setFormPlanId(appProducts[0].plans[0].id);
        }
        setBulkProductId(appProducts[0].id);
        if (appProducts[0].plans && appProducts[0].plans.length > 0) {
          setBulkPlanId(appProducts[0].plans[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProductId]);

  // Filter vault items
  const filteredVaultItems = vaultItems.filter((item) => {
    const raw = item as any;
    const matchesProduct = selectedProductId === 'all' || item.productId === selectedProductId;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    const matchesSearch =
      !searchQuery ||
      item.maskedLogin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.maskedIdentifier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      raw.login?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      raw.licenseKey?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.planName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProduct && matchesStatus && matchesSearch;
  });

  // Current selected product object for form
  const currentFormProduct = products.find((p) => p.id === formProductId);
  const currentFormPlan = currentFormProduct?.plans?.find((pl) => pl.id === formPlanId);

  // Submit Single Item
  const handleCreateSingleItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setSingleError(null);

    if (!formProductId || !formPlanId) {
      setSingleError('Vui lòng chọn sản phẩm và gói cước tương ứng.');
      return;
    }

    const plan = products
      .find((p) => p.id === formProductId)
      ?.plans?.find((pl) => pl.id === formPlanId);

    const isLicenseKey = plan?.fulfillmentType === 'LICENSE_KEY';

    if (isLicenseKey && !formLicenseKey.trim()) {
      setSingleError('Vui lòng nhập chuỗi License Key.');
      return;
    }

    if (!isLicenseKey && (!formLogin.trim() || !formPassword.trim())) {
      setSingleError('Vui lòng nhập đầy đủ Email/Tài khoản và Mật khẩu.');
      return;
    }

    setSubmittingSingle(true);
    try {
      const payload: CreateAppAccountInventoryItemInput = {
        productId: formProductId,
        planId: formPlanId,
        itemType: isLicenseKey ? 'LICENSE_KEY' : 'ACCOUNT',
        credentials: isLicenseKey
          ? { login: 'license', password: 'key' }
          : {
              login: formLogin.trim(),
              password: formPassword.trim(),
              recoveryEmail: formRecoveryEmail.trim() || undefined,
              recoveryCode: formRecoveryCode.trim() || undefined,
              twoFactorSecret: formTwoFactorSecret.trim() || undefined,
            },
        licenseKey: isLicenseKey ? formLicenseKey.trim() : undefined,
        notes: formNotes.trim() || undefined,
      };

      await appInventoryApi.addItem(payload);
      setSingleModalOpen(false);
      setFormLogin('');
      setFormPassword('');
      setFormRecoveryEmail('');
      setFormRecoveryCode('');
      setFormTwoFactorSecret('');
      setFormLicenseKey('');
      setFormNotes('');
      await loadData();
    } catch (err: any) {
      console.error('Failed to add item:', err);
      setSingleError(err.message || 'Không thể thêm tài khoản.');
    } finally {
      setSubmittingSingle(false);
    }
  };

  // Submit Bulk Import
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkProductId || !bulkPlanId || !bulkText.trim()) {
      alert('Vui lòng chọn sản phẩm, gói cước và nhập dữ liệu.');
      return;
    }

    setSubmittingBulk(true);
    try {
      const res = await appInventoryApi.importBulk(bulkProductId, bulkPlanId, bulkText);
      setBulkResult({ importedCount: res.importedCount, errorCount: res.errorCount });
      setBulkText('');
      await loadData();
    } catch (err: any) {
      alert('Lỗi import: ' + err.message);
    } finally {
      setSubmittingBulk(false);
    }
  };

  // Quick Restock handler
  const handleOpenRestock = (product: AppAccountProduct, planId?: string) => {
    setRestockProduct(product);
    setRestockPlanId(planId || product.plans?.[0]?.id || '');
    setRestockText('');
    setRestockSuccessMsg(null);
    setRestockModalOpen(true);
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || !restockPlanId) return;

    const lines = restockText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      alert('Vui lòng nhập ít nhất một dòng tài khoản hoặc mã license key.');
      return;
    }

    setRestockSubmitting(true);
    try {
      const plan = restockProduct.plans.find((pl) => pl.id === restockPlanId);
      for (const line of lines) {
        if (plan?.fulfillmentType === 'LICENSE_KEY') {
          await appInventoryApi.addItem({
            productId: restockProduct.id,
            planId: restockPlanId,
            itemType: 'LICENSE_KEY',
            licenseKey: line,
            privateNote: 'Nạp thêm tồn kho',
          });
        } else {
          const parts = line.split('|').map((s) => s.trim());
          const login = parts[0] || '';
          const password = parts[1] || '';
          const twoFactorSecret = parts[2];
          const recoveryCode = parts[3];
          if (login && password) {
            await appInventoryApi.addItem({
              productId: restockProduct.id,
              planId: restockPlanId,
              credentials: { login, password, twoFactorSecret, recoveryCode },
              privateNote: 'Nạp thêm tồn kho',
            });
          }
        }
      }

      setRestockSuccessMsg(`Đã nạp thành công ${lines.length} tài khoản vào kho!`);
      setRestockText('');
      setTimeout(() => {
        setRestockSuccessMsg(null);
        setRestockModalOpen(false);
      }, 1500);
      await loadData();
    } catch (err) {
      console.error('Restock error:', err);
      alert('Không thể nạp kho. Vui lòng thử lại.');
    } finally {
      setRestockSubmitting(false);
    }
  };

  // KPIs
  const totalAvailableVault = vaultItems.filter((i) => i.status === 'AVAILABLE').length;
  const totalSoldVault = vaultItems.filter((i) => i.status === 'SOLD').length;
  const totalCapacitySlots = Object.values(capacities).reduce((acc, capList) => {
    return acc + capList.reduce((s, c) => s + (c.availableSlots || 0), 0);
  }, 0);

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-emerald-600" />
            <span>Quản Lý Gói Bán & Kho Tài Khoản Ứng Dụng (Restock)</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Xem danh sách sản phẩm, cập nhật số lượng tồn kho tức thì (Restock) và chỉnh sửa gói cước mà không cần nhập lại từ đầu.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onAddNewProduct && (
            <button
              onClick={onAddNewProduct}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Đăng bán gói mới</span>
            </button>
          )}

          <button
            onClick={() => setBulkModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Nhập hàng loạt</span>
          </button>

          <button
            onClick={() => setSingleModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Key className="w-4 h-4 text-indigo-600" />
            <span>Thêm 1 Nick/Key</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kho cấp sẵn & Key còn lại</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {totalAvailableVault} <span className="text-xs font-medium text-slate-500">mục sẵn sàng</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Slot Email & Family khả dụng</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {totalCapacitySlots} <span className="text-xs font-medium text-slate-500">chỗ trống</span>
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-3 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Đã bàn giao tự động</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">
              {totalSoldVault} <span className="text-xs font-medium text-slate-500">đã bán</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('products')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>1. Danh Sách Gói Bán & Tồn Kho (Products & Restock - {products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('vault')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'vault'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>2. Kho Chi Tiết Từng Nick & Key (Vault - {vaultItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('capacity')}
          className={`pb-3 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'capacity'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>3. Hạn Mức Kích Hoạt Email & Nhóm Family (Capacity)</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: PRODUCTS & STOCK MANAGEMENT (RESTOCK / EDIT)                       */}
      {/* ========================================================================= */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Chọn sản phẩm để <strong>nạp thêm số lượng (Restock)</strong> hoặc <strong>chỉnh sửa thông tin</strong> mà không cần nhập lại từ đầu.
            </p>
            <button
              onClick={loadData}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-36 bg-slate-200/70 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
              <Boxes className="w-12 h-12 text-slate-300 mx-auto" />
              <div>
                <h3 className="font-bold text-base text-slate-800">Chưa có sản phẩm ứng dụng nào</h3>
                <p className="text-xs text-slate-500 mt-1">Đăng bán sản phẩm đầu tiên để bắt đầu quản lý kho.</p>
              </div>
              {onAddNewProduct && (
                <button
                  onClick={onAddNewProduct}
                  className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors"
                >
                  + Đăng bán tài khoản ứng dụng ngay
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((prod) => {
                const prodVaultItems = vaultItems.filter((i) => i.productId === prod.id);
                const availableCount = prodVaultItems.filter((i) => i.status === 'AVAILABLE').length;
                const soldCount = prodVaultItems.filter((i) => i.status === 'SOLD').length;
                const isOutOfStock = availableCount === 0;

                return (
                  <div
                    key={prod.id}
                    className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4 hover:border-slate-300 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-start gap-4">
                        <img
                          src={prod.thumbnail || prod.images?.[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150'}
                          alt={prod.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-100 p-1 bg-white flex-shrink-0"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-extrabold text-sm text-slate-900">{prod.name}</h3>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700">
                              {prod.applicationName || 'Ứng Dụng Bản Quyền'}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span>Danh mục: <strong>{prod.appCategory || 'AI'}</strong></span>
                            <span>•</span>
                            <span>Số gói cước: <strong>{prod.plans?.length || 1} gói</strong></span>
                            <span>•</span>
                            <span>Đã bán: <strong className="text-blue-600">{soldCount} đơn</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Stock Status Badge & Quick Actions */}
                      <div className="flex items-center gap-3 self-end md:self-center">
                        {isOutOfStock ? (
                          <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-700 border border-rose-200 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                            <span>HẾT HÀNG (0 tài khoản)</span>
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>CÒN HÀNG ({availableCount} tài khoản)</span>
                          </span>
                        )}

                        {/* RESTOCK BUTTON */}
                        <button
                          type="button"
                          onClick={() => handleOpenRestock(prod)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Nạp thêm kho (Restock)</span>
                        </button>

                        {/* EDIT PRODUCT BUTTON */}
                        {onEditProduct && (
                          <button
                            type="button"
                            onClick={() => onEditProduct(prod)}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5 text-slate-600" />
                            <span>Chỉnh sửa sản phẩm</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Plans Breakdown inside this Product */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Chi tiết các gói cước & tồn kho tương ứng:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                        {prod.plans?.map((plan) => {
                          const planVaultCount = prodVaultItems.filter(
                            (i) => i.planId === plan.id && i.status === 'AVAILABLE'
                          ).length;
                          const planIsOut = planVaultCount === 0;

                          return (
                            <div
                              key={plan.id}
                              className={`p-3 rounded-2xl border text-xs space-y-2 ${
                                planIsOut
                                  ? 'bg-rose-50/50 border-rose-200'
                                  : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-bold text-slate-900 truncate">{plan.name}</span>
                                <FulfillmentTypeBadge type={plan.fulfillmentType} />
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                                <span className="font-extrabold text-emerald-700">
                                  {plan.price.toLocaleString('vi-VN')}đ
                                </span>

                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                      planIsOut
                                        ? 'bg-rose-100 text-rose-800'
                                        : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                  >
                                    Kho: {planVaultCount} tài khoản
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenRestock(prod, plan.id)}
                                    className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                                  >
                                    + Nạp gói này
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: VAULT ITEMS LIST                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'vault' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
              {/* Product Filter */}
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">Tất cả sản phẩm ứng dụng</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs font-semibold px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="AVAILABLE">Còn hàng (Khả dụng)</option>
                <option value="RESERVED">Đang chờ thanh toán</option>
                <option value="SOLD">Đã bán & Bàn giao</option>
                <option value="DISABLED">Đang tạm khóa</option>
              </select>

              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo login, license key..."
                  className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Tải lại dữ liệu"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                    <th className="py-3.5 px-4">Mã nội bộ</th>
                    <th className="py-3.5 px-4">Sản phẩm / Gói</th>
                    <th className="py-3.5 px-4">Hình thức</th>
                    <th className="py-3.5 px-4">Thông tin đăng nhập / Key</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4">Ghi chú</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredVaultItems.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400">
                        Không có tài khoản hoặc key nào trong kho phù hợp tiêu chí lọc.
                      </td>
                    </tr>
                  ) : (
                    filteredVaultItems.map((item) => {
                      const raw = item as any;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-slate-800">
                            {item.internalCode}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{item.productName}</div>
                            <div className="text-[11px] text-slate-400">{item.planName}</div>
                          </td>
                          <td className="py-3 px-4">
                            <FulfillmentTypeBadge type={item.fulfillmentType || 'PRE_CREATED_ACCOUNT'} />
                          </td>
                          <td className="py-3 px-4 font-mono">
                            {item.maskedLogin || raw.login || item.maskedSecret || raw.licenseKey || '••••••'}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                item.status === 'AVAILABLE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : item.status === 'SOLD'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {item.status === 'AVAILABLE'
                                ? 'Khả dụng'
                                : item.status === 'SOLD'
                                ? 'Đã bán'
                                : item.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {item.notes || '—'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CAPACITY MANAGEMENT (FAMILY & EMAIL)                               */}
      {/* ========================================================================= */}
      {activeTab === 'capacity' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-xs text-purple-900 flex items-start gap-3">
            <Users className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Quản lý Slot Hạn mức Gia đình / Nhóm</p>
              <p className="mt-0.5 text-purple-800 leading-relaxed">
                Đối với các gói Mời nhóm Family/Team hoặc Nâng cấp email, hệ thống giới hạn số lượng khách hàng tối đa bạn có thể tiếp nhận cùng lúc để tránh quá tải nhóm.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {products.map((prod) => {
              const capList = capacities[prod.id] || [];
              return (
                <div key={prod.id} className="bg-white rounded-3xl border border-slate-200 p-5 space-y-3 shadow-xs">
                  <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                    <img
                      src={prod.thumbnail}
                      alt=""
                      className="w-10 h-10 rounded-xl object-contain bg-white border border-slate-100 p-1"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{prod.name}</h4>
                      <p className="text-[10px] text-slate-400">{prod.applicationName}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {prod.plans?.map((pl) => {
                      const cap = capList.find((c) => c.planId === pl.id);
                      return (
                        <div key={pl.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{pl.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <FulfillmentTypeBadge type={pl.fulfillmentType} />
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[11px] font-bold text-indigo-600">
                              {cap?.availableSlots ?? 5} slots còn trống
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              / {cap?.totalSlots ?? 5} slots tối đa
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: QUICK RESTOCK                                                      */}
      {/* ========================================================================= */}
      {restockModalOpen && restockProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Nạp Thêm Số Lượng (Restock)
                  </h3>
                  <p className="text-xs text-slate-500">Sản phẩm: {restockProduct.name}</p>
                </div>
              </div>
              <button
                onClick={() => setRestockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {restockSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{restockSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleRestockSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Chọn gói cước cần nạp kho *</label>
                <select
                  value={restockPlanId}
                  onChange={(e) => setRestockPlanId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  {restockProduct.plans?.map((pl) => (
                    <option key={pl.id} value={pl.id}>
                      {pl.name} - {pl.price.toLocaleString('vi-VN')}đ ({pl.fulfillmentType})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">Dữ liệu tài khoản hoặc Key cần nạp *</label>
                  <span className="text-emerald-700 font-bold">
                    {restockText.split('\n').filter((l) => l.trim()).length} mục
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Mỗi dòng một tài khoản (format: <code>login|password</code> hoặc <code>license key</code>).
                </p>
                <textarea
                  rows={6}
                  value={restockText}
                  onChange={(e) => setRestockText(e.target.value)}
                  placeholder={`chatgpt.user01@gmail.com|PassVip@2026\nchatgpt.user02@gmail.com|PassVip@2026\nchatgpt.user03@gmail.com|PassVip@2026`}
                  className="w-full font-mono text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRestockModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={restockSubmitting}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:bg-emerald-400 flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{restockSubmitting ? 'Đang nạp...' : 'Cập nhật kho ngay'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD SINGLE ITEM                                                  */}
      {/* ========================================================================= */}
      {singleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <Key className="w-5 h-5 text-emerald-600" />
                <span>Thêm 1 Tài Khoản / License Key vào Kho</span>
              </h3>
              <button
                onClick={() => setSingleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {singleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
                {singleError}
              </div>
            )}

            <form onSubmit={handleCreateSingleItem} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Chọn sản phẩm</label>
                  <select
                    value={formProductId}
                    onChange={(e) => {
                      setFormProductId(e.target.value);
                      const p = products.find((pr) => pr.id === e.target.value);
                      if (p && p.plans && p.plans.length > 0) setFormPlanId(p.plans[0].id);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gói cước</label>
                  <select
                    value={formPlanId}
                    onChange={(e) => setFormPlanId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    {currentFormProduct?.plans?.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {currentFormPlan?.fulfillmentType === 'LICENSE_KEY' ? (
                <div className="space-y-3 bg-amber-50/50 p-4 rounded-2xl border border-amber-200">
                  <div>
                    <label className="block font-bold text-amber-900 mb-1">Chuỗi License Key *</label>
                    <input
                      type="text"
                      value={formLicenseKey}
                      onChange={(e) => setFormLicenseKey(e.target.value)}
                      placeholder="VD: ABCD-1234-EFGH-5678"
                      className="w-full font-mono px-3 py-2 bg-white border border-amber-300 rounded-xl font-bold"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email / Login *</label>
                      <input
                        type="text"
                        value={formLogin}
                        onChange={(e) => setFormLogin(e.target.value)}
                        placeholder="user@gmail.com"
                        className="w-full font-mono px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Mật khẩu *</label>
                      <input
                        type="text"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder="MatKhau123"
                        className="w-full font-mono px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">2FA Secret Key</label>
                      <input
                        type="text"
                        value={formTwoFactorSecret}
                        onChange={(e) => setFormTwoFactorSecret(e.target.value)}
                        placeholder="JBSWY3DPEHPK3PXP"
                        className="w-full font-mono px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-500 mb-1">Email khôi phục</label>
                      <input
                        type="text"
                        value={formRecoveryEmail}
                        onChange={(e) => setFormRecoveryEmail(e.target.value)}
                        placeholder="recovery@gmail.com"
                        className="w-full font-mono px-3 py-2 bg-white border border-slate-200 rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú riêng nội bộ</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="VD: Batch mua ngày 10/09..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSingleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingSingle}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:bg-emerald-400"
                >
                  {submittingSingle ? 'Đang lưu...' : 'Lưu vào Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: BULK IMPORT                                                      */}
      {/* ========================================================================= */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <span>Nhập Hàng Loạt (Bulk Import)</span>
              </h3>
              <button
                onClick={() => setBulkModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {bulkResult && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs">
                Đã nhập thành công <strong>{bulkResult.importedCount}</strong> tài khoản/key. Lỗi: {bulkResult.errorCount}.
              </div>
            )}

            <form onSubmit={handleBulkImport} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sản phẩm</label>
                  <select
                    value={bulkProductId}
                    onChange={(e) => {
                      setBulkProductId(e.target.value);
                      const p = products.find((pr) => pr.id === e.target.value);
                      if (p && p.plans && p.plans.length > 0) setBulkPlanId(p.plans[0].id);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Gói cước</label>
                  <select
                    value={bulkPlanId}
                    onChange={(e) => setBulkPlanId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    {products.find((p) => p.id === bulkProductId)?.plans?.map((pl) => (
                      <option key={pl.id} value={pl.id}>
                        {pl.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dữ liệu (Mỗi dòng một mục):
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Định dạng Nick: <code>login|password|recoveryEmail|recoveryCode</code>
                  <br />
                  Định dạng License Key: Chỉ cần nhập mã key trên từng dòng.
                </p>
                <textarea
                  rows={6}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={`user1@gmail.com|pass123|recovery1@gmail.com\nuser2@gmail.com|pass456`}
                  className="w-full px-3.5 py-2.5 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBulkModalOpen(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  disabled={submittingBulk}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:bg-emerald-400"
                >
                  {submittingBulk ? 'Đang nhập...' : 'Bắt đầu Nhập'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
