import React, { useEffect, useState } from 'react';
import type { RegisteredWarranty } from '@marketplace/types';
import { warrantyApi } from '@marketplace/api-client';
import { Button, StatusBadge, Modal, Input, EmptyState } from '@marketplace/ui';
import { formatDate } from '@marketplace/utils';
import { ShieldCheck, Calendar, Wrench, AlertCircle, CheckCircle2 } from 'lucide-react';

export const WarrantiesView: React.FC = () => {
  const [warranties, setWarranties] = useState<RegisteredWarranty[]>([]);
  const [selectedWarranty, setSelectedWarranty] = useState<RegisteredWarranty | null>(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [issueDescription, setIssueDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await warrantyApi.getWarranties();
      setWarranties(data);
    }
    load();
  }, []);

  const handleOpenClaim = (w: RegisteredWarranty) => {
    setSelectedWarranty(w);
    setClaimSuccess(false);
    setIssueDescription('');
    setClaimModalOpen(true);
  };

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWarranty || !issueDescription.trim()) return;
    setIsSubmitting(true);
    try {
      await warrantyApi.submitClaim({
        warrantyId: selectedWarranty.id,
        serialNumber: selectedWarranty.serialNumber,
        issueDescription: issueDescription.trim(),
        evidenceImages: ['https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'],
      });
      setClaimSuccess(true);
      // Reload list
      const updated = await warrantyApi.getWarranties();
      setWarranties(updated);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Quản Lý Bảo Hành Điện Tử (Serial / IMEI)
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Theo dõi thời hạn bảo hành chính hãng và gửi yêu cầu sửa chữa trực tuyến
        </p>
      </div>

      {warranties.length === 0 ? (
        <EmptyState
          title="Chưa có thiết bị nào kích hoạt bảo hành"
          description="Khi bạn mua sản phẩm điện tử và thanh toán thành công, hệ thống sẽ tự động đăng ký bảo hành điện tử theo số Serial máy."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warranties.map((w) => (
            <div
              key={w.id}
              className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img src={w.productImage} alt="" className="w-14 h-14 rounded-xl object-cover border" />
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 line-clamp-1">{w.productName}</h3>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">Mã BH: {w.warrantyCode}</p>
                  </div>
                </div>
                <StatusBadge status={w.status} />
              </div>

              {/* Serial number box (Section 33) */}
              <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Số Serial / IMEI thiết bị:</span>
                <span className="font-mono font-bold text-blue-700">{w.serialNumber || 'Đang cập nhật'}</span>
              </div>

              {/* Dates & Provider */}
              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>Trung tâm bảo hành:</span>
                  <span className="font-semibold text-slate-800">{w.provider}</span>
                </div>
                <div className="flex justify-between">
                  <span>Thời gian hiệu lực:</span>
                  <span className="font-semibold text-slate-800">
                    {formatDate(w.startDate)} - {formatDate(w.endDate)} ({w.durationMonths} tháng)
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenClaim(w)}
                  className="w-full flex items-center justify-center gap-2 border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Yêu Cầu Bảo Hành / Sửa Chữa</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Claim Modal */}
      <Modal
        isOpen={claimModalOpen}
        onClose={() => setClaimModalOpen(false)}
        title="Gửi Yêu Cầu Bảo Hành Thiết Bị"
      >
        {claimSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-bold text-lg text-slate-900">Yêu cầu bảo hành đã được tiếp nhận!</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Kỹ thuật viên của hãng sẽ liên hệ với bạn trong vòng 24 giờ làm việc để hướng dẫn gửi thiết bị hoặc hỗ trợ tại nhà.
            </p>
            <Button onClick={() => setClaimModalOpen(false)} className="w-full">
              Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmitClaim} className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-500">Sản phẩm:</span>
              <p className="font-bold text-slate-900 mt-0.5">{selectedWarranty?.productName}</p>
              <p className="font-mono text-blue-600 mt-0.5">Serial: {selectedWarranty?.serialNumber}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mô tả lỗi hoặc sự cố thiết bị gặp phải:
              </label>
              <textarea
                rows={4}
                required
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Ví dụ: Máy bị sọc màn hình, pin sụt nhanh, cổng USB-C chập chờn..."
                className="w-full p-3 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setClaimModalOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Gửi yêu cầu
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
