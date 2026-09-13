import React, { useEffect, useState } from 'react';
import type { SellerApplication } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { Button, StatusBadge, Modal } from '@marketplace/ui';
import { formatDate } from '@marketplace/utils';
import { Check, X, ShieldCheck, Building2, Store, Clock } from 'lucide-react';

export const AdminSellerApprovalView: React.FC = () => {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<SellerApplication | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await adminApi.getSellerApplications();
      setApplications(data);
    }
    load();
  }, []);

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      await adminApi.reviewSeller(selectedApp.id, action, rejectReason);
      setModalOpen(false);
      const updated = await adminApi.getSellerApplications();
      setApplications(updated);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Phê Duyệt Gian Hàng Người Bán</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Thẩm định thông tin pháp lý, định danh CCCD và tài khoản ngân hàng SePay
        </p>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {applications.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400">
            Không có hồ sơ nào cần phê duyệt
          </div>
        ) : (
          applications.map((app) => (
            <div key={app.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 block text-sm">{app.shopName}</span>
                  <span className="text-[11px] text-slate-500 line-clamp-1">{app.shopDescription}</span>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Chủ sở hữu & CCCD</span>
                  <span className="font-semibold text-slate-800">{app.ownerFullName}</span>{' '}
                  <code className="text-slate-500 font-mono text-[11px]">({app.idCardNumber})</code>
                </div>
                <div className="pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block">Ngân hàng thụ hưởng</span>
                  <span className="font-bold text-slate-800">{app.bankAccount.bankName}</span> -{' '}
                  <span className="font-mono text-blue-600 font-bold">{app.bankAccount.accountNumber}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[11px] text-slate-400">{formatDate(app.submittedAt, true)}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedApp(app);
                    setRejectReason('');
                    setModalOpen(true);
                  }}
                >
                  Xem & Phê duyệt
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Main Table (>= md: iPad & Desktop) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 min-w-[200px]">Tên Gian Hàng</th>
                <th className="p-4 min-w-[170px]">Chủ Sở Hữu & CCCD</th>
                <th className="p-4 min-w-[190px]">Tài Khoản Ngân Hàng</th>
                <th className="p-4 min-w-[140px]">Ngày Gửi Hồ Sơ</th>
                <th className="p-4 min-w-[120px]">Trạng Thái</th>
                <th className="p-4 min-w-[140px] text-right">Hành Động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <span className="font-bold text-slate-900 block text-sm">{app.shopName}</span>
                    <span className="text-[11px] text-slate-500 line-clamp-1">{app.shopDescription}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-semibold text-slate-800 block">{app.ownerFullName}</span>
                    <span className="font-mono text-slate-400 text-[11px]">CCCD: {app.idCardNumber}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800 block">{app.bankAccount.bankName}</span>
                    <span className="font-mono text-blue-600 font-bold">{app.bankAccount.accountNumber}</span>
                    <span className="text-[10px] text-slate-400 block">{app.bankAccount.accountHolder}</span>
                  </td>
                  <td className="p-4 text-slate-500">{formatDate(app.submittedAt, true)}</td>
                  <td className="p-4">
                    <StatusBadge status={app.status} />
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedApp(app);
                        setRejectReason('');
                        setModalOpen(true);
                      }}
                    >
                      Xem & Phê duyệt
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thẩm Định Hồ Sơ Gian Hàng"
        maxWidth="lg"
      >
        {selectedApp && (
          <div className="space-y-5 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Tên gian hàng:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedApp.shopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Loại hình kinh doanh:</span>
                <span className="font-bold text-purple-700">
                  {selectedApp.businessType === 'ENTERPRISE'
                    ? 'Doanh nghiệp / Công ty'
                    : selectedApp.businessType === 'HOUSEHOLD'
                    ? 'Hộ kinh doanh cá thể'
                    : 'Cá nhân kinh doanh'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Họ và tên chủ sở hữu (CCCD):</span>
                <span className="font-bold text-slate-900">{selectedApp.ownerFullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số CMND/CCCD gắn chip:</span>
                <span className="font-mono font-bold text-slate-900">{selectedApp.idCardNumber}</span>
              </div>
              {selectedApp.householdName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tên Hộ kinh doanh:</span>
                  <span className="font-bold text-slate-900">{selectedApp.householdName}</span>
                </div>
              )}
              {selectedApp.businessLicenseNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Số Giấy phép ĐKKD:</span>
                  <span className="font-mono font-bold text-purple-700">{selectedApp.businessLicenseNumber}</span>
                </div>
              )}
              {selectedApp.taxCode && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Mã số thuế (MST):</span>
                  <span className="font-mono font-bold text-slate-800">{selectedApp.taxCode}</span>
                </div>
              )}
              {selectedApp.businessCategories && selectedApp.businessCategories.length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Ngành hàng đăng ký:</span>
                  <span className="text-slate-800 font-medium">{selectedApp.businessCategories.join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Địa chỉ kho lấy hàng:</span>
                <span className="text-slate-800 text-right max-w-[65%]">{selectedApp.pickupAddress}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500">Tài khoản nhận tiền:</span>
                <span className="font-mono font-bold text-blue-700">
                  {selectedApp.bankAccount.bankName} - {selectedApp.bankAccount.accountNumber} ({selectedApp.bankAccount.accountHolder})
                </span>
              </div>

              {/* KYC Document Photos Preview */}
              {((selectedApp.idCardImages && selectedApp.idCardImages.length > 0) || selectedApp.idCardFrontImage || selectedApp.businessLicenseImage) && (
                <div className="pt-2.5 border-t border-slate-200 space-y-2">
                  <span className="text-slate-500 font-semibold block">
                    Tài liệu KYC thẩm định danh tính & Giấy phép:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedApp.idCardFrontImage && (
                      <div className="space-y-1 text-center">
                        <span className="text-[10px] text-slate-400 block">Mặt trước CCCD</span>
                        <a href={selectedApp.idCardFrontImage} target="_blank" rel="noreferrer">
                          <img
                            src={selectedApp.idCardFrontImage}
                            alt="Mặt trước CCCD"
                            className="w-full h-20 rounded-lg object-cover border border-slate-300 hover:opacity-90"
                          />
                        </a>
                      </div>
                    )}
                    {selectedApp.idCardBackImage && (
                      <div className="space-y-1 text-center">
                        <span className="text-[10px] text-slate-400 block">Mặt sau CCCD</span>
                        <a href={selectedApp.idCardBackImage} target="_blank" rel="noreferrer">
                          <img
                            src={selectedApp.idCardBackImage}
                            alt="Mặt sau CCCD"
                            className="w-full h-20 rounded-lg object-cover border border-slate-300 hover:opacity-90"
                          />
                        </a>
                      </div>
                    )}
                    {selectedApp.selfieWithIdImage && (
                      <div className="space-y-1 text-center">
                        <span className="text-[10px] text-slate-400 block">Chân dung cầm CCCD</span>
                        <a href={selectedApp.selfieWithIdImage} target="_blank" rel="noreferrer">
                          <img
                            src={selectedApp.selfieWithIdImage}
                            alt="Selfie cầm CCCD"
                            className="w-full h-20 rounded-lg object-cover border border-slate-300 hover:opacity-90"
                          />
                        </a>
                      </div>
                    )}
                    {selectedApp.businessLicenseImage && (
                      <div className="space-y-1 text-center">
                        <span className="text-[10px] text-slate-400 block">Giấy phép ĐKKD</span>
                        <a href={selectedApp.businessLicenseImage} target="_blank" rel="noreferrer">
                          <img
                            src={selectedApp.businessLicenseImage}
                            alt="Giấy phép ĐKKD"
                            className="w-full h-20 rounded-lg object-cover border border-slate-300 hover:opacity-90"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Ghi chú hoặc lý do từ chối (nếu có):
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do nếu hồ sơ thiếu thông tin định danh..."
                className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="danger"
                isLoading={isProcessing}
                onClick={() => handleReview('REJECT')}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-1" />
                Từ chối hồ sơ
              </Button>
              <Button
                variant="primary"
                isLoading={isProcessing}
                onClick={() => handleReview('APPROVE')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Phê duyệt gian hàng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
