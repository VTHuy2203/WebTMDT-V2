import React, { useState } from 'react';
import {
  Cpu,
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones,
  QrCode,
  Store,
  X,
  CheckCircle2,
  FileText,
  CreditCard,
  ExternalLink,
} from 'lucide-react';
import { useI18n } from '@marketplace/utils';

export interface FooterProps {
  onNavigate?: (view: string, params?: any) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { locale, t } = useI18n();
  const [showPaymentGuideModal, setShowPaymentGuideModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);

  const handleCategoryClick = (query: string) => {
    if (onNavigate) {
      onNavigate('search', { query });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="bg-slate-900 text-slate-300 mt-20 border-t border-slate-800">
        {/* Feature highlights */}
        <div className="border-b border-slate-800 py-8 px-4">
          <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">
                  {locale === 'en' ? '100% Genuine Tech' : 'Chính Hãng 100%'}
                </h5>
                <p className="text-xs text-slate-400">
                  {locale === 'en' ? 'Serial/IMEI warranty verified' : 'Đầy đủ tem bảo hành và Serial/IMEI'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">
                  {locale === 'en' ? 'Express 2H Delivery' : 'Giao Hỏa Tốc 2H'}
                </h5>
                <p className="text-xs text-slate-400">
                  {locale === 'en' ? 'Shockproof packaging standard' : 'Đóng gói chuẩn công nghệ chống sốc'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">
                  {locale === 'en' ? 'Easy 30-Day Returns' : 'Đổi Trả Dễ Dàng'}
                </h5>
                <p className="text-xs text-slate-400">
                  {locale === 'en' ? '1-to-1 replacement for defects' : 'Lỗi 1 đổi 1 trong 30 ngày đầu'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Headphones className="w-6 h-6" />
              </div>
              <div>
                <h5 className="font-bold text-sm text-white">
                  {locale === 'en' ? '24/7 Tech Support' : 'Hỗ Trợ Kỹ Thuật'}
                </h5>
                <p className="text-xs text-slate-400">
                  {locale === 'en' ? 'Dedicated expert consulting' : 'Đội ngũ chuyên viên tư vấn 24/7'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="h-10 w-14 rounded-xl bg-slate-950 p-1 flex items-center justify-center border border-slate-800 shadow-sm overflow-hidden flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="TechMarket Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="text-lg font-bold text-white tracking-tight leading-none block">
                  TECH<span className="text-blue-500">MARKET</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400 block mt-0.5">
                  Digital Solutions
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              {locale === 'en'
                ? 'Leading professional e-commerce platform for tech devices, electronics, computer hardware and digital accounts. Integrated with automated 24/7 QR payment, fast & secure.'
                : 'Sàn thương mại điện tử chuyên nghiệp dành cho thiết bị công nghệ, điện tử, linh kiện máy tính hàng đầu Việt Nam. Tích hợp thanh toán trực tuyến qua QR 24/7 an toàn, nhanh chóng.'}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>© 2026 TechMarket Platform. All rights reserved.</span>
            </div>
          </div>

          {/* Danh mục công nghệ */}
          <div>
            <h5 className="font-bold text-sm text-white mb-4">
              {locale === 'en' ? 'Tech Categories' : 'Danh Mục Công Nghệ'}
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('Laptop Gaming')}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  Laptop Gaming RTX 40-Series
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('MacBook')}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  MacBook Pro & Air M3
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('iPhone')}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  Điện thoại iPhone 15 Series
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('Màn hình')}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  Màn hình Gaming 240Hz OLED
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => handleCategoryClick('Tai nghe')}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  Tai nghe Sony Hi-Res ANC
                </button>
              </li>
            </ul>
          </div>

          {/* Dành cho khách hàng */}
          <div>
            <h5 className="font-bold text-sm text-white mb-4">
              {locale === 'en' ? 'Customer Support' : 'Dành Cho Khách Hàng'}
            </h5>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('warranties');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {locale === 'en' ? 'Serial/IMEI Warranty Check' : 'Tra cứu thông tin bảo hành'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('returns');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {locale === 'en' ? 'Return & Refund Policy' : 'Chính sách đổi trả & hoàn tiền'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowPaymentGuideModal(true)}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {locale === 'en' ? '24/7 QR Payment Guide' : 'Hướng dẫn thanh toán qua QR 24/7'}
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setShowPolicyModal(true)}
                  className="hover:text-blue-400 transition-colors text-left cursor-pointer"
                >
                  {locale === 'en' ? 'Marketplace Regulations & Terms' : 'Quy chế hoạt động sàn TMĐT'}
                </button>
              </li>
              <li className="pt-1.5 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    onNavigate?.('seller-register');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>{locale === 'en' ? 'Become a Seller / Open Shop →' : 'Đăng ký mở gian hàng người bán →'}</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Phương thức thanh toán */}
          <div>
            <h5 className="font-bold text-sm text-white mb-4">
              {locale === 'en' ? 'Payment Methods' : 'Phương Thức Thanh Toán'}
            </h5>
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400">
                    {locale === 'en' ? '24/7 QR Payment' : 'Thanh toán qua QR 24/7'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  {locale === 'en'
                    ? 'Automated order activation without manual receipt review'
                    : 'Tự động kích hoạt đơn hàng không cần xác nhận thủ công'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                <div className="flex items-center gap-2 mb-1">
                  <Truck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white">
                    {locale === 'en' ? 'Cash on Delivery (COD)' : 'COD Tiền Mặt'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block leading-relaxed">
                  {locale === 'en'
                    ? 'Inspect goods upon delivery before payment'
                    : 'Kiểm tra hàng đồng kiểm khi nhận'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Hướng Dẫn Thanh Toán Qua QR 24/7 Modal */}
      {showPaymentGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Hướng Dẫn Thanh Toán Qua QR 24/7</h3>
                  <span className="text-[11px] text-slate-500">Khớp lệnh tự động tức thì</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentGuideModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-900">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <span className="font-bold block">Tạo đơn hàng & Chọn Thanh toán qua QR 24/7</span>
                  <p className="text-[11px] text-blue-700 mt-0.5">Hệ thống sẽ tạo ra mã QR thanh toán độc nhất dành riêng cho đơn của bạn.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <span className="font-bold text-slate-900 block">Quét mã bằng ứng dụng Ngân Hàng hoặc Ví Điện Tử</span>
                  <p className="text-[11px] text-slate-500 mt-0.5">Mở bất kỳ ứng dụng ngân hàng nào (Vietcombank, MB, Techcombank, VPBank...) và chọn Quét QR.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-emerald-900">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <span className="font-bold block">Khớp lệnh tự động trong 3 giây</span>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Hệ thống tự động xác nhận đơn hàng thành công và kích hoạt bảo hành mà không cần chụp biên lai hay xác nhận thủ công.</p>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentGuideModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quy Chế Hoạt Động Sàn TMĐT Modal */}
      {showPolicyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Quy Chế Hoạt Động Sàn Thương Mại Điện Tử</h3>
                  <span className="text-[11px] text-slate-500">TechMarket Platform Policy & Terms</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-900">1. Nguyên tắc đảm bảo chất lượng hàng hóa</h4>
                <p className="text-[11px]">
                  100% sản phẩm thiết bị công nghệ phải là hàng chính hãng, có số Serial/IMEI để tra cứu bảo hành. Mọi hành vi phân phối hàng giả, hàng dựng sẽ bị khóa gian hàng vĩnh viễn và xử lý theo pháp luật.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-900">2. Chính sách bảo vệ người mua</h4>
                <p className="text-[11px]">
                  Người mua được quyền đồng kiểm khi nhận hàng COD. Đối với tài khoản số và nick game, hệ thống áp dụng thời gian bảo vệ 72 giờ để người mua kiểm tra thông tin đăng nhập và hỗ trợ hoàn tiền 100% nếu có sai lệch.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <h4 className="font-bold text-slate-900">3. Trách nhiệm người bán</h4>
                <p className="text-[11px]">
                  Mọi gian hàng phải hoàn thành thủ tục định danh CCCD và tài khoản ngân hàng chính chủ. Nghiêm cấm hành vi dẫn dụ giao dịch ngoài sàn để lừa đảo hoặc trốn tránh trách nhiệm bảo hành.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowPolicyModal(false)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
