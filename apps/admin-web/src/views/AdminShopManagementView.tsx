import React, { useEffect, useState } from 'react';
import type { Shop, ShopSanctionHistory, ShopOperationalStatus } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { useI18n, formatLargePrice } from '@marketplace/utils';
import {
  Store,
  ShieldAlert,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Eye,
  AlertOctagon,
  Unlock,
  Building2,
  FileText,
  DollarSign,
  Star,
  Users,
  Calendar,
  X,
  ChevronRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const AdminShopManagementView: React.FC = () => {
  const { locale, t } = useI18n();
  const [shops, setShops] = useState<Shop[]>([]);

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ShopOperationalStatus>('ALL');

  // Modals state
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [modalType, setModalType] = useState<'WARN' | 'SUSPEND' | 'BAN' | 'REACTIVATE' | 'DETAILS' | null>(null);

  // Form states for actions
  const [actionReason, setActionReason] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState<number>(2);
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [submitting, setSubmitting] = useState(false);

  const loadShops = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAllShops();
      setShops([...data]);
    } catch (err) {
      console.error('Failed to load shops:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShops();
  }, []);

  // Stats calculation
  const totalShops = shops.length;
  const activeShops = shops.filter((s) => !s.operationalStatus || s.operationalStatus === 'ACTIVE').length;
  const warningShops = shops.filter((s) => s.operationalStatus === 'WARNING').length;
  const suspendedShops = shops.filter((s) => s.operationalStatus === 'TEMPORARILY_SUSPENDED').length;
  const bannedShops = shops.filter((s) => s.operationalStatus === 'PERMANENTLY_BANNED').length;

  // Filtered list
  const filteredShops = shops.filter((shop) => {
    const currentOpStatus = shop.operationalStatus || 'ACTIVE';
    if (statusFilter !== 'ALL' && currentOpStatus !== statusFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = shop.name.toLowerCase().includes(q);
      const matchOwner = shop.ownerFullName?.toLowerCase().includes(q) || false;
      const matchCccd = shop.idCardNumber?.toLowerCase().includes(q) || false;
      const matchEmail = shop.email?.toLowerCase().includes(q) || false;
      const matchPhone = shop.phone?.toLowerCase().includes(q) || false;
      return matchName || matchOwner || matchCccd || matchEmail || matchPhone;
    }
    return true;
  });

  const handleOpenAction = (shop: Shop, type: 'WARN' | 'SUSPEND' | 'BAN' | 'REACTIVATE' | 'DETAILS') => {
    setSelectedShop(shop);
    setModalType(type);
    setActionReason('');
    setActionNotes('');
    setPenaltyPoints(2);
    setSuspendDays(7);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedShop(null);
    setActionReason('');
    setActionNotes('');
  };

  const handleConfirmAction = async () => {
    if (!selectedShop) return;
    if (modalType !== 'REACTIVATE' && !actionReason.trim()) {
      alert('Vui lòng nhập lý do thực hiện chế tài.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalType === 'WARN') {
        await adminApi.warnShop(selectedShop.id, actionReason.trim(), penaltyPoints, actionNotes.trim());
      } else if (modalType === 'SUSPEND') {
        await adminApi.suspendShop(selectedShop.id, suspendDays, actionReason.trim());
      } else if (modalType === 'BAN') {
        await adminApi.banShop(selectedShop.id, actionReason.trim());
      } else if (modalType === 'REACTIVATE') {
        await adminApi.reactivateShop(selectedShop.id);
      }
      await loadShops();
      handleCloseModal();
    } catch (err) {
      console.error('Action failed:', err);
      alert('Đã có lỗi xảy ra khi thực hiện chế tài.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-purple-100 text-purple-700">
              Quản Lý Gian Hàng & Chế Tài
            </span>
            <span className="text-xs text-slate-400">• Chuẩn Shopee / Lazada Merchant Control</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Quản Lý Gian Hàng & Xử Lý Vi Phạm
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Giám sát chỉ số vận hành toàn bộ shop, phát cảnh cáo trừ điểm uy tín, tạm khóa hoạt động theo ngày hoặc cấm vĩnh viễn gian hàng vi phạm.
          </p>
        </div>
        <button
          onClick={loadShops}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới dữ liệu</span>
        </button>
      </div>

      {/* Proactive Audit & Direct Action Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-purple-50 to-indigo-50 border border-amber-200/90 shadow-xs flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-black text-slate-900 text-sm">
              Quyền Quản Lý & Chế Tài Trực Tiếp Của Admin (Proactive Shop Audit)
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900 border border-amber-300">
              ⚡ Không cần đợi người mua tố cáo
            </span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Khi Admin đi rà soát và kiểm tra đột xuất gian hàng, nếu phát hiện shop có hành vi gian lận (bán nick ảo, không đúng rank/thông số, trốn bảo hành, spam từ khóa, hàng giả...), Admin có thể <strong>bấm trực tiếp nút [Cảnh báo ngay]</strong> hoặc <strong>[Tạm khóa ngày]</strong> ngay trên bảng bên dưới để xử lý tức thì, bảo vệ an toàn toàn diện cho toàn sàn.
          </p>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Tất cả gian hàng</span>
            <Store className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalShops}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Toàn sàn thương mại</div>
        </div>

        <div
          onClick={() => setStatusFilter('ACTIVE')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'ACTIVE'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Đang hoạt động</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{activeShops}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Vận hành chuẩn mực</div>
        </div>

        <div
          onClick={() => setStatusFilter('WARNING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'WARNING'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Bị cảnh cáo</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{warningShops}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Điểm phạt Sao Quả Tạ</div>
        </div>

        <div
          onClick={() => setStatusFilter('TEMPORARILY_SUSPENDED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'TEMPORARILY_SUSPENDED'
              ? 'bg-orange-50/80 border-orange-300 ring-2 ring-orange-400/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-orange-700">Tạm khóa có thời hạn</span>
            <Clock className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-black text-orange-700 mt-2">{suspendedShops}</div>
          <div className="text-[11px] text-orange-600/80 mt-0.5">Khóa 3 - 30 ngày</div>
        </div>

        <div
          onClick={() => setStatusFilter('PERMANENTLY_BANNED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PERMANENTLY_BANNED'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Cấm vĩnh viễn</span>
            <Ban className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{bannedShops}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Blacklist định danh CCCD</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên gian hàng, CCCD, chủ shop, email, số điện thoại..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all bg-slate-50/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { key: 'ALL', label: 'Tất cả' },
              { key: 'ACTIVE', label: 'Hoạt động' },
              { key: 'WARNING', label: 'Bị cảnh cáo' },
              { key: 'TEMPORARILY_SUSPENDED', label: 'Tạm khóa ngày' },
              { key: 'PERMANENTLY_BANNED', label: 'Cấm vĩnh viễn' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === item.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card List (< md: Phones & Narrow Screens) */}
      <div className="md:hidden space-y-3.5">
        {filteredShops.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
            <Store className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
            <p className="font-semibold text-sm text-slate-700">Không tìm thấy gian hàng nào</p>
            <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
          </div>
        ) : (
          filteredShops.map((shop) => {
            const opStatus = shop.operationalStatus || 'ACTIVE';
            const isSuspended = opStatus === 'TEMPORARILY_SUSPENDED';
            const isBanned = opStatus === 'PERMANENTLY_BANNED';
            const isWarning = opStatus === 'WARNING';

            return (
              <div
                key={shop.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
                  isBanned
                    ? 'border-rose-300 bg-rose-50/10'
                    : isSuspended
                    ? 'border-orange-300 bg-orange-50/10'
                    : isWarning
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Mobile Card Header */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={shop.logo}
                      alt={shop.name}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm truncate">{shop.name}</span>
                        {shop.isOfficial && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-700">
                            CHÍNH HÃNG
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        Mã: <code className="text-slate-500 font-mono">{shop.id}</code>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {isBanned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <Ban className="w-3 h-3 text-rose-600" />
                        CẤM VĨNH VIỄN
                      </span>
                    )}
                    {isSuspended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                        <Clock className="w-3 h-3 text-orange-600" />
                        TẠM KHÓA
                      </span>
                    )}
                    {isWarning && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        CẢNH CÁO
                      </span>
                    )}
                    {opStatus === 'ACTIVE' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        HOẠT ĐỘNG
                      </span>
                    )}
                  </div>
                </div>

                {/* Suspension / Ban notes */}
                {isSuspended && shop.suspendedUntil && (
                  <div className="p-2 rounded-xl bg-orange-50 border border-orange-200 text-[11px] text-orange-800">
                    <div className="font-semibold">Mở lại dự kiến: {new Date(shop.suspendedUntil).toLocaleDateString('vi-VN')}</div>
                    {shop.suspensionReason && <div className="text-orange-700/90 mt-0.5">{shop.suspensionReason}</div>}
                  </div>
                )}
                {isBanned && shop.banReason && (
                  <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-[11px] text-rose-800 italic">
                    "{shop.banReason}"
                  </div>
                )}

                {/* Mobile Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/80 p-2.5 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Chủ sở hữu & SĐT</span>
                    <span className="font-bold text-slate-800 truncate block">{shop.ownerFullName || 'Đang cập nhật'}</span>
                    <span className="text-[11px] text-slate-500 font-mono block">{shop.phone}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                      {locale === 'en' ? 'Revenue & Orders' : 'Quy mô & Doanh số'}
                    </span>
                    <span className="font-bold text-slate-900 block">
                      {formatLargePrice(shop.totalRevenue || 0)}{' '}
                      <span className="font-normal text-slate-400 text-[11px]">
                        ({shop.totalOrdersCount || 0} {locale === 'en' ? 'orders' : 'đơn'})
                      </span>
                    </span>
                    <span className="text-[11px] text-amber-600 font-semibold inline-flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      {shop.rating.toFixed(1)} ({shop.productCount} {locale === 'en' ? 'items' : 'SP'})
                    </span>
                  </div>
                </div>

                {/* Penalty info */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      (shop.penaltyPoints || 0) >= 10
                        ? 'bg-rose-100 text-rose-700 border border-rose-200'
                        : (shop.penaltyPoints || 0) >= 3
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {shop.penaltyPoints || 0} Điểm phạt
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {shop.warningCount || 0} cảnh cáo • {shop.disputeCount || 0} khiếu nại
                  </span>
                </div>

                {/* Mobile Action Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
                  {!isBanned && (
                    <button
                      onClick={() => handleOpenAction(shop, 'WARN')}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Cảnh báo</span>
                    </button>
                  )}

                  {!isBanned && (
                    <button
                      onClick={() => handleOpenAction(shop, 'SUSPEND')}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-xs transition-all cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Tạm khóa</span>
                    </button>
                  )}

                  {!isBanned && (
                    <button
                      onClick={() => handleOpenAction(shop, 'BAN')}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer"
                      title="Cấm vĩnh viễn"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  )}

                  {(isBanned || isSuspended || isWarning) && (
                    <button
                      onClick={() => handleOpenAction(shop, 'REACTIVATE')}
                      className="flex-1 inline-flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs transition-all cursor-pointer"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Mở khóa</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleOpenAction(shop, 'DETAILS')}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
                    title="Soi hồ sơ"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Main Table (Visible on Tablets/iPad & Desktop >= md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[1100px] text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 min-w-[260px]">{locale === 'en' ? 'Shop' : 'Gian hàng'}</th>
                <th className="py-3.5 px-4 min-w-[180px]">{locale === 'en' ? 'Owner & Identity' : 'Chủ sở hữu & Định danh'}</th>
                <th className="py-3.5 px-4 min-w-[180px]">{locale === 'en' ? 'Revenue & Scale' : 'Quy mô & Doanh số'}</th>
                <th className="py-3.5 px-4 min-w-[130px] text-center">{locale === 'en' ? 'Violations & Penalties' : 'Chỉ số vi phạm'}</th>
                <th className="py-3.5 px-4 min-w-[170px]">{locale === 'en' ? 'Operational Status' : 'Trạng thái vận hành'}</th>
                <th className="py-3.5 px-4 min-w-[250px] text-right sticky right-0 bg-slate-50/95 backdrop-blur-xs shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)]">
                  {locale === 'en' ? 'Direct Actions' : 'Hành động chế tài'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShops.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Store className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="font-semibold text-sm">
                      {locale === 'en' ? 'No shops found matching filter' : 'Không tìm thấy gian hàng nào phù hợp'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {locale === 'en' ? 'Try adjusting keyword or status filter' : 'Thử thay đổi từ khóa hoặc bộ lọc trạng thái'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredShops.map((shop) => {
                  const opStatus = shop.operationalStatus || 'ACTIVE';
                  const isSuspended = opStatus === 'TEMPORARILY_SUSPENDED';
                  const isBanned = opStatus === 'PERMANENTLY_BANNED';
                  const isWarning = opStatus === 'WARNING';

                  return (
                    <tr
                      key={shop.id}
                      className={`group hover:bg-slate-50/80 transition-colors ${
                        isBanned
                          ? 'bg-rose-50/20'
                          : isSuspended
                          ? 'bg-orange-50/20'
                          : isWarning
                          ? 'bg-amber-50/20'
                          : ''
                      }`}
                    >
                      {/* Shop Name & Logo */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={shop.logo}
                            alt={shop.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-slate-900 text-sm truncate">{shop.name}</span>
                              {shop.isOfficial && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-blue-100 text-blue-700">
                                  {locale === 'en' ? 'OFFICIAL' : 'CHÍNH HÃNG'}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate mt-0.5">
                              {locale === 'en' ? 'ID' : 'Mã'}: <code className="text-slate-500 font-mono">{shop.id}</code> • {shop.slug}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              <span>{locale === 'en' ? 'Joined' : 'Gia nhập'}: {new Date(shop.joinedDate).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN')}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Owner & Identity */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs">
                          {shop.ownerFullName || (locale === 'en' ? 'Updating...' : 'Đang cập nhật')}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          CCCD: <code className="font-mono text-slate-600">{shop.idCardNumber || (locale === 'en' ? 'Unverified' : 'Chưa định danh')}</code>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                          <span>{locale === 'en' ? 'Tel' : 'SĐT'}: {shop.phone}</span>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">
                            {formatLargePrice(shop.totalRevenue || 0)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            ({shop.totalOrdersCount || 0} {locale === 'en' ? 'orders' : 'đơn'})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {shop.productCount} {locale === 'en' ? 'products' : 'sản phẩm'} • {shop.followerCount.toLocaleString()} {locale === 'en' ? 'followers' : 'theo dõi'}
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-amber-500 font-bold mt-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>{shop.rating.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">({shop.responseRate}% {locale === 'en' ? 'reply rate' : 'phản hồi'})</span>
                        </div>
                      </td>

                      {/* Violations & Penalty */}
                      <td className="py-4 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-black ${
                              (shop.penaltyPoints || 0) >= 10
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : (shop.penaltyPoints || 0) >= 3
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {shop.penaltyPoints || 0} Điểm phạt
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            {shop.warningCount || 0} lần cảnh cáo • {shop.disputeCount || 0} khiếu nại
                          </span>
                        </div>
                      </td>

                      {/* Operational Status */}
                      <td className="py-4 px-4">
                        {isBanned && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>CẤM VĨNH VIỄN</span>
                            </span>
                            {shop.banReason && (
                              <p className="text-[11px] text-rose-600 mt-1 line-clamp-2 italic">
                                "{shop.banReason}"
                              </p>
                            )}
                          </div>
                        )}

                        {isSuspended && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200">
                              <Clock className="w-3.5 h-3.5 text-orange-600" />
                              <span>ĐANG TẠM KHÓA</span>
                            </span>
                            {shop.suspendedUntil && (
                              <div className="text-[11px] text-orange-700 font-semibold mt-1">
                                Mở lại: {new Date(shop.suspendedUntil).toLocaleDateString('vi-VN')}
                              </div>
                            )}
                            {shop.suspensionReason && (
                              <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                                Lý do: {shop.suspensionReason}
                              </p>
                            )}
                          </div>
                        )}

                        {isWarning && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                              <span>CẢNH CÁO VI PHẠM</span>
                            </span>
                            {shop.sanctionHistory && shop.sanctionHistory[0] && (
                              <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                Gần nhất: {shop.sanctionHistory[0].reason}
                              </p>
                            )}
                          </div>
                        )}

                        {opStatus === 'ACTIVE' && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>HOẠT ĐỘNG TỐT</span>
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Sanctions & Actions - Sticky Right Column */}
                      <td className="py-4 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/95 transition-colors shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Direct Warn Button */}
                          {!isBanned && (
                            <button
                              onClick={() => handleOpenAction(shop, 'WARN')}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-all cursor-pointer"
                              title="Admin phát cảnh cáo trực tiếp (không cần đợi báo cáo)"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                              <span>Cảnh báo ngay</span>
                            </button>
                          )}

                          {/* Temporary Suspend Button */}
                          {!isBanned && (
                            <button
                              onClick={() => handleOpenAction(shop, 'SUSPEND')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-xs transition-all cursor-pointer"
                              title="Tạm khóa gian hàng có thời hạn (3, 7, 14, 30 ngày)"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Tạm khóa</span>
                            </button>
                          )}

                          {/* Permanent Ban Button */}
                          {!isBanned && (
                            <button
                              onClick={() => handleOpenAction(shop, 'BAN')}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all cursor-pointer"
                              title="Khóa gian hàng vĩnh viễn (Blacklist)"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}

                          {/* If shop is banned or suspended: allow reactivate */}
                          {(isBanned || isSuspended || isWarning) && (
                            <button
                              onClick={() => handleOpenAction(shop, 'REACTIVATE')}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-xs transition-all cursor-pointer"
                              title="Gỡ chế tài / Mở khóa hoạt động"
                            >
                              <Unlock className="w-3.5 h-3.5" />
                              <span>Mở khóa</span>
                            </button>
                          )}

                          {/* View details */}
                          <button
                            onClick={() => handleOpenAction(shop, 'DETAILS')}
                            title="Soi hồ sơ, kho hàng & lịch sử vi phạm"
                            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
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

      {/* Modal Actions */}
      {modalType && selectedShop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {modalType === 'WARN' && (
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                {modalType === 'SUSPEND' && (
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                )}
                {modalType === 'BAN' && (
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                    <Ban className="w-5 h-5" />
                  </div>
                )}
                {modalType === 'REACTIVATE' && (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Unlock className="w-5 h-5" />
                  </div>
                )}
                {modalType === 'DETAILS' && (
                  <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-black text-slate-900 text-lg">
                    {modalType === 'WARN' && 'Phát Cảnh Cáo Gian Hàng'}
                    {modalType === 'SUSPEND' && 'Khóa Gian Hàng Có Thời Hạn'}
                    {modalType === 'BAN' && 'Khóa Vĩnh Viễn Gian Hàng (Blacklist)'}
                    {modalType === 'REACTIVATE' && 'Gỡ Bỏ Chế Tài / Mở Khóa Gian Hàng'}
                    {modalType === 'DETAILS' && 'Hồ Sơ & Lịch Sử Vi Phạm'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Gian hàng: <span className="font-bold text-slate-700">{selectedShop.name}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-4">
              {/* WARNING ACTION */}
              {modalType === 'WARN' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-950 leading-relaxed">
                    <div className="flex items-center gap-2 font-bold text-amber-900 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>CẢNH CÁO CHỦ ĐỘNG TỪ BAN QUẢN TRỊ (ADMIN DIRECT ACTION)</span>
                    </div>
                    Hệ thống sẽ gửi thông báo cảnh báo trực tiếp vào Kênh Người Bán của shop, trừ điểm uy tín (Sao Quả Tạ) và ghi vào lịch sử vi phạm để theo dõi. <strong>Admin có quyền cảnh cáo ngay khi phát hiện vi phạm mà không cần đợi người mua gửi báo cáo.</strong>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mức độ vi phạm & Điểm phạt Sao Quả Tạ:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { points: 1, label: 'Vi phạm nhẹ (+1 đ)' },
                        { points: 2, label: 'Vi phạm vừa (+2 đ)' },
                        { points: 3, label: 'Nghiêm trọng (+3 đ)' },
                      ].map((item) => (
                        <button
                          key={item.points}
                          type="button"
                          onClick={() => setPenaltyPoints(item.points)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            penaltyPoints === item.points
                              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Căn cứ & Lý do cảnh cáo vi phạm <span className="text-rose-500">*</span>:
                    </label>
                    <select
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden bg-slate-50/50 mb-2 font-medium"
                    >
                      <option value="">-- Chọn lý do kiểm tra trực tiếp hoặc khiếu nại --</option>
                      <option value="Admin kiểm tra trực tiếp: Phát hiện thông tin sản phẩm / nick game không đúng thực tế (sai rank, sai tướng)">
                        🔍 [Kiểm tra trực tiếp] Nick game / SP sai thông tin thực tế
                      </option>
                      <option value="Admin kiểm tra trực tiếp: Nghi vấn sản phẩm key crack / tài khoản bản quyền lậu không nguồn gốc">
                        🔍 [Kiểm tra trực tiếp] Nghi vấn key lậu / tài khoản crack
                      </option>
                      <option value="Admin kiểm tra trực tiếp: Chậm trễ giao hàng có hệ thống và tỷ lệ hủy đơn quá cao">
                        🔍 [Kiểm tra trực tiếp] Chậm giao hàng / Tỷ lệ hủy đơn cao
                      </option>
                      <option value="Admin kiểm tra trực tiếp: Spam từ khóa, đăng bán sai danh mục hàng hóa">
                        🔍 [Kiểm tra trực tiếp] Spam từ khóa / Sai danh mục
                      </option>
                      <option value="Admin kiểm tra trực tiếp: Dẫn dụ khách giao dịch ngoài sàn để trốn trách nhiệm bảo hành">
                        🔍 [Kiểm tra trực tiếp] Dẫn dụ giao dịch ngoài sàn
                      </option>
                      <option value="Tài khoản bàn giao bị sai mật khẩu / bị khóa không hỗ trợ kịp thời">
                        📩 [Phản ánh khách] Tài khoản sai pass / Lỗi không hỗ trợ
                      </option>
                      <option value="Thái độ phục vụ khiếm nhã, từ chối thực hiện bảo hành cam kết">
                        📩 [Phản ánh khách] Thái độ khiếm nhã, trốn tránh bảo hành
                      </option>
                      <option value="Khác">Lý do khác (Nhập chi tiết bên dưới)</option>
                    </select>

                    <textarea
                      rows={3}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Nhập chi tiết căn cứ cảnh cáo và yêu cầu khắc phục gửi cho shop..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* SUSPEND ACTION */}
              {modalType === 'SUSPEND' && (
                <div className="space-y-4">
                  <div className="p-3.5 rounded-2xl bg-orange-50 border border-orange-200/80 text-xs text-orange-950 leading-relaxed">
                    <strong>Chế tài tạm khóa:</strong> Toàn bộ sản phẩm của shop sẽ bị tạm ẩn khỏi sàn thương mại, chặn người bán đăng bán mới hoặc rút tiền cho đến khi hết hạn khóa.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Chọn thời hạn tạm khóa <span className="text-rose-500">*</span>:
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { days: 3, label: '3 Ngày' },
                        { days: 7, label: '7 Ngày' },
                        { days: 14, label: '14 Ngày' },
                        { days: 30, label: '30 Ngày' },
                      ].map((item) => (
                        <button
                          key={item.days}
                          type="button"
                          onClick={() => setSuspendDays(item.days)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            suspendDays === item.days
                              ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lý do tạm khóa gian hàng <span className="text-rose-500">*</span>:
                    </label>
                    <textarea
                      rows={3}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Ví dụ: Tạm khóa 7 ngày do phát sinh khiếu nại tài khoản bị chủ cũ lấy lại và shop không giải quyết..."
                      className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* BAN ACTION */}
              {modalType === 'BAN' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 leading-relaxed">
                    <div className="flex items-center gap-2 font-bold text-rose-700 mb-1">
                      <AlertOctagon className="w-4 h-4" />
                      <span>CẢNH BÁO MỨC ĐỘ CAO NHẤT</span>
                    </div>
                    Khóa vĩnh viễn sẽ **chấm dứt vĩnh viễn** hoạt động của gian hàng. Định danh CCCD{' '}
                    <code className="font-mono font-bold text-rose-800">
                      {selectedShop.idCardNumber || 'của chủ shop'}
                    </code>{' '}
                    và số tài khoản ngân hàng liên kết sẽ được đưa vào **Danh Sách Đen (Blacklist)**, không thể tạo shop mới trên hệ thống.
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Lý do áp dụng cấm vĩnh viễn <span className="text-rose-500">*</span>:
                    </label>
                    <textarea
                      rows={3}
                      value={actionReason}
                      onChange={(e) => setActionReason(e.target.value)}
                      placeholder="Ví dụ: Hành vi lừa đảo chiếm đoạt tài sản người mua, phát tán mã độc độc hại..."
                      className="w-full p-3 rounded-xl border border-rose-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* REACTIVATE ACTION */}
              {modalType === 'REACTIVATE' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 leading-relaxed">
                    Gỡ bỏ chế tài xử phạt và khôi phục trạng thái hoạt động bình thường cho gian hàng{' '}
                    <strong>{selectedShop.name}</strong>. Các sản phẩm của shop sẽ được hiển thị trở lại trên sàn.
                  </div>
                </div>
              )}

              {/* DETAILS ACTION */}
              {modalType === 'DETAILS' && (
                <div className="space-y-4 text-xs">
                  {/* Summary grid */}
                  <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <div>
                      <span className="text-slate-400">Chủ sở hữu:</span>
                      <div className="font-bold text-slate-800 mt-0.5">{selectedShop.ownerFullName || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Số định danh CCCD:</span>
                      <div className="font-mono font-bold text-slate-800 mt-0.5">{selectedShop.idCardNumber || 'N/A'}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Số điện thoại:</span>
                      <div className="font-bold text-slate-800 mt-0.5">{selectedShop.phone}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>
                      <div className="font-bold text-slate-800 mt-0.5">{selectedShop.email}</div>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400">Địa chỉ kho hàng:</span>
                      <div className="text-slate-700 mt-0.5">{selectedShop.address}</div>
                    </div>
                  </div>

                  {/* Sanctions History */}
                  <div>
                    <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      <span>Lịch Sử Chế Tài & Xử Phạt ({selectedShop.sanctionHistory?.length || 0})</span>
                    </h4>

                    {(!selectedShop.sanctionHistory || selectedShop.sanctionHistory.length === 0) ? (
                      <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-slate-400">
                        Gian hàng này chưa từng bị xử phạt hoặc có tiền sử vi phạm nào.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedShop.sanctionHistory.map((item) => (
                          <div
                            key={item.id}
                            className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  item.action === 'BAN'
                                    ? 'bg-rose-100 text-rose-700'
                                    : item.action === 'SUSPEND'
                                    ? 'bg-orange-100 text-orange-700'
                                    : item.action === 'WARN'
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {item.action === 'BAN' && 'CẤM VĨNH VIỄN'}
                                {item.action === 'SUSPEND' && 'TẠM KHÓA'}
                                {item.action === 'WARN' && 'CẢNH CÁO'}
                                {item.action === 'REACTIVATE' && 'MỞ KHÓA'}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(item.issuedAt).toLocaleString('vi-VN')}
                              </span>
                            </div>
                            <p className="text-slate-700 font-medium text-xs">{item.reason}</p>
                            <div className="text-[10px] text-slate-400 flex items-center justify-between">
                              <span>Người thực hiện: {item.adminName}</span>
                              {item.penaltyPoints && (
                                <span className="font-bold text-rose-600">+{item.penaltyPoints} Điểm phạt</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Action Panel inside DETAILS */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Thực Hiện Chế Tài Trực Tiếp Cho Gian Hàng Này</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Nếu qua kiểm tra bạn phát hiện sai phạm, có thể lập tức áp dụng chế tài mà không cần qua tố cáo:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenAction(selectedShop, 'WARN')}
                        className="py-2.5 px-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-center text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        ⚠️ Cảnh Báo Ngay
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAction(selectedShop, 'SUSPEND')}
                        className="py-2.5 px-2 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-900 font-bold text-center text-xs transition-colors cursor-pointer"
                      >
                        ⏳ Khóa 3-30 Ngày
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAction(selectedShop, 'BAN')}
                        className="py-2.5 px-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-center text-xs transition-colors cursor-pointer"
                      >
                        🚫 Cấm Vĩnh Viễn
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenAction(selectedShop, 'REACTIVATE')}
                        className="py-2.5 px-2 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-center text-xs transition-colors cursor-pointer"
                      >
                        🔓 Mở Khóa Shop
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              {modalType !== 'DETAILS' && (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmAction}
                  className={`px-5 py-2 rounded-xl text-white text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    modalType === 'BAN'
                      ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                      : modalType === 'SUSPEND'
                      ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-600/20'
                      : modalType === 'WARN'
                      ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                  }`}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác Nhận Thực Hiện'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShopManagementView;
