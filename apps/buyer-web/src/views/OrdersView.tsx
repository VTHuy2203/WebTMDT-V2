import React, { useEffect, useState } from 'react';
import type { Order, DigitalOrderListItem, AppDeliveryContent } from '@marketplace/types';
import { orderApi, appOrderApi } from '@marketplace/api-client';
import { StatusBadge, Button, EmptyState, DigitalDeliveryBadge, Modal, FulfillmentTypeBadge } from '@marketplace/ui';
import { AppDeliveryContentRenderer } from '../components/app/AppDeliveryContentRenderer';
import { formatCurrency, formatDate } from '@marketplace/utils';
import {
  Package,
  Store,
  Truck,
  QrCode,
  RotateCcw,
  MessageSquare,
  Clock,
  ChevronRight,
  ShieldCheck,
  Gamepad2,
  Key,
  ExternalLink,
  Sparkles,
} from 'lucide-react';

export interface OrdersViewProps {
  onPayNow: (order: Order) => void;
  onRequestReturn: (order: Order) => void;
  onContinueShopping: () => void;
  onViewDigitalDetail?: (order: DigitalOrderListItem) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  onPayNow,
  onRequestReturn,
  onContinueShopping,
  onViewDigitalDetail,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [digitalOrdersList, setDigitalOrdersList] = useState<DigitalOrderListItem[]>([]);
  const [selectedType, setSelectedType] = useState<'ALL' | 'PHYSICAL' | 'GAME' | 'APP'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTimelineId, setExpandedTimelineId] = useState<string | null>(null);

  const [activeAppOrder, setActiveAppOrder] = useState<DigitalOrderListItem | null>(null);
  const [appDelivery, setAppDelivery] = useState<AppDeliveryContent | null>(null);
  const [loadingAppDelivery, setLoadingAppDelivery] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      setIsLoading(true);
      try {
        const [ordersData, digitalOrdersData] = await Promise.all([
          orderApi.getOrders(selectedStatus),
          orderApi.getDigitalOrders(),
        ]);
        setOrders(ordersData);
        setDigitalOrdersList(digitalOrdersData);
      } catch (err) {
        console.error('Failed to load orders:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, [selectedStatus]);

  const handleOpenAppOrder = async (ord: DigitalOrderListItem) => {
    setActiveAppOrder(ord);
    setLoadingAppDelivery(true);
    try {
      const content = await appOrderApi.getAppDeliveryContent(ord.id);
      setAppDelivery(content);
    } finally {
      setLoadingAppDelivery(false);
    }
  };

  const handleAppOrderConfirmReceived = async () => {
    if (!activeAppOrder) return;
    setDigitalOrdersList((prev) =>
      prev.map((o) =>
        o.id === activeAppOrder.id
          ? { ...o, orderStatus: 'COMPLETED', deliveryStatus: 'REVEALED', allowedActions: { ...o.allowedActions, confirmReceived: false } }
          : o
      )
    );
    setActiveAppOrder(null);
  };

  const handleConfirmPhysicalReceived = async (orderId: string) => {
    try {
      const updated = await orderApi.confirmReceived(orderId);
      setOrders((current) => current.map((order) => (order.id === orderId ? updated : order)));
    } catch (error) {
      console.error('Failed to confirm delivery:', error);
    }
  };

  const tabs = [
    { key: 'ALL', label: 'Tất cả trạng thái' },
    { key: 'PENDING_PAYMENT', label: 'Chờ thanh toán' },
    { key: 'SHIPPING', label: 'Đang giao / Chuẩn bị' },
    { key: 'COMPLETED', label: 'Hoàn thành' },
    { key: 'CANCELLED', label: 'Đã hủy' },
  ];

  const gameOrders = digitalOrdersList.filter((o) => o.productType === 'DIGITAL_GAME_ACCOUNT');
  const appOrders = digitalOrdersList.filter((o) => o.productType === 'DIGITAL_APP_ACCOUNT');

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Đơn Hàng Mua Sắm
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi hành trình đơn hàng, số serial bảo hành và thanh toán qua QR 24/7
          </p>
        </div>
      </div>

      {/* Filter by Product Type */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-200/80 w-fit">
          <button
            type="button"
            onClick={() => setSelectedType('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedType === 'ALL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả loại đơn
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('PHYSICAL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedType === 'PHYSICAL'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Hàng vật lý
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('GAME')}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedType === 'GAME'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-800 hover:bg-purple-100/50'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Tài khoản game ({gameOrders.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedType('APP')}
            className={`flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedType === 'APP'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-800 hover:bg-emerald-100/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tài khoản App & AI ({appOrders.length})</span>
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedStatus === tab.key
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* APP ACCOUNT ORDERS SECTION */}
      {(selectedType === 'ALL' || selectedType === 'APP') && appOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Đơn Hàng Tài Khoản Ứng Dụng & AI ({appOrders.length})</span>
          </div>

          <div className="space-y-3">
            {appOrders.map((dOrd) => (
              <div
                key={dOrd.id}
                className="bg-white rounded-3xl border border-emerald-200 overflow-hidden shadow-xs p-5 space-y-4 relative hover:border-emerald-300 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                      App Bản Quyền
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-mono text-slate-500">Mã đơn: #{dOrd.code}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{formatDate(dOrd.createdAt, true)}</span>
                    <DigitalDeliveryBadge status={dOrd.deliveryStatus} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={dOrd.productThumbnail}
                      alt=""
                      className="w-16 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 line-clamp-1">{dOrd.productName}</h4>
                      {dOrd.planName && (
                        <p className="text-xs font-semibold text-emerald-800">{dOrd.planName}</p>
                      )}
                      {dOrd.fulfillmentType && (
                        <FulfillmentTypeBadge type={dOrd.fulfillmentType} />
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-slate-500 text-xs mr-2">Tổng:</span>
                    <span className="text-base font-extrabold text-rose-600">
                      {formatCurrency(dOrd.total)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nâng cấp bảo mật chính chủ hoặc tài khoản cấp sẵn</span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenAppOrder(dOrd)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Xem chi tiết & Kích hoạt</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GAME ACCOUNT ORDERS SECTION */}
      {(selectedType === 'ALL' || selectedType === 'GAME') && gameOrders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
            <Gamepad2 className="w-4 h-4 text-purple-600" />
            <span>Đơn Hàng Tài Khoản Game ({gameOrders.length})</span>
          </div>

          <div className="space-y-3">
            {gameOrders.map((dOrd) => (
              <div
                key={dOrd.id}
                className="bg-white rounded-3xl border border-purple-200 overflow-hidden shadow-xs p-5 space-y-4 relative hover:border-purple-300 transition-colors"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 font-bold text-[11px]">
                      {dOrd.gameName}
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="font-mono text-slate-500">Mã đơn: #{dOrd.code}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{formatDate(dOrd.createdAt, true)}</span>
                    <DigitalDeliveryBadge status={dOrd.deliveryStatus} />
                  </div>
                </div>

                {/* Product row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                  <div className="flex items-start gap-3.5">
                    <img
                      src={dOrd.productThumbnail}
                      alt=""
                      className="w-16 h-12 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 line-clamp-1">{dOrd.productName}</h4>
                      <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                        <span>Số lượng: x{dOrd.quantity}</span>
                        <span>•</span>
                        <span className="text-purple-700 font-semibold">Giao trực tuyến</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-slate-500 text-xs mr-2">Tổng:</span>
                    <span className="text-base font-extrabold text-red-600">
                      {formatCurrency(dOrd.total)}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nội dung giao hàng có sẵn trong trang chi tiết</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {onViewDigitalDetail && (
                      <Button
                        size="sm"
                        onClick={() => onViewDigitalDetail(dOrd)}
                        className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs"
                      >
                        <Key className="w-3.5 h-3.5" />
                        <span>Xem chi tiết & Nhận tài khoản</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PHYSICAL ORDERS SECTION */}
      {(selectedType === 'ALL' || selectedType === 'PHYSICAL') && (
        <div className="space-y-3">
          {selectedType === 'ALL' && (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider pt-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span>Đơn Hàng Thiết Bị Vật Lý</span>
            </div>
          )}

          {/* Orders List */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div key={n} className="h-48 bg-slate-200/70 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 && selectedType === 'PHYSICAL' ? (
            <EmptyState
              title="Không có đơn hàng nào trong mục này"
              description="Bạn chưa đặt đơn hàng nào với trạng thái này."
              actionText="Khám phá thiết bị công nghệ"
              onAction={onContinueShopping}
            />
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-5"
            >
              {/* Order Header: Shop, Order Code, Status */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 text-xs">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-900">{order.shop.name}</span>
                  <span className="text-slate-300">|</span>
                  <span className="font-mono text-slate-500">Mã đơn: #{order.orderCode}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{formatDate(order.createdAt, true)}</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-slate-100">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3">
                      <img src={item.thumbnail} alt="" className="w-16 h-16 rounded-xl object-cover border" />
                      <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 line-clamp-1">{item.productName}</h4>
                        <p className="text-slate-500">{item.variantName} x{item.quantity}</p>
                        {item.serialNumber && (
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-mono font-semibold">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Serial / IMEI: {item.serialNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 text-sm">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Tracking & Timeline Toggle */}
              {order.trackingCode && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-700">
                      <Truck className="w-4 h-4 text-emerald-600" />
                      <span>Mã vận đơn: <strong className="font-mono text-slate-900">{order.trackingCode}</strong></span>
                      <span>({order.shippingMethod.carrier})</span>
                    </div>
                    <button
                      onClick={() => setExpandedTimelineId(expandedTimelineId === order.id ? null : order.id)}
                      className="text-blue-600 font-semibold flex items-center gap-0.5 hover:underline"
                    >
                      <span>{expandedTimelineId === order.id ? 'Thu gọn lịch trình' : 'Xem lịch trình'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Expanded Timeline (Section 25) */}
                  {expandedTimelineId === order.id && (
                    <div className="pt-2 pl-4 border-l-2 border-blue-500 space-y-3 my-2">
                      {order.timeline.map((evt, idx) => (
                        <div key={idx} className="relative text-xs">
                          <div className="font-bold text-slate-900">{evt.title}</div>
                          <div className="text-slate-500 text-[11px]">{evt.description}</div>
                          <div className="text-slate-400 text-[10px]">{formatDate(evt.timestamp, true)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Order Footer: Total & Allowed Actions (Section 29) */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                <div className="text-xs">
                  <span className="text-slate-500">Thành tiền: </span>
                  <span className="text-base font-extrabold text-red-600">{formatCurrency(order.total)}</span>
                  <span className="text-slate-400 text-[11px] ml-2">({order.paymentMethod === 'SEPAY_QR' ? 'Thanh toán QR 24/7' : 'COD'})</span>
                </div>

                {/* Allowed Actions as required by Section 29 */}
                <div className="flex items-center gap-2">
                  {order.allowedActions.includes('PAY') && (
                    <Button
                      size="sm"
                      onClick={() => onPayNow(order)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Thanh toán qua QR ngay</span>
                    </Button>
                  )}

                  {order.allowedActions.includes('REQUEST_RETURN') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRequestReturn(order)}
                      className="flex items-center gap-1.5 text-xs text-amber-700 border-amber-300 hover:bg-amber-50"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Yêu cầu trả hàng / Hoàn tiền</span>
                    </Button>
                  )}

                  {order.allowedActions.includes('CONFIRM_DELIVERED') && (
                    <Button
                      size="sm"
                      onClick={() => handleConfirmPhysicalReceived(order.id)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Đã nhận được hàng</span>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1.5 text-xs text-slate-600"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Nhắn tin với Shop</span>
                  </Button>
                </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      )}
      {/* Modal for Digital App Delivery */}
      {activeAppOrder && (
        <Modal
          isOpen={!!activeAppOrder}
          onClose={() => setActiveAppOrder(null)}
          title={`Chi tiết giao gói: ${activeAppOrder.productName}`}
        >
          {loadingAppDelivery ? (
            <div className="p-8 text-center text-xs text-slate-500">Đang tải thông tin giao hàng...</div>
          ) : appDelivery ? (
            <AppDeliveryContentRenderer
              content={appDelivery}
              canConfirm={activeAppOrder.orderStatus === 'DELIVERED'}
              canReport={true}
              onConfirmReceived={handleAppOrderConfirmReceived}
              onReportIssue={() => alert('Đã mở yêu cầu hỗ trợ tới người bán!')}
            />
          ) : (
            <div className="p-8 text-center text-xs text-slate-500">Không tìm thấy nội dung giao hàng.</div>
          )}
        </Modal>
      )}
    </div>
  );
};
