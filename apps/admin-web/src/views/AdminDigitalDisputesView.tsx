import React, { useEffect, useState } from 'react';
import type { DigitalDispute } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import {
  ShieldAlert,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  Gavel,
  ArrowRight,
} from 'lucide-react';

export const AdminDigitalDisputesView: React.FC = () => {
  const [disputes, setDisputes] = useState<DigitalDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Resolution modal
  const [selectedDispute, setSelectedDispute] = useState<DigitalDispute | null>(null);
  const [resolutionType, setResolutionType] = useState<'REFUND' | 'REPLACE' | 'DISMISS'>('REFUND');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  const loadDisputes = async () => {
    setLoading(true);
    try {
      const list = await adminApi.getDigitalDisputes();
      setDisputes(list);
    } catch (err) {
      console.error('Failed to load disputes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const handleOpenResolve = (dispute: DigitalDispute) => {
    setSelectedDispute(dispute);
    setResolutionType('REFUND');
    setResolutionNotes('');
  };

  const handleConfirmResolve = async () => {
    if (!selectedDispute) return;
    if (!resolutionNotes.trim()) {
      alert('Vui lòng nhập lý do và căn cứ phán quyết tranh chấp.');
      return;
    }

    setResolving(true);
    try {
      await adminApi.resolveDigitalDispute(selectedDispute.id, resolutionType, resolutionNotes.trim());
      setSelectedDispute(null);
      await loadDisputes();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi xử lý tranh chấp.');
    } finally {
      setResolving(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    const isOpen = d.status === 'PENDING_SELLER_RESPONSE' || d.status === 'ESCALATED_TO_ADMIN';
    const isResolved = d.status === 'RESOLVED_REPLACED' || d.status === 'RESOLVED_REFUNDED';
    const matchesSearch =
      searchQuery === '' ||
      d.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.issueType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'OPEN' && isOpen) ||
      (statusFilter === 'RESOLVED' && isResolved) ||
      d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-rose-600" />
            Trọng Tài Tranh Chấp Tài Khoản Game
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Xử lý khiếu nại sai mật khẩu, tài khoản bị thu hồi hoặc vi phạm bảo hành giữa Người Mua và Người Bán
          </p>
        </div>

        <button
          onClick={loadDisputes}
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
            placeholder="Tìm theo mã khiếu nại, mã đơn hàng, loại sự cố..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="w-full md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="OPEN">Đang chờ xử lý (Open)</option>
            <option value="RESOLVED">Đã giải quyết (Resolved)</option>
            <option value="REJECTED">Đã bác bỏ / Huỷ</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[920px] text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5 min-w-[130px]">Mã khiếu nại</th>
                <th className="px-6 py-3.5 min-w-[120px]">Mã đơn</th>
                <th className="px-6 py-3.5 min-w-[160px]">Loại sự cố</th>
                <th className="px-6 py-3.5 min-w-[150px]">Yêu cầu mong muốn</th>
                <th className="px-6 py-3.5 min-w-[120px]">Trạng thái</th>
                <th className="px-6 py-3.5 min-w-[110px]">Ngày tạo</th>
                <th className="px-6 py-3.5 min-w-[130px] text-right">Phán quyết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
                    Đang tải danh sách khiếu nại...
                  </td>
                </tr>
              ) : filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    Không có tranh chấp nào hoặc không khớp bộ lọc tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((disp) => {
                  const isOpen = disp.status === 'PENDING_SELLER_RESPONSE' || disp.status === 'ESCALATED_TO_ADMIN';
                  const isResolved = disp.status === 'RESOLVED_REPLACED' || disp.status === 'RESOLVED_REFUNDED';
                  return (
                    <tr key={disp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-900">{disp.id}</td>
                      <td className="px-6 py-4 font-mono text-xs text-indigo-600 font-semibold">{disp.orderId}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-rose-700 block text-xs">{disp.issueType}</span>
                        <span className="text-xs text-slate-500 line-clamp-1">{disp.description}</span>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">{disp.desiredSolution}</td>
                      <td className="px-6 py-4">
                        {isOpen ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">
                            Chờ phán quyết
                          </span>
                        ) : isResolved ? (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                            Đã giải quyết ({disp.adminResolution?.resolution || 'Xong'})
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
                            {disp.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        {new Date(disp.createdAt).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleOpenResolve(disp)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 ml-auto transition-colors"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          {isOpen ? 'Xử lý' : 'Xem lại'}
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

      {/* RESOLUTION MODAL */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Gavel className="w-5 h-5 text-purple-600" />
                  Phán Quyết Tranh Chấp #{selectedDispute.id}
                </h3>
                <span className="text-xs text-slate-500">Mã đơn liên quan: {selectedDispute.orderId}</span>
              </div>
            </div>

            <div className="space-y-4">
              {/* Evidence & Descriptions */}
              <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-700">
                <div>
                  <strong className="text-slate-900">Loại khiếu nại:</strong> {selectedDispute.issueType}
                </div>
                <div>
                  <strong className="text-slate-900">Mô tả của người mua:</strong>
                  <p className="mt-1 p-2 bg-white rounded border border-slate-200">{selectedDispute.description}</p>
                </div>
                <div>
                  <strong className="text-slate-900">Phương án người mua đề xuất:</strong>{' '}
                  {selectedDispute.desiredSolution}
                </div>

                {selectedDispute.evidenceImages && selectedDispute.evidenceImages.length > 0 && (
                  <div>
                    <strong className="text-slate-900 block mb-1">Ảnh chụp bằng chứng lỗi:</strong>
                    <div className="flex gap-2">
                      {selectedDispute.evidenceImages.map((img, idx) => (
                        <a key={idx} href={img} target="_blank" rel="noreferrer">
                          <img
                            src={img}
                            alt="Evidence"
                            className="w-20 h-20 object-cover rounded-lg border border-slate-300"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Resolution options */}
              {selectedDispute.status === 'PENDING_SELLER_RESPONSE' || selectedDispute.status === 'ESCALATED_TO_ADMIN' ? (
                <div className="space-y-4 border-t border-slate-200 pt-4">
                  <label className="block text-xs font-bold uppercase text-slate-700">Quyết định của Sàn *</label>
                  <div className="grid grid-cols-3 gap-3">
                    <label
                      className={`p-3 rounded-xl border-2 text-center cursor-pointer text-xs font-bold transition-all ${
                        resolutionType === 'REFUND'
                          ? 'border-rose-600 bg-rose-50 text-rose-700'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resType"
                        checked={resolutionType === 'REFUND'}
                        onChange={() => setResolutionType('REFUND')}
                        className="sr-only"
                      />
                      Hoàn tiền cho khách
                    </label>

                    <label
                      className={`p-3 rounded-xl border-2 text-center cursor-pointer text-xs font-bold transition-all ${
                        resolutionType === 'REPLACE'
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resType"
                        checked={resolutionType === 'REPLACE'}
                        onChange={() => setResolutionType('REPLACE')}
                        className="sr-only"
                      />
                      Yêu cầu đổi acc khác
                    </label>

                    <label
                      className={`p-3 rounded-xl border-2 text-center cursor-pointer text-xs font-bold transition-all ${
                        resolutionType === 'DISMISS'
                          ? 'border-slate-700 bg-slate-100 text-slate-800'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resType"
                        checked={resolutionType === 'DISMISS'}
                        onChange={() => setResolutionType('DISMISS')}
                        className="sr-only"
                      />
                      Bác bỏ khiếu nại
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Căn cứ phán quyết & Ghi chú gửi 2 bên *
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Ghi rõ lý do hoàn tiền / bác bỏ dựa trên bằng chứng kiểm tra..."
                      required
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                  <strong>Phán quyết đã ban hành:</strong> {selectedDispute.adminResolution?.resolution || selectedDispute.status}
                  <p className="mt-1">Ghi chú: {selectedDispute.adminResolution?.notes || 'Đã giải quyết theo quy chế sàn.'}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200 mt-6">
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              {(selectedDispute.status === 'PENDING_SELLER_RESPONSE' || selectedDispute.status === 'ESCALATED_TO_ADMIN') && (
                <button
                  type="button"
                  onClick={handleConfirmResolve}
                  disabled={resolving}
                  className="px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {resolving ? 'Đang thực hiện...' : 'Ban hành phán quyết'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
