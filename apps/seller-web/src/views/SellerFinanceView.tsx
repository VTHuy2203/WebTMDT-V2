import React, { useEffect, useState } from 'react';
import type { SellerFinanceSummary } from '@marketplace/types';
import { sellerApi } from '@marketplace/api-client';
import { Button, Modal, Input } from '@marketplace/ui';
import { formatCurrency } from '@marketplace/utils';
import { DollarSign, ArrowUpRight, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';

export const SellerFinanceView: React.FC = () => {
  const [finance, setFinance] = useState<SellerFinanceSummary | null>(null);
  const [payoutModalOpen, setPayoutModalOpen] = useState(false);
  const [amount, setAmount] = useState(20000000);
  const [bankName, setBankName] = useState('Vietcombank');
  const [accountNumber, setAccountNumber] = useState('9988776655');
  const [accountHolder, setAccountHolder] = useState('CONG TY CO PHAN GEARVN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await sellerApi.getFinance();
      setFinance(data);
    }
    load();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sellerApi.requestPayout(amount, { bankName, accountNumber, accountHolder });
      setPayoutSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Tài Chính & Doanh Thu Gian Hàng</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Đối soát dòng tiền bán hàng, phí sàn và rút tiền về tài khoản ngân hàng
          </p>
        </div>
        <Button
          onClick={() => {
            setPayoutSuccess(false);
            setPayoutModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Yêu Cầu Rút Tiền Về Ngân Hàng</span>
        </Button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-3xl shadow-lg space-y-2">
          <span className="text-xs font-semibold text-emerald-100 uppercase tracking-wider">
            Số Dư Khả Dụng (Có Thể Rút)
          </span>
          <div className="text-3xl font-black">
            {formatCurrency(finance?.availableBalance || 82500000)}
          </div>
          <p className="text-[11px] text-emerald-100">Đã trừ 5% phí sàn và các chiết khấu</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Đang Ký Quỹ Tạm Giữ (Escrow)
          </span>
          <div className="text-3xl font-black text-slate-900">
            {formatCurrency(finance?.pendingBalance || 62600000)}
          </div>
          <p className="text-[11px] text-slate-400">Tiền từ các đơn đang vận chuyển chưa hoàn tất</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Tổng Doanh Thu Đã Rút
          </span>
          <div className="text-3xl font-black text-slate-700">
            {formatCurrency(finance?.totalPaidOut || 45000000)}
          </div>
          <p className="text-[11px] text-slate-400">Đã thanh toán về số tài khoản Vietcombank</p>
        </div>
      </div>

      {/* Financial Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="font-bold text-sm text-slate-900">Chi Tiết Quyết Toán Doanh Số</h3>
        <div className="divide-y divide-slate-100 text-xs text-slate-700">
          <div className="py-3 flex justify-between">
            <span className="text-slate-500">Tổng doanh số gộp (Gross Merchandise Value):</span>
            <span className="font-bold text-slate-900">{formatCurrency(finance?.grossSales || 154000000)}</span>
          </div>
          <div className="py-3 flex justify-between text-red-600">
            <span>Phí hoa hồng nền tảng sàn (5%):</span>
            <span className="font-semibold">-{formatCurrency(finance?.platformFee || 7700000)}</span>
          </div>
          <div className="py-3 flex justify-between text-amber-600">
            <span>Hỗ trợ mã giảm giá voucher shop:</span>
            <span className="font-semibold">-{formatCurrency(finance?.voucherDeduction || 1200000)}</span>
          </div>
          <div className="py-3 flex justify-between text-slate-500">
            <span>Khấu trừ hoàn tiền hàng lỗi:</span>
            <span className="font-semibold text-slate-700">0 ₫</span>
          </div>
        </div>
      </div>

      {/* Payout Modal */}
      <Modal
        isOpen={payoutModalOpen}
        onClose={() => setPayoutModalOpen(false)}
        title="Lập Lệnh Yêu Cầu Rút Tiền Về Ngân Hàng"
      >
        {payoutSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h4 className="font-bold text-lg text-slate-900">Lệnh rút tiền đã được tạo thành công!</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Hệ thống tự động SePay sẽ chuyển khoản <strong>{formatCurrency(amount)}</strong> vào tài khoản {bankName} của bạn trong vòng 30 phút.
            </p>
            <Button onClick={() => setPayoutModalOpen(false)} className="w-full">
              Đóng
            </Button>
          </div>
        ) : (
          <form onSubmit={handleRequestPayout} className="space-y-4">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">Số dư khả dụng tối đa:</span>
              <span className="font-bold text-blue-700">{formatCurrency(finance?.availableBalance || 82500000)}</span>
            </div>

            <Input
              type="number"
              label="Số tiền muốn rút (VNĐ)"
              required
              min={100000}
              max={finance?.availableBalance || 82500000}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />

            <Input
              label="Ngân hàng thụ hưởng"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
            />

            <Input
              label="Số tài khoản ngân hàng"
              required
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />

            <Input
              label="Tên chủ tài khoản"
              required
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPayoutModalOpen(false)}
                className="flex-1"
              >
                Hủy
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                Xác nhận rút tiền
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
