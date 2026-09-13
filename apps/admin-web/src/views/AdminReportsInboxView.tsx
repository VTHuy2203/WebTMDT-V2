import React, { useEffect, useState } from 'react';
import type { UserReport, UserReportStatus, UserReportTargetType } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import {
  Inbox,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Store,
  Package,
  ShoppingBag,
  ExternalLink,
  Clock,
  Ban,
  Slash,
  MessageSquare,
  FileImage,
  Send,
  AlertOctagon,
  X,
} from 'lucide-react';

export const AdminReportsInboxView: React.FC = () => {
  const [reports, setReports] = useState<UserReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserReportStatus>('ALL');
  const [targetTypeFilter, setTargetTypeFilter] = useState<'ALL' | UserReportTargetType>('ALL');

  // Resolution modal
  const [selectedReport, setSelectedReport] = useState<UserReport | null>(null);
  const [actionType, setActionType] = useState<
    'WARN_SHOP' | 'SUSPEND_SHOP_TEMP' | 'BAN_SHOP_PERM' | 'HIDE_PRODUCT' | 'REFUND_ORDER' | 'DISMISS'
  >('WARN_SHOP');
  const [actionNotes, setActionNotes] = useState('');
  const [suspendDays, setSuspendDays] = useState<number>(7);
  const [penaltyPoints, setPenaltyPoints] = useState<number>(2);
  const [submitting, setSubmitting] = useState(false);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getUserReports();
      setReports([...data]);
    } catch (err) {
      console.error('Failed to load user reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  // Stats
  const totalCount = reports.length;
  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;
  const investigatingCount = reports.filter((r) => r.status === 'INVESTIGATING').length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;
  const dismissedCount = reports.filter((r) => r.status === 'DISMISSED').length;

  const filteredReports = reports.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (targetTypeFilter !== 'ALL' && item.targetType !== targetTypeFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTicket = item.ticketCode.toLowerCase().includes(q);
      const matchReporter = item.reporterName.toLowerCase().includes(q) || item.reporterEmail.toLowerCase().includes(q);
      const matchTarget = item.targetName.toLowerCase().includes(q) || (item.shopName?.toLowerCase().includes(q) || false);
      const matchReason = item.reasonTitle.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
      return matchTicket || matchReporter || matchTarget || matchReason;
    }
    return true;
  });

  const handleOpenResolve = (rep: UserReport) => {
    setSelectedReport(rep);
    if (rep.targetType === 'SHOP') {
      setActionType('WARN_SHOP');
    } else if (rep.targetType === 'PRODUCT') {
      setActionType('HIDE_PRODUCT');
    } else {
      setActionType('REFUND_ORDER');
    }
    setActionNotes('');
    setSuspendDays(7);
    setPenaltyPoints(2);
  };

  const handleConfirmResolve = async () => {
    if (!selectedReport) return;
    if (!actionNotes.trim()) {
      alert('Vui lòng nhập căn cứ phán quyết và nội dung phản hồi.');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.resolveUserReport(selectedReport.id, actionType, actionNotes.trim(), {
        suspendDays,
        penaltyPoints,
      });
      await loadReports();
      setSelectedReport(null);
    } catch (err) {
      console.error('Resolve report failed:', err);
      alert('Có lỗi xảy ra khi xử lý báo cáo.');
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
            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wider uppercase bg-rose-100 text-rose-700">
              An Toàn & Kiểm Soát Vi Phạm (Trust & Safety)
            </span>
            <span className="text-xs text-slate-400">• Trung tâm tiếp nhận tố cáo người dùng</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Hòm Thư Báo Cáo & Tố Cáo Vi Phạm
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Tiếp nhận tố cáo gian lận, nick lỗi, tài khoản bị back, hàng giả hoặc thái độ không chuẩn mực từ người mua. Điều tra bằng chứng và áp dụng chế tài trực tiếp lên gian hàng.
          </p>
        </div>
        <button
          onClick={loadReports}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs self-start cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới hòm thư</span>
        </button>
      </div>

      {/* KPI Cards */}
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
            <span className="text-xs font-semibold text-slate-500">Tất cả tố cáo</span>
            <Inbox className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Tổng số vé tiếp nhận</div>
        </div>

        <div
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-400/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700">Chờ Admin xử lý</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">{pendingCount}</div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Cần thẩm tra gấp</div>
        </div>

        <div
          onClick={() => setStatusFilter('INVESTIGATING')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'INVESTIGATING'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Đang điều tra</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">{investigatingCount}</div>
          <div className="text-[11px] text-amber-600/80 mt-0.5">Đang chờ shop giải trình</div>
        </div>

        <div
          onClick={() => setStatusFilter('RESOLVED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'RESOLVED'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-400/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Đã giải quyết</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-2">{resolvedCount}</div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Đã áp dụng chế tài</div>
        </div>

        <div
          onClick={() => setStatusFilter('DISMISSED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'DISMISSED'
              ? 'bg-slate-100 border-slate-400 ring-2 ring-slate-400/20'
              : 'bg-white border-slate-200/80 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Bác bỏ / Báo rác</span>
            <XCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-700 mt-2">{dismissedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Không có cơ sở</div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã vé TC-XXXX, tên shop, người tố cáo, nội dung vi phạm..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all bg-slate-50/50"
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

        {/* Filter Target Type */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {(
            [
              { key: 'ALL', label: 'Tất cả đối tượng' },
              { key: 'SHOP', label: '🏪 Gian hàng' },
              { key: 'PRODUCT', label: '📦 Sản phẩm' },
              { key: 'ORDER', label: '🧾 Đơn hàng' },
            ] as const
          ).map((item) => (
            <button
              key={item.key}
              onClick={() => setTargetTypeFilter(item.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                targetTypeFilter === item.key
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Card List (< md: Phones) */}
      <div className="md:hidden space-y-3.5">
        {filteredReports.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
            <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
            <p className="font-semibold text-sm text-slate-700">Hòm thư báo cáo trống</p>
            <p className="text-xs text-slate-400 mt-1">Không có báo cáo vi phạm nào phù hợp điều kiện lọc</p>
          </div>
        ) : (
          filteredReports.map((rep) => {
            const isPending = rep.status === 'PENDING';
            const isResolved = rep.status === 'RESOLVED';
            const isDismissed = rep.status === 'DISMISSED';
            const isUrgent = rep.priority === 'URGENT';

            return (
              <div
                key={rep.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition-all ${
                  isPending && isUrgent
                    ? 'border-rose-300 bg-rose-50/15'
                    : isPending
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200/80'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-mono font-bold text-slate-900 text-xs">#{rep.ticketCode}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(rep.createdAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {rep.priority === 'URGENT' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                        ⚡ KHẨN CẤP
                      </span>
                    )}
                    {rep.priority === 'HIGH' && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        CAO
                      </span>
                    )}
                    {isPending ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                        Chờ xử lý
                      </span>
                    ) : isResolved ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Đã xử lý
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                        Đã đóng
                      </span>
                    )}
                  </div>
                </div>

                {/* Target */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    {rep.targetType === 'SHOP' && <Store className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                    {rep.targetType === 'PRODUCT' && <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                    {rep.targetType === 'ORDER' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    <span className="truncate">{rep.targetName}</span>
                  </div>
                  {rep.shopName && rep.targetType !== 'SHOP' && (
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Gian hàng: <span className="font-semibold text-slate-700">{rep.shopName}</span>
                    </div>
                  )}
                </div>

                {/* Reason & Content */}
                <div className="text-xs space-y-1">
                  <div className="font-bold text-rose-700">{rep.reasonTitle}</div>
                  <p className="text-slate-600 line-clamp-3 text-[11px] leading-relaxed">{rep.description}</p>
                  {rep.evidenceImages && rep.evidenceImages.length > 0 && (
                    <div className="flex items-center gap-1 text-[10px] text-purple-600 font-bold">
                      <FileImage className="w-3 h-3" />
                      <span>{rep.evidenceImages.length} ảnh bằng chứng</span>
                    </div>
                  )}
                </div>

                {/* Reporter & Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-500 truncate">
                    Bởi: <span className="font-semibold text-slate-700">{rep.reporterName}</span>
                  </div>
                  <button
                    onClick={() => handleOpenResolve(rep)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                      isPending
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isPending ? 'Thẩm tra & Xử lý' : 'Xem lại vé'}</span>
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
          <table className="w-full min-w-[1020px] text-left text-xs text-slate-600 border-collapse">
            <thead className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 min-w-[150px]">Mã vé & Ưu tiên</th>
                <th className="py-3.5 px-4 min-w-[200px]">Đối tượng bị tố cáo</th>
                <th className="py-3.5 px-4 min-w-[260px]">Lý do & Mô tả vi phạm</th>
                <th className="py-3.5 px-4 min-w-[160px]">Người tố cáo</th>
                <th className="py-3.5 px-4 min-w-[140px]">Trạng thái xử lý</th>
                <th className="py-3.5 px-4 min-w-[170px] text-right sticky right-0 bg-slate-50/95 backdrop-blur-xs shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)]">
                  Phán quyết
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Inbox className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
                    <p className="font-semibold text-sm">Hòm thư báo cáo trống</p>
                    <p className="text-xs text-slate-400 mt-1">Không có báo cáo vi phạm nào phù hợp điều kiện lọc</p>
                  </td>
                </tr>
              ) : (
                filteredReports.map((rep) => {
                  const isPending = rep.status === 'PENDING';
                  const isResolved = rep.status === 'RESOLVED';
                  const isDismissed = rep.status === 'DISMISSED';
                  const isUrgent = rep.priority === 'URGENT';

                  return (
                    <tr
                      key={rep.id}
                      className={`group hover:bg-slate-50/80 transition-colors ${
                        isPending && isUrgent ? 'bg-rose-50/25' : isPending ? 'bg-amber-50/15' : ''
                      }`}
                    >
                      {/* Ticket Code & Priority */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{rep.ticketCode}</span>
                        </div>
                        <div className="mt-1">
                          {rep.priority === 'URGENT' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-700 border border-rose-200">
                              ⚡ KHẨN CẤP
                            </span>
                          )}
                          {rep.priority === 'HIGH' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              ƯU TIÊN CAO
                            </span>
                          )}
                          {rep.priority === 'MEDIUM' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700">
                              TRUNG BÌNH
                            </span>
                          )}
                          {rep.priority === 'LOW' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                              BÌNH THƯỜNG
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-1">
                          {new Date(rep.createdAt).toLocaleDateString('vi-VN')}
                        </div>
                      </td>

                      {/* Reported Target */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          {rep.targetType === 'SHOP' && <Store className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                          {rep.targetType === 'PRODUCT' && <Package className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                          {rep.targetType === 'ORDER' && <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          <span className="font-bold text-slate-900 text-xs line-clamp-1">{rep.targetName}</span>
                        </div>
                        {rep.shopName && rep.targetType !== 'SHOP' && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Shop: <span className="font-semibold">{rep.shopName}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          ID: {rep.targetId}
                        </div>
                      </td>

                      {/* Reason & Details */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-bold text-slate-800 text-xs line-clamp-1 text-rose-700">
                          {rep.reasonTitle}
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                          {rep.description}
                        </p>
                        {rep.evidenceImages && rep.evidenceImages.length > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-purple-600 font-bold mt-1">
                            <FileImage className="w-3 h-3" />
                            <span>{rep.evidenceImages.length} ảnh bằng chứng</span>
                          </div>
                        )}
                      </td>

                      {/* Reporter Info */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 text-xs">{rep.reporterName}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{rep.reporterEmail}</div>
                        {rep.reporterPhone && (
                          <div className="text-[10px] text-slate-400 mt-0.5">SĐT: {rep.reporterPhone}</div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Chờ xử lý</span>
                          </span>
                        )}
                        {rep.status === 'INVESTIGATING' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Đang điều tra</span>
                          </span>
                        )}
                        {isResolved && (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Đã xử lý</span>
                            </span>
                            {rep.adminActionTaken && (
                              <div className="text-[10px] font-bold text-slate-600 mt-1">
                                Chế tài: {rep.adminActionTaken}
                              </div>
                            )}
                          </div>
                        )}
                        {isDismissed && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                            <XCircle className="w-3 h-3" />
                            <span>Đã bác bỏ</span>
                          </span>
                        )}
                      </td>

                      {/* Action - Sticky Right Column */}
                      <td className="py-4 px-4 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50/95 transition-colors shadow-[-6px_0_12px_-4px_rgba(0,0,0,0.06)]">
                        <button
                          onClick={() => handleOpenResolve(rep)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
                            isPending
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isPending ? 'Thẩm tra & Xử lý' : 'Xem lại vé'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Resolution Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50 duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {selectedReport.ticketCode}
                    </span>
                    <span className="text-xs font-bold text-rose-700">Tố Cáo Vi Phạm Sàn</span>
                  </div>
                  <h3 className="font-black text-slate-900 text-lg mt-0.5">
                    {selectedReport.reasonTitle}
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setSelectedReport(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="py-4 space-y-5 text-xs">
              {/* Report Details Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400">Người tố cáo:</span>
                    <div className="font-bold text-slate-800 mt-0.5">
                      {selectedReport.reporterName} ({selectedReport.reporterEmail})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Đối tượng bị tố cáo:</span>
                    <div className="font-bold text-rose-700 mt-0.5">
                      {selectedReport.targetName}
                    </div>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Nội dung tố cáo chi tiết:</span>
                  <div className="p-3 rounded-xl bg-white border border-slate-200 text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedReport.description}
                  </div>
                </div>

                {/* Evidence Images */}
                {selectedReport.evidenceImages && selectedReport.evidenceImages.length > 0 && (
                  <div>
                    <span className="text-slate-400">Hình ảnh bằng chứng:</span>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {selectedReport.evidenceImages.map((img, idx) => (
                        <a
                          key={idx}
                          href={img}
                          target="_blank"
                          rel="noreferrer"
                          className="relative group block rounded-xl overflow-hidden border border-slate-300 w-24 h-24 bg-slate-100"
                        >
                          <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                            Xem ảnh ↗
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sanctions & Action Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-2">
                  Phán quyết chế tài của Quản trị viên đối với vụ việc này:
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionType('WARN_SHOP')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      actionType === 'WARN_SHOP'
                        ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/20 text-amber-900 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>1. Cảnh cáo Shop</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Trừ điểm uy tín, ghi hồ sơ vi phạm
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('SUSPEND_SHOP_TEMP')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      actionType === 'SUSPEND_SHOP_TEMP'
                        ? 'bg-orange-50 border-orange-400 ring-2 ring-orange-400/20 text-orange-900 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>2. Khóa shop có ngày</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Khóa 3, 7, 14, 30 ngày, ẩn sản phẩm
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('BAN_SHOP_PERM')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      actionType === 'BAN_SHOP_PERM'
                        ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-400/20 text-rose-900 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Ban className="w-4 h-4 text-rose-600" />
                      <span>3. Khóa vĩnh viễn</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Cấm shop & Blacklist định danh CCCD
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('HIDE_PRODUCT')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      actionType === 'HIDE_PRODUCT'
                        ? 'bg-purple-50 border-purple-400 ring-2 ring-purple-400/20 text-purple-900 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Slash className="w-4 h-4 text-purple-600" />
                      <span>4. Gỡ bỏ sản phẩm</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Khóa nick / key phần mềm vi phạm
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('REFUND_ORDER')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      actionType === 'REFUND_ORDER'
                        ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-400/20 text-blue-900 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <ShoppingBag className="w-4 h-4 text-blue-600" />
                      <span>5. Hoàn tiền khách</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Hoàn tiền VietQR về tài khoản mua
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionType('DISMISS')}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                      actionType === 'DISMISS'
                        ? 'bg-slate-200 border-slate-400 text-slate-900 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <XCircle className="w-4 h-4 text-slate-500" />
                      <span>6. Bác bỏ tố cáo</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-normal">
                      Không có căn cứ hoặc báo cáo rác
                    </p>
                  </button>
                </div>
              </div>

              {/* Action specific sub-inputs */}
              {actionType === 'SUSPEND_SHOP_TEMP' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Thời hạn tạm khóa:
                  </label>
                  <div className="flex gap-2">
                    {[3, 7, 14, 30].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setSuspendDays(d)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          suspendDays === d
                            ? 'bg-orange-600 text-white border-orange-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {d} Ngày
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {actionType === 'WARN_SHOP' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Điểm phạt Sao Quả Tạ:
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPenaltyPoints(p)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          penaltyPoints === p
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        +{p} Điểm phạt
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  Căn cứ phán quyết & Nội dung phản hồi kết quả <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Ví dụ: Đã kiểm tra lịch sử chat và bằng chứng đăng nhập. Xác nhận lỗi từ phía shop. Áp dụng chế tài cảnh cáo và yêu cầu shop bồi thường ngay trong 24h..."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Đóng
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmResolve}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-sm shadow-rose-600/20 cursor-pointer"
              >
                {submitting ? 'Đang thực hiện...' : 'Ban Hành Phán Quyết & Đóng Vé'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportsInboxView;
