import React, { useEffect, useState } from 'react';
import type { SellerApplication } from '@marketplace/types';
import { sellerApi } from '@marketplace/api-client';
import { Button, Input, StatusBadge } from '@marketplace/ui';
import { Store, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const SellerRegisterView: React.FC = () => {
  const [app, setApp] = useState<SellerApplication | null>(null);
  const [shopName, setShopName] = useState('TechZone Audio & Gadget');
  const [ownerFullName, setOwnerFullName] = useState('Trần Minh Tuấn');
  const [idCardNumber, setIdCardNumber] = useState('079094001234');
  const [bankName, setBankName] = useState('Vietcombank');
  const [bankAccountNumber, setBankAccountNumber] = useState('9988776655');
  const [bankAccountHolder, setBankAccountHolder] = useState('TRAN MINH TUAN');
  const [pickupAddress, setPickupAddress] = useState('45 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh');
  const [shopDescription, setShopDescription] = useState('Chuyên tai nghe audiophile, loa bluetooth chính hãng.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      const current = await sellerApi.getMyApplication();
      if (current) {
        setApp(current);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const created = await sellerApi.applyAsSeller({
        shopName,
        ownerFullName,
        idCardNumber,
        bankAccount: {
          bankName,
          accountNumber: bankAccountNumber,
          accountHolder: bankAccountHolder,
        },
        pickupAddress,
        shopDescription,
      });
      setApp(created);
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Đăng Ký Hồ Sơ Gian Hàng Người Bán</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Quy trình xét duyệt gian hàng phân phối đồ công nghệ chính hãng trên sàn
        </p>
      </div>

      {app && app.status === 'PENDING' ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-4 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Hồ sơ gian hàng đang chờ Ban Quản Trị phê duyệt</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Gian hàng <strong>{app.shopName}</strong> của bạn đã được gửi thành công. Đội ngũ kiểm duyệt sàn sẽ xác minh giấy tờ CCCD/CMND và tài khoản ngân hàng SePay trong vòng 24 giờ làm việc.
          </p>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs max-w-md mx-auto space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Chủ gian hàng:</span>
              <span className="font-bold text-slate-900">{app.ownerFullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Số CCCD:</span>
              <span className="font-mono text-slate-900">{app.idCardNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Trạng thái:</span>
              <StatusBadge status={app.status} />
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-8 space-y-6 shadow-xs">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              1. Thông Tin Gian Hàng
            </h3>
            <Input
              label="Tên gian hàng hiển thị"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
            <Input
              label="Mô tả ngành hàng / Thương hiệu kinh doanh"
              required
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
            />
            <Input
              label="Địa chỉ kho lấy hàng (Shipper lấy hàng tận nơi)"
              required
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              2. Định Danh Pháp Lý Chủ Sở Hữu
            </h3>
            <Input
              label="Họ và tên chủ sở hữu (theo CCCD)"
              required
              value={ownerFullName}
              onChange={(e) => setOwnerFullName(e.target.value)}
            />
            <Input
              label="Số CCCD / CMND"
              required
              value={idCardNumber}
              onChange={(e) => setIdCardNumber(e.target.value)}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              3. Tài Khoản Ngân Hàng Nhận Tiền Doanh Số
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Ngân hàng"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
              />
              <Input
                label="Số tài khoản ngân hàng"
                required
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
              />
            </div>
            <Input
              label="Tên chủ tài khoản (Viết in hoa không dấu)"
              required
              value={bankAccountHolder}
              onChange={(e) => setBankAccountHolder(e.target.value)}
            />
          </div>

          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Gửi Hồ Sơ Xét Duyệt Gian Hàng
          </Button>
        </form>
      )}
    </div>
  );
};
