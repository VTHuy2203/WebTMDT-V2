import React, { useState } from 'react';
import { useAuthStore } from '@marketplace/auth';
import { useI18n } from '@marketplace/utils';
import { LanguageSwitcher } from '@marketplace/ui';
import { appConfig } from '@marketplace/config';
import {
  Search,
  ShoppingCart,
  Scale,
  User,
  ShieldCheck,
  Package,
  RotateCcw,
  Store,
  LogOut,
  ChevronDown,
  Cpu,
  Menu,
  Bell,
  Gamepad2,
  Sparkles,
  MapPin,
  MessageCircle,
  LayoutDashboard,
  ExternalLink,
  PackagePlus,
} from 'lucide-react';
import { useChatStore } from '../stores/useChatStore';

export interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  cartCount: number;
  compareCount: number;
  onSearch: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  cartCount,
  compareCount,
  onSearch,
}) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { locale, t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      {/* Top micro bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              {t('nav.officialCommitment', '100% Đồ công nghệ chính hãng - Bảo hành Serial/IMEI')}
            </span>
            <span>•</span>
            <span>{locale === 'en' ? 'Automated 24/7 QR Payment' : 'Thanh toán tự động qua QR 24/7'}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            {/* Đăng ký mở gian hàng hoặc Truy cập gian hàng nếu đã là chủ shop */}
            {user?.shopId || user?.role?.includes('SELLER') ? (
              <div className="flex items-center gap-2.5">
                <a
                  href={appConfig.sellerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 hover:text-white flex items-center gap-1.5 transition-all text-xs font-bold cursor-pointer shadow-xs"
                  title="Mở Kênh Quản Trị Gian Hàng (Thêm/Sửa sản phẩm, Kho, Đơn hàng)"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kênh Người Bán (Quản lý)</span>
                  <ExternalLink className="w-3 h-3 text-amber-300" />
                </a>

                <button
                  type="button"
                  onClick={() => onNavigate('shop', { shopId: user?.shopId || 'shop_gearvn' })}
                  className="hover:text-amber-300 flex items-center gap-1 text-slate-300 transition-colors text-xs font-medium cursor-pointer"
                  title="Xem giao diện gian hàng như khách mua"
                >
                  <Store className="w-3 h-3 text-slate-400" />
                  <span>Xem Shop</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('seller-register')}
                className="hover:text-amber-300 flex items-center gap-1.5 text-amber-400 transition-colors font-medium cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" />
                <span>{locale === 'en' ? 'Register Store / Become Seller' : 'Đăng ký mở gian hàng'}</span>
              </button>
            )}

            <span className="text-slate-600">|</span>

            {/* Tài khoản: Đăng ký / Đăng nhập hoặc hiển thị user */}
            {!isAuthenticated ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('auth', { mode: 'register' })}
                  className="hover:text-white transition-colors cursor-pointer text-slate-300"
                >
                  {locale === 'en' ? 'Register' : 'Đăng ký tài khoản'}
                </button>
                <span className="text-slate-600">/</span>
                <button
                  type="button"
                  onClick={() => onNavigate('auth', { mode: 'login' })}
                  className="hover:text-white text-blue-400 font-medium transition-colors cursor-pointer"
                >
                  {locale === 'en' ? 'Login' : 'Đăng nhập'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-slate-400">
                  {locale === 'en' ? 'Hi,' : 'Xin chào,'} <strong className="text-white font-medium">{user?.fullName || user?.email}</strong>
                </span>
              </div>
            )}

            {/* Language & Currency Switcher in Topbar */}
            <LanguageSwitcher variant="pill" showRateBadge={true} />
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 lg:gap-8">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 cursor-pointer select-none group flex-shrink-0"
        >
          <div className="h-10 w-14 rounded-xl bg-slate-950 p-1 flex items-center justify-center shadow-md border border-slate-800 group-hover:scale-105 transition-transform flex-shrink-0 overflow-hidden">
            <img
              src="/logo.png"
              alt="TechMarket Logo"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
              TECH<span className="text-blue-600">MARKET</span>
            </span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-blue-600 -mt-0.5">
              Digital Solutions
            </span>
          </div>
        </div>

        {/* Search Bar: Full width on mobile (< md), centered on desktop */}
        <form onSubmit={handleSearchSubmit} className="order-3 md:order-2 w-full md:flex-1 max-w-2xl relative">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                locale === 'en'
                  ? 'Search laptop, CPU i7/Ryzen, RAM 16GB, RTX 4060, Game accounts, ChatGPT Plus...'
                  : 'Tìm theo tên máy, CPU i7/Ryzen, RAM 16GB, RTX 4060, nick game...'
              }
              className="w-full pl-11 pr-24 py-2.5 bg-slate-100/90 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 rounded-2xl border border-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all outline-none"
            />
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              {t('nav.searchButton', 'Tìm kiếm')}
            </button>
          </div>
        </form>

        {/* Header Actions (order-2 on mobile so it stays on top row next to logo) */}
        <div className="flex items-center gap-1.5 sm:gap-3 order-2 md:order-3">
          {/* Mobile Language Switcher (Visible on <md) */}
          <div className="md:hidden">
            <LanguageSwitcher variant="compact" />
          </div>

          {/* Compare Counter */}
          <button
            onClick={() => onNavigate('compare')}
            className="relative p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            title="So sánh sản phẩm"
          >
            <Scale className="w-5 h-5" />
            {compareCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {compareCount}
              </span>
            )}
          </button>

          {/* Cart Counter */}
          <button
            onClick={() => onNavigate('cart')}
            className="relative p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
            title="Giỏ hàng"
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* Direct Shop Messages Center */}
          <button
            type="button"
            onClick={() => useChatStore.getState().toggleChat()}
            className="relative p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Tin nhắn với gian hàng"
          >
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white">
              1
            </span>
          </button>

          {/* Notifications Center (Section 37) */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors"
              title="Thông báo"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 rounded-full ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 px-4 z-50 animate-in fade-in zoom-in-95 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="font-bold text-xs text-slate-900">Thông báo mới</span>
                  <span className="text-[10px] text-blue-600 font-semibold cursor-pointer">Đã đọc tất cả</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100 space-y-0.5">
                    <span className="font-bold text-blue-900 block">Thanh toán qua QR thành công!</span>
                    <p className="text-slate-600 text-[11px]">Đơn hàng #VN20240911-100294 đã được xác nhận thanh toán.</p>
                    <span className="text-slate-400 text-[10px]">10 phút trước</span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="font-bold text-slate-900 block">Kích hoạt bảo hành điện tử</span>
                    <p className="text-slate-600 text-[11px]">Thiết bị ASUS ROG Strix G16 đã được kích hoạt bảo hành 24 tháng.</p>
                    <span className="text-slate-400 text-[10px]">1 giờ trước</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Account */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 transition-colors text-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700">
                <User className="w-4 h-4" />
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-xs font-semibold leading-tight truncate max-w-[100px]">
                  {isAuthenticated ? user?.fullName : 'Đăng nhập'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">Tài khoản</p>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95">
                {isAuthenticated ? (
                  <>
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                      <p className="text-xs font-bold text-slate-900">{user?.fullName}</p>
                      <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-md">
                        {user?.role}
                      </span>
                    </div>

                    {/* Section: Tài khoản & Địa chỉ */}
                    <div className="py-1 border-b border-slate-100">
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Tài khoản & Địa chỉ
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('profile', { tab: 'profile' });
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <User className="w-4 h-4 text-blue-600" />
                        <span>Hồ sơ cá nhân & SĐT</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('profile', { tab: 'addresses' });
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-emerald-600" />
                        <span>Sổ địa chỉ nhận hàng</span>
                      </button>

                      {(user?.shopId || user?.role?.includes('SELLER')) && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigate('profile', { tab: 'shop' });
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-amber-600" />
                          <span>Hồ sơ gian hàng (Đổi Avatar)</span>
                        </button>
                      )}
                    </div>

                    {/* Section: Đơn hàng */}
                    <div className="py-1">
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Đơn hàng & Sản phẩm
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('orders');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-blue-600" />
                          <span>Quản lý đơn hàng (Đơn mua)</span>
                        </div>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">Tất cả</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('orders', { filter: 'GAME' });
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-purple-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Gamepad2 className="w-4 h-4 text-purple-600" />
                        <span>Tài khoản Game đã mua</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('orders', { filter: 'APP' });
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-emerald-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span>Tài khoản Ứng dụng & AI đã mua</span>
                      </button>
                    </div>

                    {/* Section: Bảo hành & Đổi trả */}
                    <div className="py-1 border-t border-slate-100">
                      <div className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Hậu mãi & Bảo hành
                      </div>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('warranties');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Tra cứu & Bảo hành Serial/IMEI</span>
                      </button>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('returns');
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                        <span>Yêu cầu đổi / trả sản phẩm</span>
                      </button>

                      {user?.shopId || user?.role?.includes('SELLER') ? (
                        <>
                          <a
                            href={appConfig.sellerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setShowUserMenu(false)}
                            className="w-full text-left px-4 py-2.5 text-xs font-bold text-amber-900 bg-amber-50/80 hover:bg-amber-100 flex items-center justify-between border-y border-amber-200/60 cursor-pointer transition-colors"
                          >
                            <span className="flex items-center gap-2">
                              <LayoutDashboard className="w-4 h-4 text-amber-600" />
                              <span>Kênh Người Bán (Quản lý & Thêm SP)</span>
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                          </a>

                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onNavigate('shop', { shopId: user?.shopId || 'shop_gearvn' });
                            }}
                            className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer"
                          >
                            <Store className="w-4 h-4 text-slate-500" />
                            <span>Xem trang Shop công khai (Khách xem)</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onNavigate('seller-register');
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 cursor-pointer"
                        >
                          <Store className="w-4 h-4 text-amber-600" />
                          <span>Đăng ký mở gian hàng</span>
                        </button>
                      )}
                    </div>

                    <div className="border-t border-slate-100 my-1" />
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </>
                ) : (
                  <div className="p-3 space-y-3">
                    <p className="text-xs text-slate-600">Đăng nhập để quản lý đơn hàng và bảo hành thiết bị</p>
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        onNavigate('auth');
                      }}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl text-center shadow-sm cursor-pointer transition-colors"
                    >
                      Đăng nhập / Đăng ký
                    </button>

                    <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('seller-register');
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-amber-50 rounded-lg flex items-center gap-2 text-amber-700 font-medium cursor-pointer"
                      >
                        <Store className="w-3.5 h-3.5 text-amber-600" />
                        <span>Đăng ký mở gian hàng</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('orders');
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700"
                      >
                        <Package className="w-3.5 h-3.5 text-blue-600" />
                        <span>Theo dõi đơn hàng</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('warranties');
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tra cứu Serial/IMEI</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          onNavigate('returns');
                        }}
                        className="w-full text-left px-2 py-1.5 hover:bg-slate-50 rounded-lg flex items-center gap-2 text-slate-700"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                        <span>Đổi trả sản phẩm</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Bar: Clean, uncluttered, focused on 3 main marketplace pillars */}
      <nav className="bg-slate-50 border-t border-slate-200/60 px-4 py-2 overflow-x-auto text-xs font-semibold text-slate-600">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-6 whitespace-nowrap">
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => onNavigate('home')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'home'
                  ? 'bg-slate-900 text-white font-bold shadow-xs'
                  : 'hover:text-blue-600 text-slate-700'
              }`}
            >
              {t('nav.home', 'Trang Chủ')}
            </button>

            <button
              onClick={() => onNavigate('tech-products')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'tech-products'
                  ? 'bg-blue-600 text-white font-bold shadow-xs'
                  : 'text-slate-700 hover:text-blue-600 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4 text-blue-500" />
              <span>{locale === 'en' ? 'Tech Products' : 'Sản Phẩm Công Nghệ'}</span>
            </button>

            <button
              onClick={() => onNavigate('game-accounts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'game-accounts'
                  ? 'bg-purple-600 text-white font-bold shadow-xs'
                  : 'text-purple-700 bg-purple-50 hover:bg-purple-100 font-bold border border-purple-200'
              }`}
            >
              <Gamepad2 className="w-4 h-4 text-purple-600" />
              <span>{t('nav.games', 'Kho Nick Game')}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-red-500 text-white font-black animate-pulse">
                HOT
              </span>
            </button>

            <button
              onClick={() => onNavigate('app-accounts')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'app-accounts'
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold border border-emerald-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>{t('nav.apps', 'Tài Khoản App / AI')}</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-600 text-white font-black">
                {locale === 'en' ? 'NEW' : 'MỚI'}
              </span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {locale === 'en' ? '100% Genuine • 1-to-1 Replacement' : '100% Chính Hãng • Bảo Hành 1 Đổi 1'}
            </span>
          </div>
        </div>
      </nav>
    </header>
  );
};
