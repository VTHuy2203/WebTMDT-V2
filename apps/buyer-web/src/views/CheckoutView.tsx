import React, { useEffect, useMemo, useState } from 'react';
import type { ShopGroupedCart, CheckoutPreviewResponse } from '@marketplace/types';
import { checkoutApi } from '@marketplace/api-client';
import { Button, Price } from '@marketplace/ui';
import { formatCurrency, useI18n } from '@marketplace/utils';
import {
  MapPin,
  Truck,
  QrCode,
  Banknote,
  ShieldCheck,
  CheckCircle2,
  Tag,
  ArrowRight,
} from 'lucide-react';

import { useAddressStore } from '../stores/useAddressStore';

export interface CheckoutViewProps {
  groupedCart: ShopGroupedCart[];
  onOrderCreated: (orderId: string, paymentId: string) => void;
  onBackToCart: () => void;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  groupedCart,
  onOrderCreated,
  onBackToCart,
}) => {
  const { locale, t } = useI18n();
  const { addresses, getDefaultAddress } = useAddressStore();
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const currentAddress = addresses.find((a) => a.id === selectedAddressId) || getDefaultAddress();

  const selectedItems = useMemo(
    () => groupedCart.flatMap((g) => g.items).filter((i) => i.selected),
    [groupedCart],
  );

  const isDigitalItem = (i: { productType?: string; productId?: string; productSlug?: string }) =>
    i.productType === 'DIGITAL_GAME_ACCOUNT' ||
    i.productType === 'DIGITAL_APP_ACCOUNT' ||
    Boolean(i.productId && i.productId.startsWith('ga_')) ||
    Boolean(i.productSlug && (i.productSlug.includes('acc-') || i.productSlug.includes('app-') || i.productSlug.includes('game-account')));

  const hasDigital = selectedItems.some(isDigitalItem);
  const hasPhysical = selectedItems.some((i) => !isDigitalItem(i));
  const isAllDigital = hasDigital && !hasPhysical;
  const isDigital = hasDigital;

  const [shippingMethod, setShippingMethod] = useState('ship_express');
  const [paymentMethod, setPaymentMethod] = useState<'SEPAY_QR' | 'COD'>('SEPAY_QR');
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [preview, setPreview] = useState<CheckoutPreviewResponse | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [digitalAgreed, setDigitalAgreed] = useState(true);

  // Call /checkout/preview as strictly requested by Section 23
  useEffect(() => {
    let active = true;
    async function loadPreview() {
      if (selectedItems.length === 0) return;
      setPreview(null);
      setPreviewError(null);
      try {
        const res = await checkoutApi.preview({
          selectedCartItemIds: selectedItems.map((i) => i.id),
          addressId: currentAddress?.id || 'addr_1',
          shippingAddress: currentAddress,
          voucherCodes: appliedVoucher ? [appliedVoucher] : [],
          shippingMethodId: isAllDigital ? 'ship_digital' : shippingMethod,
        });
        if (active) setPreview(res);
      } catch (err) {
        console.error('Error previewing checkout:', err);
        if (active) {
          const message = (err as any)?.response?.data?.message;
          setPreviewError(typeof message === 'string' ? message : 'Không thể tính tổng tiền/phí vận chuyển. Vui lòng kiểm tra địa chỉ và thử lại.');
        }
      }
    }
    void loadPreview();
    return () => { active = false; };
  }, [selectedItems, appliedVoucher, shippingMethod, isAllDigital, currentAddress?.id, currentAddress?.districtId, currentAddress?.wardCode, currentAddress?.province, currentAddress?.district, currentAddress?.ward]);

  const handleApplyVoucher = () => {
    if (voucherInput.trim()) {
      setAppliedVoucher(voucherInput.trim().toUpperCase());
    }
  };

  const handlePlaceOrder = async () => {
    if (hasDigital && !digitalAgreed) {
      alert('Vui lòng tích chọn đồng ý với điều khoản nhận tài khoản / sản phẩm số.');
      return;
    }
    if (hasPhysical && !currentAddress) {
      alert('Vui lòng chọn địa chỉ nhận hàng cho các sản phẩm vật lý.');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await checkoutApi.createOrder({
        selectedCartItemIds: selectedItems.map((i) => i.id),
        addressId: currentAddress?.id || 'addr_1',
        shippingAddress: currentAddress,
        shippingMethodId: isAllDigital ? 'ship_digital' : shippingMethod,
        paymentMethod: hasDigital ? 'SEPAY_QR' : paymentMethod,
        voucherCode: appliedVoucher || undefined,
      });
      onOrderCreated(res.orderId, res.paymentId);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          Xác Nhận & Thanh Toán Đơn Hàng
        </h1>
        <button
          onClick={onBackToCart}
          className="text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          ← Quay lại giỏ hàng
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Address, Shipping, Payment selection */}
        <div className="lg:col-span-8 space-y-6">
          {/* Delivery Address or Digital Delivery notice */}
          {isAllDigital ? (
            <div className="bg-white rounded-2xl border border-purple-200 bg-purple-50/20 p-5 space-y-2">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm border-b border-purple-100 pb-2.5">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Bàn Giao Kỹ Thuật Số (Trực Tuyến Qua Đơn Hàng & Email)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                Đơn hàng bao gồm tài khoản hoặc sản phẩm số. Thông tin bàn giao (tài khoản, mã kích hoạt bản quyền, license key) sẽ được cấp <strong>trực tiếp tại mục Đơn Hàng Của Tôi</strong> ngay sau khi thanh toán thành công. Không giao hàng qua bưu tá vật lý.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span>Địa Chỉ Nhận Hàng</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="text-xs text-blue-600 font-medium cursor-pointer hover:underline"
                >
                  Thay đổi
                </button>
              </div>
              <div className="text-xs space-y-1 text-slate-700">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <span>{currentAddress?.recipientName || 'Nguyễn Văn An'}</span>
                  <span>•</span>
                  <span>{currentAddress?.phoneNumber || '0901234567'}</span>
                  {currentAddress?.isDefault && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-medium">
                      Mặc định ({currentAddress?.label === 'OFFICE' ? 'Văn phòng' : currentAddress?.label === 'OTHER' ? 'Khác' : 'Nhà riêng'})
                    </span>
                  )}
                </div>
                <p>
                  {[
                    currentAddress?.streetAddress,
                    currentAddress?.ward,
                    currentAddress?.district,
                    currentAddress?.province,
                  ]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              </div>

              {/* Address selector modal */}
              {showAddressModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span>Chọn Địa Chỉ Nhận Hàng</span>
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAddressModal(false)}
                        className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          onClick={() => {
                            setSelectedAddressId(addr.id);
                            setShowAddressModal(false);
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                            (currentAddress?.id === addr.id)
                              ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-100'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm text-slate-900">{addr.recipientName}</span>
                            <div className="flex items-center gap-2">
                              {addr.isDefault && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                  Mặc định
                                </span>
                              )}
                              <span className="text-xs text-slate-500 font-mono">{addr.phoneNumber}</span>
                            </div>
                          </div>
                          <p className="text-xs text-slate-600">
                            {[addr.streetAddress, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowAddressModal(false)}
                      >
                        Đóng
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Shipping Method (Section 25) - Hidden for pure digital goods */}
          {!isAllDigital && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Phương Thức Vận Chuyển</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setShippingMethod('ship_express')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    shippingMethod === 'ship_express'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'ship_express'}
                    onChange={() => {}}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Giao Hỏa Tốc 2H</span>
                      <span className="text-xs font-bold text-blue-600">50.000 ₫</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Đơn vị: AhaMove Tech Express (Hàng đóng gói chống sốc chuyên dụng)</p>
                  </div>
                </label>

                <label
                  onClick={() => setShippingMethod('ship_standard')}
                  className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                    shippingMethod === 'ship_standard'
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shipping"
                    checked={shippingMethod === 'ship_standard'}
                    onChange={() => {}}
                    className="mt-1"
                  />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">Giao Tiêu Chuẩn (1-2 ngày)</span>
                      <span className="text-xs font-bold text-blue-600">30.000 ₫</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">Đơn vị: GHTK / Viettel Post</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Payment Method (Section 26, 27) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <QrCode className="w-4 h-4 text-purple-600" />
              <span>Phương Thức Thanh Toán</span>
            </div>

            <div className="space-y-3">
              <label
                onClick={() => setPaymentMethod('SEPAY_QR')}
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'SEPAY_QR'
                    ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'SEPAY_QR'}
                  onChange={() => {}}
                  className="mt-1 text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">Thanh Toán Qua Mã QR 24/7 (Tự Động Khớp Lệnh)</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        Khuyên dùng
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Mã QR tự động, quét qua ứng dụng ngân hàng bất kỳ 24/7. Đơn hàng kích hoạt ngay lập tức mà không cần chụp biên lai gửi shop.
                  </p>
                </div>
              </label>

              {!hasDigital && (
                <label
                  onClick={() => setPaymentMethod('COD')}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-100'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'COD'}
                    onChange={() => {}}
                    className="mt-1 text-blue-600"
                  />
                  <div className="flex-1">
                    <span className="font-bold text-xs text-slate-900">Thanh toán khi nhận hàng (COD)</span>
                    <p className="text-xs text-slate-500 mt-1">
                      Kiểm tra nguyên seal thiết bị và thanh toán tiền mặt cho shipper.
                    </p>
                  </div>
                </label>
              )}
            </div>

            {/* Digital goods policy agreement checkbox */}
            {hasDigital && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer pt-3">
                <input
                  type="checkbox"
                  checked={digitalAgreed}
                  onChange={(e) => setDigitalAgreed(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600"
                />
                <span className="text-[11px] text-slate-700 leading-snug">
                  Tôi đồng ý với <strong>chính sách bàn giao tài khoản & sản phẩm số</strong>: nhận thông tin bảo mật và kích hoạt qua hệ thống TechMarket, kiểm tra tài khoản và tuân thủ điều khoản dịch vụ trong thời hạn bảo hành cam kết.
                </span>
              </label>
            )}
          </div>

          {/* Ordered Items Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">
              Kiểm Tra Lại Thiết Bị Đặt Hàng ({selectedItems.length})
            </h3>
            <div className="divide-y divide-slate-100">
              {selectedItems.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <img src={item.thumbnail} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <h4 className="font-semibold text-slate-900 line-clamp-1">{item.productName}</h4>
                      <p className="text-slate-400 text-[11px]">{item.variantName} x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Voucher & Server-calculated Final Preview */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-6 space-y-5 lg:sticky lg:top-24">
          <h3 className="font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
            Chi Phí Đơn Hàng
          </h3>

          {/* Voucher input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherInput}
              onChange={(e) => setVoucherInput(e.target.value)}
              placeholder="Nhập mã TECH2026"
              className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-100"
            />
            <Button size="sm" onClick={handleApplyVoucher}>
              Áp dụng
            </Button>
          </div>

          {appliedVoucher && (
            <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                {locale === 'en' ? `Code ${appliedVoucher} applied` : `Mã ${appliedVoucher} đã áp dụng`}
              </span>
              <span>Đang áp dụng theo kết quả máy chủ</span>
            </div>
          )}

          {previewError && (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {previewError}
            </div>
          )}

          {/* Breakdown from Server Preview */}
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Tổng tiền hàng:</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(preview?.subtotal || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span className="font-semibold text-slate-900">
                {preview ? formatCurrency(preview.shippingFee) : 'Đang tính…'}
              </span>
            </div>
            {preview && preview.platformDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Ưu đãi sàn TMĐT:</span>
                <span>-{formatCurrency(preview.platformDiscount)}</span>
              </div>
            )}
            {preview && preview.totalVoucherDiscount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Mã giảm giá Voucher:</span>
                <span>-{formatCurrency(preview.totalVoucherDiscount)}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
            <span className="text-xs font-bold text-slate-800">Tổng thanh toán:</span>
            <span className="text-xl font-black text-red-600">
              {formatCurrency(preview?.finalTotal || 0)}
            </span>
          </div>

          <Button
            size="lg"
            onClick={handlePlaceOrder}
            isLoading={isSubmitting}
            disabled={!preview || Boolean(previewError)}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/25"
          >
            <span>{paymentMethod === 'SEPAY_QR' ? 'Tạo Mã QR Thanh Toán 24/7' : 'Xác Nhận Đặt Hàng COD'}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2 text-[11px] text-slate-400 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Cam kết hoàn tiền 100% nếu giao dịch lỗi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
