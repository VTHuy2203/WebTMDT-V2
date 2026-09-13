import React, { useEffect, useState } from 'react';
import type { DigitalOrderListItem } from '@marketplace/types';
import { orderApi } from '@marketplace/api-client';
import { DigitalDeliveryPanel } from '../components/game/DigitalDeliveryPanel';
import { StatusBadge, Button } from '@marketplace/ui';
import { formatCurrency, formatDate } from '@marketplace/utils';
import {
  ArrowLeft,
  Store,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Gamepad2,
  QrCode,
  MessageSquare,
} from 'lucide-react';

export interface DigitalOrderDetailViewProps {
  order: DigitalOrderListItem;
  onBack: () => void;
  onPayNow?: (order: any) => void;
}

export const DigitalOrderDetailView: React.FC<DigitalOrderDetailViewProps> = ({
  order: initialOrder,
  onBack,
  onPayNow,
}) => {
  const [order, setOrder] = useState<DigitalOrderListItem>(initialOrder);

  const timelineSteps = [
    { key: 'CREATED', label: 'Đã tạo đơn' },
    { key: 'PAID', label: 'Đã thanh toán' },
    { key: 'ALLOCATED', label: 'Đã cấp tài khoản' },
    { key: 'REVEALED', label: 'Đã xem thông tin' },
    { key: 'COMPLETED', label: 'Hoàn tất' },
  ];

  const getActiveStep = () => {
    if (order.orderStatus === 'PENDING_PAYMENT') return 0;
    if (order.orderStatus === 'PAID') return 1;
    if (order.deliveryStatus === 'READY') return 2;
    if (order.deliveryStatus === 'REVEALED' && order.orderStatus !== 'COMPLETED') return 3;
    if (order.orderStatus === 'COMPLETED') return 4;
    return 1;
  };

  const activeStep = getActiveStep();

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách đơn hàng</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-mono">Mã đơn: #{order.code}</span>
          <StatusBadge status={order.orderStatus} />
        </div>
      </div>

      {/* Timeline Stepper */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div className="grid grid-cols-5 gap-2">
          {timelineSteps.map((step, idx) => (
            <div key={step.key} className="flex flex-col items-center text-center relative">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1.5 transition-colors ${
                  idx <= activeStep
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-400'
                }`}
              >
                {idx < activeStep ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] font-semibold leading-tight ${
                  idx <= activeStep ? 'text-slate-900' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Product Summary Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 text-xs">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-900">Shop Bán Hàng</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">{formatDate(order.createdAt, true)}</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold text-[11px]">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Tài khoản game: {order.gameName}</span>
          </div>
        </div>

        <div className="flex items-start justify-between gap-4 text-xs">
          <div className="flex items-start gap-3.5">
            <img
              src={order.productThumbnail}
              alt=""
              className="w-20 h-14 rounded-xl object-cover border border-slate-100 shrink-0"
            />
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-900">{order.productName}</h3>
              <p className="text-slate-500">Số lượng: x{order.quantity} tài khoản</p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-xs text-slate-400 block">Tổng thanh toán</span>
            <span className="text-base font-extrabold text-red-600">
              {formatCurrency(order.total)}
            </span>
          </div>
        </div>

        {order.paymentStatus === 'PENDING' && onPayNow && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-amber-700 font-medium">
              Đơn hàng đang chờ thanh toán để bàn giao tài khoản.
            </span>
            <Button
              size="sm"
              onClick={() => onPayNow(order)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 text-xs font-bold"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Thanh toán qua QR ngay</span>
            </Button>
          </div>
        )}
      </div>

      {/* CORE DELIVERY PANEL: Credentials Reveal, Copy, Confirm, Report */}
      <DigitalDeliveryPanel
        order={order}
        onOrderUpdated={() => {
          setOrder((prev) => ({
            ...prev,
            deliveryStatus: 'REVEALED',
          }));
        }}
      />
    </div>
  );
};
