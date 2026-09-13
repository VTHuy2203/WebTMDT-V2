import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@marketplace/auth';
import { useAddressStore } from '../stores/useAddressStore';
import type { ShippingAddress } from '@marketplace/types';
import { Button } from '@marketplace/ui';
import { appConfig } from '@marketplace/config';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Store,
  ShieldCheck,
  Lock,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Camera,
  Building,
  CreditCard,
  FileText,
  Save,
  ExternalLink,
  PackagePlus,
  Boxes,
  ShoppingBag,
  DollarSign,
  Gamepad2,
  Sparkles,
  LayoutDashboard,
} from 'lucide-react';

export interface UserProfileViewProps {
  initialTab?: 'profile' | 'addresses' | 'shop';
  onNavigate?: (view: string, params?: any) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  initialTab = 'profile',
  onNavigate,
}) => {
  const { user, updateUser } = useAuthStore();
  const { addresses, addAddress, updateAddress, deleteAddress, setDefault } = useAddressStore();

  const isSeller = Boolean(user?.shopId || (user?.role && user.role.includes('SELLER')));

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'shop'>(
    isSeller && initialTab === 'shop' ? 'shop' : initialTab === 'shop' ? 'profile' : initialTab
  );

  useEffect(() => {
    if (!isSeller && activeTab === 'shop') {
      setActiveTab('profile');
    }
  }, [isSeller, activeTab]);

  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || 'Nguyễn Văn An');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '0901234567');
  const [userAvatar, setUserAvatar] = useState(
    user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
  );
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrRecipient, setAddrRecipient] = useState('');
  const [addrPhone, setAddrPhone] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrDistrict, setAddrDistrict] = useState('');
  const [addrWard, setAddrWard] = useState('');
  const [addrStreet, setAddrStreet] = useState('');
  const [addrLabel, setAddrLabel] = useState<'HOME' | 'OFFICE' | 'OTHER'>('HOME');
  const [addrIsDefault, setAddrIsDefault] = useState(false);

  // Shop Profile State
  // STRICT RULE: Shop can ONLY change avatar/logo, NO other fields!
  const [shopAvatar, setShopAvatar] = useState(
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200'
  );
  const [shopSuccessMsg, setShopSuccessMsg] = useState('');

  // Static/locked mock info for Shop
  const shopData = {
    name: 'GEARVN Official Store',
    businessType: 'Doanh nghiệp thương mại điện tử công nghệ',
    ownerName: user?.fullName || 'Nguyễn Văn An',
    cccd: '03809200****',
    bankAccount: '19034567890123 (Techcombank)',
    taxCode: '0315892104',
    warehouseAddress: 'Tòa nhà TechTower, Số 12 Lê Duẩn, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    kycStatus: 'ĐÃ XÁC THỰC KYC CHÍNH THỨC',
  };

  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert('Số điện thoại không được để trống.');
      return;
    }

    updateUser({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      avatarUrl: userAvatar,
    });

    setProfileSuccessMsg('✓ Đã cập nhật số điện thoại và thông tin cá nhân thành công!');
    setTimeout(() => setProfileSuccessMsg(''), 4000);
  };

  const handleOpenNewAddress = () => {
    setEditingAddressId(null);
    setAddrRecipient(fullName || '');
    setAddrPhone(phoneNumber || '');
    setAddrProvince('TP. Hồ Chí Minh');
    setAddrDistrict('Quận 1');
    setAddrWard('');
    setAddrStreet('');
    setAddrLabel('HOME');
    setAddrIsDefault(addresses.length === 0);
    setIsAddressModalOpen(true);
  };

  const handleOpenEditAddress = (addr: ShippingAddress) => {
    setEditingAddressId(addr.id);
    setAddrRecipient(addr.recipientName);
    setAddrPhone(addr.phoneNumber);
    setAddrProvince(addr.province);
    setAddrDistrict(addr.district);
    setAddrWard(addr.ward);
    setAddrStreet(addr.streetAddress);
    setAddrLabel(addr.label);
    setAddrIsDefault(addr.isDefault);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrRecipient.trim() || !addrPhone.trim() || !addrStreet.trim()) {
      alert('Vui lòng điền đầy đủ Tên người nhận, Số điện thoại và Địa chỉ chi tiết.');
      return;
    }

    if (editingAddressId) {
      updateAddress(editingAddressId, {
        recipientName: addrRecipient.trim(),
        phoneNumber: addrPhone.trim(),
        province: addrProvince.trim(),
        district: addrDistrict.trim(),
        ward: addrWard.trim(),
        streetAddress: addrStreet.trim(),
        label: addrLabel,
        isDefault: addrIsDefault,
      });
    } else {
      addAddress({
        recipientName: addrRecipient.trim(),
        phoneNumber: addrPhone.trim(),
        province: addrProvince.trim(),
        district: addrDistrict.trim(),
        ward: addrWard.trim(),
        streetAddress: addrStreet.trim(),
        label: addrLabel,
        isDefault: addrIsDefault,
      });
    }

    setIsAddressModalOpen(false);
  };

  const handleSaveShopAvatar = (e: React.FormEvent) => {
    e.preventDefault();
    setShopSuccessMsg('✓ Ảnh đại diện gian hàng đã được cập nhật thành công!');
    setTimeout(() => setShopSuccessMsg(''), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 pt-2">
      {/* Page Title & User Quick Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
          <div className="relative">
            <img
              src={userAvatar}
              alt={fullName}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-400 shadow-md"
            />
            <span className="absolute -bottom-1 -right-1 bg-blue-600 p-1 rounded-full text-white shadow">
              <ShieldCheck className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-black">{fullName}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/30 text-blue-300 border border-blue-400/30">
                {user?.role || 'BUYER'}
              </span>
            </div>
            <p className="text-xs text-slate-300 flex items-center justify-center sm:justify-start gap-1.5 font-mono">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user?.email || 'nguyenvanan@gmail.com'}</span>
            </p>
            <p className="text-xs text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              <span>{phoneNumber || 'Chưa cập nhật SĐT'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          {isSeller && (
            <a
              href={appConfig.sellerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
              title="Mở Kênh Quản Trị Gian Hàng để đăng bán và quản lý sản phẩm"
            >
              <PackagePlus className="w-4 h-4 text-slate-950" />
              <span>Kênh Người Bán (Thêm SP)</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-800" />
            </a>
          )}
          {onNavigate && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onNavigate('orders')}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white text-xs cursor-pointer"
            >
              Xem đơn hàng
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-6 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Hồ Sơ Cá Nhân</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('addresses')}
          className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'addresses'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Sổ Địa Chỉ Nhận Hàng ({addresses.length})</span>
        </button>

        {isSeller && (
          <button
            type="button"
            onClick={() => setActiveTab('shop')}
            className={`flex items-center gap-2 py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'shop'
                ? 'border-amber-600 text-amber-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Hồ Sơ Gian Hàng</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
              Bảo Mật KYC
            </span>
          </button>
        )}
      </div>

      {/* TAB 1: USER PROFILE */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Thông Tin Tài Khoản</h2>
            <p className="text-xs text-slate-500 mt-1">
              Bạn có thể cập nhật Họ tên và Số điện thoại. Email đăng ký được khóa bảo mật cố định.
            </p>
          </div>

          {profileSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveUserProfile} className="space-y-6 max-w-2xl">
            {/* Avatar Selection */}
            <div className="flex items-center gap-4">
              <img
                src={userAvatar}
                alt="Avatar"
                className="w-16 h-16 rounded-2xl object-cover border border-slate-200 shadow-xs"
              />
              <div className="space-y-1 flex-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Đường dẫn ảnh đại diện (Avatar URL)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userAvatar}
                    onChange={(e) => setUserAvatar(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setUserAvatar('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200')
                    }
                    className="text-xs px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium cursor-pointer"
                  >
                    Mẫu 2
                  </button>
                </div>
              </div>
            </div>

            {/* Email Field - STRICTLY READ ONLY / LOCKED */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>Địa Chỉ Email Đăng Ký</span>
                </label>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Không thể thay đổi</span>
                </span>
              </div>
              <input
                type="email"
                value={user?.email || 'nguyenvanan@gmail.com'}
                disabled
                readOnly
                className="w-full text-xs px-3.5 py-2.5 bg-slate-100/90 text-slate-500 border border-slate-200 rounded-xl cursor-not-allowed font-mono"
              />
              <p className="text-[11px] text-slate-400">
                🔒 Theo quy chế an toàn tài khoản và bảo vệ số dư / tài khoản kỹ thuật số, địa chỉ Email đăng ký không được phép thay đổi.
              </p>
            </div>

            {/* Full Name Field - EDITABLE */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Họ và Tên</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-medium text-slate-900"
              />
            </div>

            {/* Phone Number Field - EDITABLE */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Số Điện Thoại Nhận Hàng & Thông Báo</span>
                </label>
                <span className="text-[11px] text-blue-600 font-medium">Có thể thay đổi</span>
              </div>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="VD: 0901234567"
                required
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 font-mono text-slate-900"
              />
              <p className="text-[11px] text-slate-500">
                Số điện thoại này sẽ được dùng để gọi xác nhận giao hàng và gửi SMS mã xác thực tài khoản game.
              </p>
            </div>

            <div className="pt-2">
              <Button type="submit" size="md" className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer">
                <Save className="w-4 h-4 mr-1.5" />
                <span>Lưu Thay Đổi Thông Tin</span>
              </Button>
            </div>
          </form>

          {/* Seller Registration Promotion Card for Non-Sellers */}
          {!isSeller && (
            <div className="pt-6 border-t border-slate-100">
              <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Store className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">Bạn muốn mở gian hàng kinh doanh trên TechMarket?</h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Đăng ký trở thành người bán để bắt đầu kinh doanh sản phẩm công nghệ, nick game và tài khoản ứng dụng.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate && onNavigate('seller-register')}
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors shrink-0 cursor-pointer shadow-xs"
                >
                  Đăng ký mở gian hàng
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SHIPPING ADDRESSES */}
      {activeTab === 'addresses' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Sổ Địa Chỉ Giao Hàng</h2>
              <p className="text-xs text-slate-500 mt-1">
                Lưu các địa chỉ cần thiết (Họ tên, SĐT, Địa chỉ). Địa chỉ được chọn mặc định sẽ tự động áp dụng khi bạn thanh toán đơn hàng.
              </p>
            </div>

            <Button
              onClick={handleOpenNewAddress}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm Địa Chỉ Mới</span>
            </Button>
          </div>

          {/* Addresses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between space-y-4 ${
                  addr.isDefault
                    ? 'border-blue-500 bg-blue-50/20 ring-2 ring-blue-100 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{addr.recipientName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                        {addr.label === 'OFFICE' ? 'Văn phòng' : addr.label === 'OTHER' ? 'Khác' : 'Nhà riêng'}
                      </span>
                    </div>

                    {addr.isDefault && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Mặc định giao hàng</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-mono text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{addr.phoneNumber}</span>
                  </p>

                  <p className="text-xs text-slate-700 leading-relaxed flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                    <span>
                      {[addr.streetAddress, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')}
                    </span>
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditAddress(addr)}
                      className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Sửa</span>
                    </button>
                    {addresses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => deleteAddress(addr.id)}
                        className="text-rose-600 hover:text-rose-700 font-medium flex items-center gap-1 cursor-pointer ml-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Xóa</span>
                      </button>
                    )}
                  </div>

                  {!addr.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefault(addr.id)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium text-[11px] cursor-pointer transition-colors"
                    >
                      Đặt làm mặc định
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Modal */}
          {isAddressModalOpen && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-base text-slate-900">
                    {editingAddressId ? 'Cập Nhật Địa Chỉ Nhận Hàng' : 'Thêm Địa Chỉ Nhận Hàng Mới'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="text-slate-400 hover:text-slate-600 text-lg font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveAddress} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Họ và tên người nhận</label>
                      <input
                        type="text"
                        value={addrRecipient}
                        onChange={(e) => setAddrRecipient(e.target.value)}
                        placeholder="VD: Nguyễn Văn An"
                        required
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Số điện thoại</label>
                      <input
                        type="tel"
                        value={addrPhone}
                        onChange={(e) => setAddrPhone(e.target.value)}
                        placeholder="VD: 0901234567"
                        required
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Tỉnh / Thành phố</label>
                      <input
                        type="text"
                        value={addrProvince}
                        onChange={(e) => setAddrProvince(e.target.value)}
                        placeholder="VD: TP. Hồ Chí Minh"
                        required
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700">Quận / Huyện</label>
                      <input
                        type="text"
                        value={addrDistrict}
                        onChange={(e) => setAddrDistrict(e.target.value)}
                        placeholder="VD: Quận 1"
                        required
                        className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Phường / Xã</label>
                    <input
                      type="text"
                      value={addrWard}
                      onChange={(e) => setAddrWard(e.target.value)}
                      placeholder="VD: Phường Bến Nghé"
                      required
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Địa chỉ cụ thể (Số nhà, tên đường)</label>
                    <input
                      type="text"
                      value={addrStreet}
                      onChange={(e) => setAddrStreet(e.target.value)}
                      placeholder="VD: Số 12 Lê Duẩn, Tầng 5"
                      required
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>

                  {/* Label */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Loại địa chỉ</label>
                    <div className="flex gap-2">
                      {(['HOME', 'OFFICE', 'OTHER'] as const).map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setAddrLabel(lbl)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                            addrLabel === lbl
                              ? 'bg-blue-600 text-white border-blue-600 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {lbl === 'HOME' ? 'Nhà riêng' : lbl === 'OFFICE' ? 'Văn phòng' : 'Khác'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Default Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-800">
                      <input
                        type="checkbox"
                        checked={addrIsDefault}
                        onChange={(e) => setAddrIsDefault(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span>Đặt làm địa chỉ giao hàng mặc định cho đơn hàng</span>
                    </label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddressModalOpen(false)}
                    >
                      Hủy bỏ
                    </Button>
                    <Button type="submit" size="sm" className="bg-blue-600 text-white font-bold cursor-pointer">
                      Lưu địa chỉ
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SHOP PROFILE - ONLY FOR APPROVED SELLERS */}
      {activeTab === 'shop' && (
        !isSeller ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-xs max-w-2xl mx-auto my-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Store className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Tài Khoản Chưa Đăng Ký Mở Gian Hàng
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Tài khoản của bạn hiện tại là <strong>Người mua hàng (BUYER)</strong>. Bạn chưa đăng ký hồ sơ gian hàng người bán trên sàn TechMarket.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={() => onNavigate && onNavigate('seller-register')}
                className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer"
              >
                Đăng Ký Mở Gian Hàng Ngay
              </Button>
              <Button
                variant="outline"
                onClick={() => setActiveTab('profile')}
                className="w-full sm:w-auto cursor-pointer"
              >
                Về Hồ Sơ Cá Nhân
              </Button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Hồ Sơ Gian Hàng & Kênh Quản Trị</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Quản lý định danh pháp lý và chuyển nhanh sang Kênh Người Bán để đăng bán sản phẩm.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <a
                href={appConfig.sellerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition-all hover:scale-105 cursor-pointer"
              >
                <LayoutDashboard className="w-4 h-4 text-amber-300" />
                <span>Mở Kênh Người Bán (Seller Center)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('shop', { shopId: user?.shopId || 'shop_gearvn' })}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
                  title="Xem giao diện gian hàng hiển thị cho người mua"
                >
                  Xem Trang Shop
                </button>
              )}
            </div>
          </div>

          {/* HIGHLIGHT: SELLER PORTAL QUICK ACTIONS BANNER */}
          <div className="rounded-2xl p-5 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-lg space-y-4 border border-blue-800/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-400 text-slate-950 tracking-wider">
                    SELLER CENTER
                  </span>
                  <h3 className="text-sm font-black text-white">
                    Khu Vực Đăng Bán & Quản Trị Sản Phẩm Của Gian Hàng
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  Chọn loại sản phẩm bạn muốn đăng bán ngay hoặc quản lý kho hàng và đơn đặt hàng:
                </p>
              </div>

              <a
                href={`${appConfig.sellerUrl}/?tab=listing-hub`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs shrink-0 cursor-pointer shadow-md transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Đăng Sản Phẩm Mới</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <a
                href={`${appConfig.sellerUrl}/?tab=product-new`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-blue-500/20 text-blue-300">
                    <PackagePlus className="w-4 h-4" />
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-300 transition-colors" />
                </div>
                <strong className="text-xs text-white font-bold block group-hover:text-amber-300 transition-colors">
                  + Đăng Đồ Công Nghệ
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Laptop, PC, Linh kiện, Phụ kiện</span>
              </a>

              <a
                href={`${appConfig.sellerUrl}/?tab=game-account-new`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-300">
                    <Gamepad2 className="w-4 h-4" />
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-300 transition-colors" />
                </div>
                <strong className="text-xs text-white font-bold block group-hover:text-amber-300 transition-colors">
                  + Đăng Tài Khoản Game
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Nick LMHT, Valorant, Genshin...</span>
              </a>

              <a
                href={`${appConfig.sellerUrl}/?tab=app-account-new`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-300 transition-colors" />
                </div>
                <strong className="text-xs text-white font-bold block group-hover:text-amber-300 transition-colors">
                  + Đăng Tài Khoản App / AI
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">ChatGPT, Claude, Netflix, Spotify</span>
              </a>

              <a
                href={`${appConfig.sellerUrl}/?tab=inventory`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                    <Boxes className="w-4 h-4" />
                  </span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-amber-300 transition-colors" />
                </div>
                <strong className="text-xs text-white font-bold block group-hover:text-amber-300 transition-colors">
                  Quản Lý Kho Hàng & Tồn
                </strong>
                <span className="text-[10px] text-slate-400 block mt-0.5">Nạp tồn kho, mã serial & đơn hàng</span>
              </a>
            </div>
          </div>

          {/* CRITICAL SECURITY & REGULATORY BANNER */}
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
            <div className="flex items-center gap-2 font-black text-amber-800 uppercase tracking-wider text-[11px]">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Chính Sách Khóa Định Danh Pháp Lý Gian Hàng</span>
            </div>
            <p className="leading-relaxed text-slate-700">
              Nhằm bảo vệ quyền lợi người mua và ngăn chặn hành vi thay đổi thông tin gian hàng sau khi đã đăng bán sản phẩm, 
              <strong> chủ gian hàng chỉ có quyền thay đổi Ảnh đại diện (Avatar/Logo)</strong>.
              Mọi thông tin định danh như <strong>Tên gian hàng, CCCD người đại diện, Số tài khoản nhận tiền, Mã số thuế và Địa chỉ kho</strong> đều bị khóa cố định (read-only) và không thể chỉnh sửa.
            </p>
          </div>

          {shopSuccessMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{shopSuccessMsg}</span>
            </div>
          )}

          {/* Avatar Edit Section - THE ONLY EDITABLE FIELD */}
          <form onSubmit={handleSaveShopAvatar} className="space-y-6 border-b border-slate-100 pb-6 max-w-2xl">
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Ảnh Đại Diện Gian Hàng (Avatar / Logo Shop - Mục duy nhất được phép thay đổi)</span>
              </label>

              <div className="flex items-center gap-4">
                <img
                  src={shopAvatar}
                  alt="Shop Logo"
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-500 shadow-md"
                />
                <div className="space-y-2 flex-1">
                  <input
                    type="text"
                    value={shopAvatar}
                    onChange={(e) => setShopAvatar(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShopAvatar('https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=200')
                      }
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                    >
                      Logo Công Nghệ
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setShopAvatar('https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200')
                      }
                      className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                    >
                      Logo Gaming VIP
                    </button>
                  </div>
                </div>
              </div>

              <Button type="submit" size="sm" className="bg-amber-600 hover:bg-amber-700 text-white font-bold cursor-pointer">
                <Save className="w-3.5 h-3.5 mr-1" />
                <span>Cập Nhật Avatar Gian Hàng</span>
              </Button>
            </div>
          </form>

          {/* ALL OTHER FIELDS STRICTLY LOCKED & READ-ONLY */}
          <div className="space-y-5 max-w-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Thông Tin Định Danh Gian Hàng (Đã Khóa Bảo Mật)
            </h3>

            {/* Shop Name */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">Tên Gian Hàng</label>
                <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded">
                  <Lock className="w-3 h-3 text-slate-500" />
                  <span>Khóa cố định</span>
                </span>
              </div>
              <input
                type="text"
                value={shopData.name}
                disabled
                readOnly
                className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-not-allowed font-semibold"
              />
            </div>

            {/* Owner Name & CCCD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Người Đại Diện Pháp Luật</label>
                  <Lock className="w-3 h-3 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={shopData.ownerName}
                  disabled
                  readOnly
                  className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Số CCCD / Hộ Chiếu</label>
                  <Lock className="w-3 h-3 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={shopData.cccd}
                  disabled
                  readOnly
                  className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-not-allowed font-mono"
                />
              </div>
            </div>

            {/* Bank Account & Tax Code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>Tài Khoản Ngân Hàng Thụ Hưởng</span>
                  </label>
                  <Lock className="w-3 h-3 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={shopData.bankAccount}
                  disabled
                  readOnly
                  className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-not-allowed font-mono"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>Mã Số Thuế</span>
                  </label>
                  <Lock className="w-3 h-3 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={shopData.taxCode}
                  disabled
                  readOnly
                  className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-not-allowed font-mono"
                />
              </div>
            </div>

            {/* Warehouse Address */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Địa Chỉ Kho Hàng / Trụ Sở Kinh Doanh Đăng Ký</span>
                </label>
                <Lock className="w-3 h-3 text-slate-400" />
              </div>
              <input
                type="text"
                value={shopData.warehouseAddress}
                disabled
                readOnly
                className="w-full text-xs px-3 py-2 bg-slate-100 text-slate-600 border border-slate-200 rounded-xl cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      )
    )}
  </div>
);
};
