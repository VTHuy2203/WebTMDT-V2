import React, { useEffect, useState } from 'react';
import type { GameAccountProduct, GameSummary, GamePlatform, GameAccountDeliveryMode, GameAccountLoginMethod } from '@marketplace/types';
import { gameAccountApi, sellerApi } from '@marketplace/api-client';
import { RiskNotice } from '@marketplace/ui';
import {
  Gamepad2,
  ShieldCheck,
  Image as ImageIcon,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info,
  AlertTriangle,
  Upload,
  Clock,
  Sparkles,
  HelpCircle,
} from 'lucide-react';

interface SellerGameAccountProductFormViewProps {
  initialProduct?: GameAccountProduct | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const STEPS = [
  { step: 1, title: 'Game & Nền tảng' },
  { step: 2, title: 'Thông số tài khoản' },
  { step: 3, title: 'Mô tả & Hình ảnh' },
  { step: 4, title: 'Giá & Bảo hành' },
  { step: 5, title: 'Bàn giao' },
  { step: 6, title: 'Cam kết & Đăng bán' },
];

export const SellerGameAccountProductFormView: React.FC<SellerGameAccountProductFormViewProps> = ({
  initialProduct,
  onSuccess,
  onCancel,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [gameId, setGameId] = useState(initialProduct?.game?.id || initialProduct?.gameId || '');
  const [platform, setPlatform] = useState<GamePlatform>(initialProduct?.platform || 'PC');
  const [server, setServer] = useState(initialProduct?.server || 'Vietnam');
  const [loginMethod, setLoginMethod] = useState<GameAccountLoginMethod>(initialProduct?.loginMethod || 'USERNAME');

  const [rank, setRank] = useState(initialProduct?.accountDetails?.rank || '');
  const [skinCount, setSkinCount] = useState<number>(initialProduct?.accountDetails?.skinCount || 0);
  const [championCount, setChampionCount] = useState<number>(initialProduct?.accountDetails?.championCount || 0);
  const [originalEmailIncluded, setOriginalEmailIncluded] = useState<boolean>(initialProduct?.accountDetails?.originalEmailIncluded ?? true);
  const [emailChangeable, setEmailChangeable] = useState<boolean>(initialProduct?.accountDetails?.emailChangeable ?? true);
  const [phoneChangeable, setPhoneChangeable] = useState<boolean>(initialProduct?.accountDetails?.phoneChangeable ?? true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(initialProduct?.accountDetails?.twoFactorEnabled ?? false);
  const [cleanHistory, setCleanHistory] = useState<boolean>(initialProduct?.accountDetails?.cleanHistory ?? true);
  const [dynamicAttributes, setDynamicAttributes] = useState<Record<string, any>>(initialProduct?.accountDetails?.dynamicAttributes || {});

  const [name, setName] = useState(initialProduct?.name || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [images, setImages] = useState<string[]>(
    initialProduct?.images && initialProduct.images.length > 0
      ? initialProduct.images.map((img: any) => typeof img === 'string' ? img : img.url)
      : ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&q=80']
  );
  const [imageUrlInput, setImageUrlInput] = useState('');

  const [price, setPrice] = useState<number>(initialProduct?.basePrice || initialProduct?.price || 500000);
  const [originalPrice, setOriginalPrice] = useState<number>(initialProduct?.compareAtPrice || initialProduct?.originalPrice || 800000);
  const [warrantyPeriodHours, setWarrantyPeriodHours] = useState<number>(initialProduct?.warrantyHours || initialProduct?.warrantyPeriodHours || 72);
  const [warrantyDescription, setWarrantyDescription] = useState(
    initialProduct?.warrantyDescription || 'Bảo hành back acc / lỗi mật khẩu 1 đổi 1 trong thời hạn'
  );

  const [deliveryMode, setDeliveryMode] = useState<GameAccountDeliveryMode>(initialProduct?.deliveryMode || 'AUTO_AFTER_PAYMENT');
  const [deliveryEstimateMinutes, setDeliveryEstimateMinutes] = useState<number>(initialProduct?.deliveryEstimateMinutes || 1);

  const [committed, setCommitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadGames() {
      try {
        const list = await gameAccountApi.getGames();
        setGames(list);
        if (!gameId && list.length > 0) {
          setGameId(list[0].id);
        }
      } catch (err) {
        console.error('Failed to load games:', err);
      }
    }
    loadGames();
  }, []);

  const selectedGame = games.find((g) => g.id === gameId);

  const handleAddImage = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!committed) {
      setError('Vui lòng xác nhận cam kết quyền sở hữu và chính sách giao dịch.');
      return;
    }
    if (!name.trim()) {
      setError('Tiêu đề sản phẩm không được để trống.');
      return;
    }
    if (price <= 0) {
      setError('Giá bán phải lớn hơn 0đ.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const selectedG = selectedGame || games[0] || {
        id: gameId || 'game_1',
        slug: 'game-online',
        name: 'Game Online',
        logoUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=200&q=80',
        platforms: [platform],
        servers: [server],
        attributeSchema: [],
      };

      const productImages = images.map((url, idx) => ({
        id: `img_${idx}`,
        url,
        isThumbnail: idx === 0,
        displayOrder: idx,
      }));

      const productPayload: Partial<GameAccountProduct> = {
        id: initialProduct?.id || `gap_${Date.now()}`,
        type: 'DIGITAL_GAME_ACCOUNT',
        name,
        slug: initialProduct?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        description,
        basePrice: price,
        compareAtPrice: originalPrice,
        price,
        originalPrice,
        thumbnail: images[0] || '',
        images: productImages,
        game: selectedG,
        gameId: selectedG.id,
        gameName: selectedG.name,
        platform,
        server,
        loginMethod,
        category: { id: 'cat_game_acc', name: 'Tài khoản game', slug: 'game-accounts' },
        shop: {
          id: 'shop_seller',
          name: 'Shop Của Bạn',
          slug: 'my-shop',
          logo: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=150',
          rating: 5,
        },
        rating: 5,
        reviewCount: 0,
        soldCount: 0,
        variants: [],
        specifications: [],
        publicAttributes: dynamicAttributes,
        changeability: {
          canChangePassword: true,
          canChangeEmail: emailChangeable,
          canChangePhone: phoneChangeable,
          canRemoveLinkedServices: true,
        },
        linkedServices: [],
        warrantyHours: warrantyPeriodHours,
        warrantyPeriodHours,
        warrantyDescription,
        deliveryMode,
        deliveryEstimateMinutes,
        availableStock: initialProduct?.availableStock ?? 1,
        inStock: initialProduct?.inStock ?? 1,
        stockCount: initialProduct?.stockCount ?? 1,
        sellerCommitments: [
          'Cam kết sở hữu hợp pháp',
          'Bảo hành đổi trả 1:1 nếu lỗi trong thời hạn',
        ],
        riskNotices: [
          'Đổi mật khẩu ngay sau khi nhận tài khoản',
        ],
        status: 'ACTIVE',
        moderationStatus: 'APPROVED',
      };

      await sellerApi.saveSellerGameAccount(productPayload);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu sản phẩm tài khoản game.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Gamepad2 className="w-7 h-7 text-indigo-600" />
            {initialProduct ? 'Chỉnh sửa tài khoản Game' : 'Đăng bán tài khoản Game'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Quy trình đăng bán 6 bước bảo mật và chuẩn hoá thông số tài khoản kỹ thuật số
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Hủy bỏ
        </button>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-6 gap-2">
          {STEPS.map((s) => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step)}
                className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : isDone
                    ? 'text-emerald-700'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isDone
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.step}
                </div>
                <span className="text-[11px] leading-tight line-clamp-1">{s.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Content */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        {/* STEP 1: Game & Nền tảng */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Bước 1: Chọn Tựa Game & Nền Tảng</h3>
              <p className="text-sm text-slate-500">Chọn đúng trò chơi và hệ máy để người mua dễ dàng tìm kiếm</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Tựa Game *</label>
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  {games.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name} {g.publisher ? `(${g.publisher})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Nền tảng (Platform) *</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as GamePlatform)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="PC">PC (Máy tính)</option>
                  <option value="MOBILE">Mobile (iOS / Android)</option>
                  <option value="PLAYSTATION">PlayStation (PS4 / PS5)</option>
                  <option value="XBOX">Xbox</option>
                  <option value="NINTENDO_SWITCH">Nintendo Switch</option>
                  <option value="CROSS_PLATFORM">Đa nền tảng (Cross-Platform)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Máy chủ (Server) *</label>
                <input
                  type="text"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  placeholder="Ví dụ: Việt Nam, Asia, Global, NA..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Phương thức đăng nhập *</label>
                <input
                  type="text"
                  value={loginMethod}
                  onChange={(e) => setLoginMethod(e.target.value as GameAccountLoginMethod)}
                  placeholder="Ví dụ: Riot Games, Garena, Steam, Hoyoverse, Google..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Thông số tài khoản */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Bước 2: Thông Số Kỹ Thuật & Quyền Sở Hữu</h3>
              <p className="text-sm text-slate-500">Cung cấp chi tiết quyền đổi thông tin và các chỉ số ingame</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Xếp hạng / Rank</label>
                <input
                  type="text"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="Ví dụ: Kim Cương IV, Thách Đấu, AR60..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Số lượng Trang phục (Skins)</label>
                <input
                  type="number"
                  value={skinCount}
                  onChange={(e) => setSkinCount(Number(e.target.value))}
                  min={0}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Số Tướng / Nhân vật</label>
                <input
                  type="number"
                  value={championCount}
                  onChange={(e) => setChampionCount(Number(e.target.value))}
                  min={0}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Quyền đổi thông tin & Hồ sơ bảo mật</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailChangeable}
                    onChange={(e) => setEmailChangeable(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">Có thể đổi Email</span>
                    <p className="text-xs text-slate-500">Người mua có thể đổi sang email cá nhân của họ</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={originalEmailIncluded}
                    onChange={(e) => setOriginalEmailIncluded(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">Kèm Email Gốc (First Mail)</span>
                    <p className="text-xs text-slate-500">Bàn giao toàn bộ hòm thư tạo nick ban đầu</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={phoneChangeable}
                    onChange={(e) => setPhoneChangeable(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">Chưa gắn SĐT / Đổi được SĐT</span>
                    <p className="text-xs text-slate-500">Không bị kẹt số điện thoại của người khác</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cleanHistory}
                    onChange={(e) => setCleanHistory(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <span className="text-sm font-semibold text-slate-800">Lịch sử sạch (Clean History)</span>
                    <p className="text-xs text-slate-500">Chưa từng bị khoá, ban 30 ngày, cheat hoặc âm tiền nạp</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Dynamic Attributes from Game Schema */}
            {selectedGame && selectedGame.attributeSchema && selectedGame.attributeSchema.length > 0 && (
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Thuộc tính đặc trưng theo game ({selectedGame.name})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedGame.attributeSchema.map((attr) => (
                    <div key={attr.key}>
                      <label className="block text-xs font-bold uppercase text-slate-700 mb-1.5">
                        {attr.label} {attr.required && '*'}
                      </label>
                      {attr.type === 'SELECT' ? (
                        <select
                          value={dynamicAttributes[attr.key] || ''}
                          onChange={(e) =>
                            setDynamicAttributes((prev) => ({ ...prev, [attr.key]: e.target.value }))
                          }
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">-- Chọn {attr.label} --</option>
                          {attr.options?.map((opt: any) => {
                            const val = typeof opt === 'string' ? opt : opt.value;
                            const lbl = typeof opt === 'string' ? opt : opt.label;
                            return (
                              <option key={val} value={val}>
                                {lbl}
                              </option>
                            );
                          })}
                        </select>
                      ) : attr.type === 'BOOLEAN' ? (
                        <select
                          value={dynamicAttributes[attr.key] ? 'true' : 'false'}
                          onChange={(e) =>
                            setDynamicAttributes((prev) => ({
                              ...prev,
                              [attr.key]: e.target.value === 'true',
                            }))
                          }
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="false">Không</option>
                          <option value="true">Có</option>
                        </select>
                      ) : (
                        <input
                          type={attr.type === 'NUMBER' ? 'number' : 'text'}
                          value={dynamicAttributes[attr.key] || ''}
                          onChange={(e) =>
                            setDynamicAttributes((prev) => ({
                              ...prev,
                              [attr.key]: attr.type === 'NUMBER' ? Number(e.target.value) : e.target.value,
                            }))
                          }
                          placeholder={`Nhập ${attr.label}...`}
                          className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 3: Tiêu đề, Mô tả & Hình ảnh */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Bước 3: Mô Tả & Hình Ảnh Ảnh Minh Hoạ</h3>
              <p className="text-sm text-slate-500">Giới thiệu chi tiết trang phục, vũ khí và hình ảnh thực tế</p>
            </div>

            {/* Privacy Redaction Warning */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <span className="font-bold">Lưu ý bảo mật hình ảnh:</span>
                <p>
                  Vui lòng <strong>che mờ hoặc xóa</strong> tên hiển thị ingame (Ign/Tag), UID, email, mã thẻ thanh toán,
                  hoặc bất kỳ thông tin nào có thể bị nhà phát hành soi để tránh bị ban tài khoản hoặc tranh chấp.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Tiêu đề tin đăng *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Acc Liên Quân Full Tướng 350 Skin, Rank Tinh Anh, Trắng Thông Tin"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Mô tả chi tiết *</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Liệt kê chi tiết các skin hiếm, tướng, ngọc, bậc tinh hoa, lịch sử nạp..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Image URLs */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Ảnh chụp màn hình (Screenshots)</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Dán link ảnh (https://...)"
                  className="flex-1 px-4 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImage}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors"
                >
                  Thêm ảnh
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-video bg-slate-100">
                    <img src={img} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600 text-white text-xs px-2 py-0.5 rounded opacity-90 group-hover:opacity-100 transition-opacity"
                    >
                      Xoá
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Giá & Bảo hành */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Bước 4: Thiết Lập Giá Bán & Chế Độ Bảo Hành</h3>
              <p className="text-sm text-slate-500">Mức giá rõ ràng và chính sách bảo hành nâng cao uy tín shop</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Giá bán thực tế (VNĐ) *</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  step={10000}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500 mt-1 block">
                  Hiển thị: {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Giá gạch (Giá niêm yết cũ)</label>
                <input
                  type="number"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                  step={10000}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Thời gian bảo hành *</label>
                <select
                  value={warrantyPeriodHours}
                  onChange={(e) => setWarrantyPeriodHours(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={24}>24 giờ (1 ngày)</option>
                  <option value={72}>72 giờ (3 ngày - Khuyên dùng)</option>
                  <option value={168}>168 giờ (7 ngày)</option>
                  <option value={720}>720 giờ (30 ngày - Uy tín cao)</option>
                  <option value={8760}>Vĩnh viễn (Trọn đời)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Cam kết bảo hành</label>
                <input
                  type="text"
                  value={warrantyDescription}
                  onChange={(e) => setWarrantyDescription(e.target.value)}
                  placeholder="Ví dụ: Đổi 1-1 nếu lỗi mật khẩu hoặc bị back trong hạn bảo hành"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Bàn giao */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Bước 5: Phương Thức Bàn Giao Tài Khoản</h3>
              <p className="text-sm text-slate-500">Cách tài khoản được chuyển giao sau khi người mua thanh toán thành công</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  deliveryMode === 'AUTO_AFTER_PAYMENT'
                    ? 'border-indigo-600 bg-indigo-50/50 text-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-indigo-700 text-base">Giao tự động ngay (Auto Vault)</span>
                    <input
                      type="radio"
                      name="deliveryMode"
                      value="AUTO_AFTER_PAYMENT"
                      checked={deliveryMode === 'AUTO_AFTER_PAYMENT'}
                      onChange={() => setDeliveryMode('AUTO_AFTER_PAYMENT')}
                      className="w-4 h-4 text-indigo-600"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Hệ thống tự động trích xuất mật khẩu từ Kho Vault và bàn giao cho người mua ngay sau khi thanh toán VietQR / SePay thành công.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-100 flex items-center gap-1.5 text-xs text-indigo-700 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Thời gian nhận acc: Dưới 1 phút
                </div>
              </label>

              <label
                className={`p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  deliveryMode === 'SELLER_CONFIRMATION'
                    ? 'border-indigo-600 bg-indigo-50/50 text-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-slate-900 text-base">Bàn giao thủ công (Người bán gửi)</span>
                    <input
                      type="radio"
                      name="deliveryMode"
                      value="SELLER_CONFIRMATION"
                      checked={deliveryMode === 'SELLER_CONFIRMATION'}
                      onChange={() => setDeliveryMode('SELLER_CONFIRMATION')}
                      className="w-4 h-4 text-indigo-600"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Người bán sẽ liên hệ trực tiếp hoặc hỗ trợ người mua đổi thông tin (email, mã OTP xác thực) qua khung chat đơn hàng.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                  <Clock className="w-3.5 h-3.5" />
                  Thời gian dự kiến: 15 - 30 phút
                </div>
              </label>
            </div>
          </div>
        )}

        {/* STEP 6: Cam kết & Đăng bán */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Bước 6: Cam Kết Người Bán & Xác Nhận Đăng Bán</h3>
              <p className="text-sm text-slate-500">Xem lại tóm tắt thông tin sản phẩm và đồng ý quy định sàn</p>
            </div>

            {/* Summary Box */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-sm pb-2 border-b border-slate-200">
                <span className="text-slate-600 font-medium">Tên tin đăng:</span>
                <span className="font-bold text-slate-900 text-right max-w-sm truncate">{name || '(Chưa đặt)'}</span>
              </div>
              <div className="flex items-center justify-between text-sm pb-2 border-b border-slate-200">
                <span className="text-slate-600 font-medium">Tựa game & Nền tảng:</span>
                <span className="font-semibold text-slate-900">
                  {selectedGame?.name} ({platform} - {server})
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pb-2 border-b border-slate-200">
                <span className="text-slate-600 font-medium">Giá bán:</span>
                <span className="font-bold text-indigo-600">
                  {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">Bảo hành:</span>
                <span className="font-semibold text-emerald-600">{warrantyPeriodHours} giờ</span>
              </div>
            </div>

            {/* Platform Risk and Commitment Notice */}
            <RiskNotice />

            {/* Checkbox agreement */}
            <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-indigo-200 bg-indigo-50/40 cursor-pointer">
              <input
                type="checkbox"
                checked={committed}
                onChange={(e) => setCommitted(e.target.checked)}
                className="mt-1 w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <div className="text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-0.5">Cam kết sở hữu hợp pháp và tuân thủ sàn:</span>
                Tôi cam kết tài khoản này thuộc quyền sở hữu của tôi, không có tranh chấp nguồn gốc, không sử dụng hack/cheat
                dẫn đến nguy cơ khóa nick. Tôi đồng ý chịu trách nhiệm bồi thường hoàn tiền 100% nếu tài khoản bị thu hồi
                hoặc sai lệch thông tin trong thời hạn bảo hành.
              </div>
            </label>
          </div>
        )}

        {/* Bottom Nav Controls */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Quay lại
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => prev + 1)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              Tiếp tục
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !committed}
              className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 shadow-sm disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Đang lưu...' : 'Hoàn tất & Đăng bán'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
