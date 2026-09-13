import React, { useEffect, useState } from 'react';
import type { Product } from '@marketplace/types';
import { adminApi } from '@marketplace/api-client';
import { Button, StatusBadge, Modal, EmptyState } from '@marketplace/ui';
import { formatCurrency } from '@marketplace/utils';
import { Check, X, ShieldCheck, Eye, Sparkles } from 'lucide-react';

export const AdminProductModerationView: React.FC = () => {
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await adminApi.getPendingProducts();
      setPendingProducts(data);
    }
    load();
  }, []);

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedProduct) return;
    setIsProcessing(true);
    try {
      await adminApi.reviewProduct(selectedProduct.id, action, rejectReason);
      setModalOpen(false);
      const updated = await adminApi.getPendingProducts();
      setPendingProducts(updated);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Kiểm Duyệt Sản Phẩm Công Nghệ</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Kiểm tra tính chính xác của chip CPU, RAM, GPU và thông tin bảo hành trước khi cho phép bán
        </p>
      </div>

      {pendingProducts.length === 0 ? (
        <EmptyState
          title="Không có sản phẩm nào đang chờ kiểm duyệt"
          description="Tất cả các sản phẩm điện tử đăng mới từ các shop đã được xử lý."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pendingProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 border">
                  <img src={prod.thumbnail} alt="" className="w-full h-full object-cover" />
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-blue-600">{prod.category.name}</span>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 mt-0.5">{prod.name}</h3>
                  <span className="text-sm font-extrabold text-red-600 block mt-1">
                    {formatCurrency(prod.basePrice)}
                  </span>
                </div>

                {/* Hardware Highlights */}
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px]">
                  {prod.specifications.slice(0, 3).map((s) => (
                    <div key={s.key} className="flex justify-between">
                      <span className="text-slate-500">{s.label}:</span>
                      <span className="font-semibold text-slate-800 text-right truncate max-w-[60%]">{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                size="sm"
                onClick={() => {
                  setSelectedProduct(prod);
                  setRejectReason('');
                  setModalOpen(true);
                }}
                className="w-full"
              >
                Xem chi tiết & Thẩm định
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Product Moderation Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thẩm Định Sản Phẩm Công Nghệ"
        maxWidth="xl"
      >
        {selectedProduct && (
          <div className="space-y-5 text-xs">
            <div className="flex gap-4">
              <img src={selectedProduct.thumbnail} alt="" className="w-24 h-24 rounded-2xl object-cover border shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">{selectedProduct.name}</h3>
                <p className="text-slate-500 mt-1">Gian hàng: <strong>{selectedProduct.shop.name}</strong></p>
                <p className="text-red-600 font-bold text-sm mt-1">{formatCurrency(selectedProduct.basePrice)}</p>
              </div>
            </div>

            {/* Specifications Full List */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Thông số kỹ thuật khai báo:
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {selectedProduct.specifications.map((s) => (
                  <div key={s.key} className="flex justify-between py-1 border-b border-slate-200/60">
                    <span className="text-slate-500">{s.label}:</span>
                    <span className="font-semibold text-slate-900">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lý do từ chối (nếu thông số sai lệch hoặc không đạt chuẩn):
              </label>
              <textarea
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do phản hồi lại cho người bán..."
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
                Từ chối đăng bán
              </Button>
              <Button
                variant="primary"
                isLoading={isProcessing}
                onClick={() => handleReview('APPROVE')}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Check className="w-4 h-4 mr-1" />
                Duyệt & Cho phép hiển thị (ACTIVE)
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
