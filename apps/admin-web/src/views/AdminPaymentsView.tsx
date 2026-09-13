import React from 'react';
import { StatusBadge } from '@marketplace/ui';
import { formatCurrency } from '@marketplace/utils';
import { QrCode, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';

export const AdminPaymentsView: React.FC = () => {
  const transactions = [
    {
      id: 'tx_1',
      code: 'SEPAY100294',
      orderCode: 'VN20240911-100294',
      amount: 38540000,
      bank: 'MBBank (09876543210)',
      gateway: 'SePay VietQR Hook',
      status: 'PAID',
      time: '11/09/2026 08:32:15',
    },
    {
      id: 'tx_2',
      code: 'SEPAY100288',
      orderCode: 'VN20240911-100288',
      amount: 29490000,
      bank: 'MBBank (09876543210)',
      gateway: 'SePay VietQR Hook',
      status: 'PAID',
      time: '11/09/2026 07:14:02',
    },
    {
      id: 'tx_3',
      code: 'SEPAY100275',
      orderCode: 'VN20240910-100275',
      amount: 7490000,
      bank: 'MBBank (09876543210)',
      gateway: 'SePay VietQR Hook',
      status: 'PAID',
      time: '10/09/2026 21:50:30',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Giám Sát Đối Soát Thanh Toán SePay</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Nhật ký giao dịch chuyển khoản VietQR tự động qua Webhook SePay 24/7
          </p>
        </div>
      </div>

      {/* Mobile Card List (< md) */}
      <div className="md:hidden space-y-3">
        {transactions.map((tx) => (
          <div key={tx.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2.5 text-xs">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-blue-600 block">{tx.code}</span>
                <span className="font-mono text-slate-500 text-[11px]">Đơn #{tx.orderCode}</span>
              </div>
              <StatusBadge status={tx.status} />
            </div>

            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-500">Số tiền:</span>
              <span className="font-black text-slate-900 text-sm">{formatCurrency(tx.amount)}</span>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
              <span>{tx.bank} ({tx.gateway})</span>
              <span>{tx.time}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Table (>= md: iPad & Desktop) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-4 min-w-[160px]">Mã Giao Dịch SePay</th>
                <th className="p-4 min-w-[140px]">Đơn Hàng Khớp Lệnh</th>
                <th className="p-4 min-w-[140px]">Số Tiền (VNĐ)</th>
                <th className="p-4 min-w-[130px]">Tài Khoản Thụ Hưởng</th>
                <th className="p-4 min-w-[120px]">Cổng Đối Soát</th>
                <th className="p-4 min-w-[130px]">Thời Gian</th>
                <th className="p-4 min-w-[110px] text-right">Trạng Thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-4">
                    <span className="font-mono font-bold text-blue-600 block">{tx.code}</span>
                  </td>
                  <td className="p-4 font-mono font-semibold text-slate-800">#{tx.orderCode}</td>
                  <td className="p-4 font-bold text-slate-900 text-sm">{formatCurrency(tx.amount)}</td>
                  <td className="p-4 text-slate-600">{tx.bank}</td>
                  <td className="p-4 text-slate-500">{tx.gateway}</td>
                  <td className="p-4 text-slate-400">{tx.time}</td>
                  <td className="p-4 text-right">
                    <StatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
