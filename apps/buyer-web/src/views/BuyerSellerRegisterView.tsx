import React, { useEffect, useState } from 'react';
import type { SellerApplication, BusinessEntityType } from '@marketplace/types';
import { sellerApi, adminApi } from '@marketplace/api-client';
import { useAuthStore } from '@marketplace/auth';
import { Button, Input, StatusBadge } from '@marketplace/ui';
import {
  Store,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Building2,
  CreditCard,
  MapPin,
  Sparkles,
  UserCheck,
  Camera,
  FileText,
  AlertCircle,
  Check,
  Lock,
  Upload,
  Image as ImageIcon,
  Building,
  User,
  ShieldAlert,
  HelpCircle,
  FileCheck,
  RefreshCw,
  Trash2,
} from 'lucide-react';

export interface BuyerSellerRegisterViewProps {
  onBack: () => void;
  onRequireAuth: () => void;
  onViewShop?: (shopId: string) => void;
}

export const BuyerSellerRegisterView: React.FC<BuyerSellerRegisterViewProps> = ({
  onBack,
  onRequireAuth,
  onViewShop,
}) => {
  const { user, isAuthenticated, updateUser } = useAuthStore();
  const [app, setApp] = useState<SellerApplication | null>(null);

  // 1. Loại hình kinh doanh (Mặc định chọn Hộ kinh doanh cá thể theo yêu cầu phổ biến)
  const [businessType, setBusinessType] = useState<BusinessEntityType>('HOUSEHOLD');

  // 2. Thông tin gian hàng (Mặc định để trống hoàn toàn để người dùng tự nhập)
  const [shopName, setShopName] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // 3. Thông tin định danh đại diện pháp luật (CCCD) - Người dùng tự nhập
  const [ownerFullName, setOwnerFullName] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [idCardIssueDate, setIdCardIssueDate] = useState('');
  const [idCardIssuePlace, setIdCardIssuePlace] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // 4. Thông tin Hộ kinh doanh / Doanh nghiệp theo quy định hiện hành (Nghị định 01/2021/NĐ-CP)
  const [householdName, setHouseholdName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [businessLicenseNumber, setBusinessLicenseNumber] = useState('');
  const [businessRegistrationDate, setBusinessRegistrationDate] = useState('');
  const [businessRegistrationPlace, setBusinessRegistrationPlace] = useState('');
  const [businessSectorCode, setBusinessSectorCode] = useState('');
  const [headquarterAddress, setHeadquarterAddress] = useState('');

  // 5. Ảnh tài liệu xác minh danh tính & Giấy phép (KYC Photos) - Mặc định để trống
  const [idCardFrontImage, setIdCardFrontImage] = useState('');
  const [idCardBackImage, setIdCardBackImage] = useState('');
  const [selfieWithIdImage, setSelfieWithIdImage] = useState('');
  const [businessLicenseImage, setBusinessLicenseImage] = useState('');

  // 6. Địa chỉ kho xuất hàng & gửi trả hàng - Mặc định để trống
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  // 7. Tài khoản ngân hàng nhận tiền - Mặc định để trống
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankBranch, setBankBranch] = useState('');

  // 8. Cam kết tuân thủ pháp luật & thuế - Người dùng tự tích chọn
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedQuality, setAgreedQuality] = useState(false);
  const [agreedTaxCompliance, setAgreedTaxCompliance] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Danh mục ngành hàng kinh doanh
  const availableCategories = [
    'Linh kiện máy tính & PC Gaming',
    'Thiết bị ngoại vi (Bàn phím, Chuột, Tai nghe)',
    'Laptop & Máy trạm đồ họa',
    'Tài khoản Game & Vật phẩm số',
    'Tài khoản ứng dụng & AI bản quyền',
    'Phụ kiện số & Thiết bị thông minh',
  ];

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  // Helper xử lý tải file ảnh trực tiếp từ máy (FileReader Base64)
  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 8 * 1024 * 1024) {
        alert('Dung lượng file tối đa là 8MB. Vui lòng chọn ảnh nhỏ hơn.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setter(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    async function load() {
      if (isAuthenticated) {
        try {
          const current = await sellerApi.getMyApplication();
          if (current) {
            setApp(current);
          }
        } catch (e) {
          // ignore
        }
      }
    }
    load();
  }, [isAuthenticated]);

  // Handle Submit Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onRequireAuth();
      return;
    }

    // Validation cơ bản
    if (!shopName.trim()) {
      alert('Vui lòng nhập tên gian hàng.');
      return;
    }

    if (selectedCategories.length === 0) {
      alert('Vui lòng chọn ít nhất một nhóm ngành hàng kinh doanh.');
      return;
    }

    if (!ownerFullName.trim()) {
      alert('Vui lòng nhập họ và tên người đại diện theo CCCD.');
      return;
    }

    if (!idCardNumber.trim() || idCardNumber.length !== 12) {
      alert('Vui lòng nhập chính xác số Căn Cước Công Dân gắn chip (đúng 12 chữ số).');
      return;
    }

    if (!idCardIssueDate) {
      alert('Vui lòng chọn ngày cấp Căn Cước Công Dân.');
      return;
    }

    if (!idCardIssuePlace.trim()) {
      alert('Vui lòng nhập nơi cấp CCCD (VD: Cục Cảnh sát QLHC về TTXH).');
      return;
    }

    // Mã số thuế bắt buộc
    if (!taxCode.trim() || (taxCode.trim().length !== 10 && taxCode.trim().length !== 13)) {
      alert('Vui lòng nhập Mã số thuế (MST) hợp lệ gồm 10 chữ số (hoặc 13 chữ số) theo quy định thuế TMĐT.');
      return;
    }

    // Yêu cầu riêng cho Hộ Kinh Doanh theo Nghị định 01/2021/NĐ-CP
    if (businessType === 'HOUSEHOLD') {
      if (!householdName.trim()) {
        alert('Vui lòng nhập Tên Hộ kinh doanh ghi trên Giấy chứng nhận đăng ký hộ kinh doanh.');
        return;
      }
      if (!businessLicenseNumber.trim()) {
        alert('Vui lòng nhập Số Giấy chứng nhận đăng ký hộ kinh doanh (do UBND Quận/Huyện cấp).');
        return;
      }
      if (!businessLicenseImage) {
        alert('Vui lòng tải lên ảnh chụp Giấy chứng nhận đăng ký Hộ kinh doanh (bản gốc có dấu đỏ).');
        return;
      }
    }

    // Doanh nghiệp
    if (businessType === 'ENTERPRISE') {
      if (!companyName.trim()) {
        alert('Vui lòng nhập Tên Doanh nghiệp / Công ty theo Giấy phép ĐKKD.');
        return;
      }
      if (!businessLicenseNumber.trim()) {
        alert('Vui lòng nhập Mã số doanh nghiệp / Số Giấy phép ĐKKD.');
        return;
      }
      if (!businessLicenseImage) {
        alert('Vui lòng tải lên ảnh Giấy phép ĐKKD của Doanh nghiệp.');
        return;
      }
    }

    // CCCD 2 mặt bắt buộc
    if (!idCardFrontImage) {
      alert('Vui lòng cung cấp ảnh Mặt trước Căn Cước Công Dân (CCCD).');
      return;
    }

    if (!idCardBackImage) {
      alert('Vui lòng cung cấp ảnh Mặt sau Căn Cước Công Dân (CCCD).');
      return;
    }

    // Địa chỉ kho
    if (!province.trim() || !district.trim() || !ward.trim() || !streetAddress.trim()) {
      alert('Vui lòng nhập đầy đủ địa chỉ kho lấy hàng & nhận hàng hoàn trả (Tỉnh/Thành phố, Quận/Huyện, Phường/Xã, Số nhà tên đường).');
      return;
    }

    // Ngân hàng
    if (!bankName.trim() || !bankAccountNumber.trim()) {
      alert('Vui lòng chọn ngân hàng và nhập số tài khoản ngân hàng nhận tiền.');
      return;
    }

    // Cam kết
    if (!agreedTerms || !agreedQuality || !agreedTaxCompliance) {
      alert('Vui lòng tích chọn đồng ý với tất cả cam kết pháp luật, chất lượng và nghĩa vụ thuế.');
      return;
    }

    const fullPickupAddress = `${streetAddress.trim()}, ${ward.trim()}, ${district.trim()}, ${province.trim()}`;
    const slug = shopName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    setIsSubmitting(true);
    try {
      const created = await sellerApi.applyAsSeller({
        shopName: shopName.trim(),
        shopSlug: slug,
        ownerFullName: ownerFullName.trim().toUpperCase(),
        businessType,
        taxCode: taxCode.trim(),
        householdName: businessType === 'HOUSEHOLD' ? householdName.trim() : undefined,
        businessRegistrationDate: businessRegistrationDate || undefined,
        businessRegistrationPlace: businessRegistrationPlace.trim() || undefined,
        headquarterAddress: headquarterAddress.trim() || undefined,
        businessSectorCode: businessSectorCode.trim() || undefined,
        idCardNumber: idCardNumber.trim(),
        idCardIssueDate,
        idCardIssuePlace: idCardIssuePlace.trim(),
        idCardImages: [idCardFrontImage, idCardBackImage, selfieWithIdImage, businessLicenseImage].filter(Boolean),
        idCardFrontImage,
        idCardBackImage,
        selfieWithIdImage: selfieWithIdImage || undefined,
        businessLicenseNumber: businessLicenseNumber.trim() || undefined,
        businessLicenseImage: businessLicenseImage || undefined,
        businessCategories: selectedCategories,
        contactEmail: contactEmail.trim(),
        contactPhone: contactPhone.trim(),
        bankAccount: {
          bankName,
          accountNumber: bankAccountNumber.trim(),
          accountHolder: ownerFullName.trim().toUpperCase(),
          branch: bankBranch.trim(),
        },
        pickupAddress: fullPickupAddress,
        shopDescription: shopDescription.trim(),
      });
      setApp(created);
    } catch (err) {
      console.error('Failed to submit seller application:', err);
      alert('Có lỗi xảy ra khi nộp hồ sơ mở gian hàng: ' + (err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Nút trợ giúp điền ảnh mẫu chuẩn để phục vụ test nhanh nếu người dùng muốn
  const handleUseSamplePhotos = () => {
    setIdCardFrontImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600');
    setIdCardBackImage('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600');
    setSelfieWithIdImage('https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=600');
    if (businessType === 'HOUSEHOLD' || businessType === 'ENTERPRISE') {
      setBusinessLicenseImage('https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600');
    }
    alert('✓ Đã nạp ảnh mẫu CCCD 2 mặt & Giấy chứng nhận ĐKHKD phục vụ kiểm thử!');
  };

  // Not authenticated banner
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại trang chủ</span>
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Store className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Đăng Ký Trở Thành Người Bán & Mở Gian Hàng
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Bạn cần có tài khoản TechMarket để tiếp tục nộp hồ sơ định danh CCCD và tài khoản ngân hàng nhận tiền bán hàng.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" onClick={onRequireAuth} className="w-full sm:w-auto font-bold bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
              Đăng Nhập / Tạo Tài Khoản Ngay
            </Button>
            <Button variant="outline" size="lg" onClick={onBack} className="w-full sm:w-auto cursor-pointer">
              Để Sau
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Quay lại</span>
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-200/80 mb-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Kênh Đăng Ký Mở Gian Hàng Thương Mại Điện Tử</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Đăng Ký Gian Hàng & Xác Minh Hộ Kinh Doanh
          </h1>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Tuân thủ Nghị định 01/2021/NĐ-CP (Đăng ký hộ kinh doanh) & Nghị định 91/2022/NĐ-CP (Quản lý thuế TMĐT). Toàn bộ thông tin cần do người bán tự kê khai trung thực và chính xác.
          </p>
        </div>
      </div>

      {/* PENDING APPLICATION STATE */}
      {app && app.status === 'PENDING' ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-xs">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-900">Hồ Sơ Đang Chờ Ban Quản Trị Thẩm Định</h3>
              <p className="text-xs text-slate-500 max-w-lg mx-auto leading-relaxed">
                Hồ sơ mở gian hàng <strong>{app.shopName}</strong> đã được tiếp nhận. Đội ngũ kiểm duyệt TechMarket đang tiến hành đối soát thông tin CCCD gắn chip 2 mặt, Mã số thuế và tài khoản ngân hàng trong vòng <strong>24 giờ làm việc</strong>.
              </p>
            </div>
          </div>

          {/* Application Summary Card */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Tóm Tắt Hồ Sơ Đã Nộp:
              </h4>
              <StatusBadge status={app.status} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-600">
              <div>
                <span className="text-slate-400 block">Tên gian hàng:</span>
                <span className="font-bold text-slate-900 text-sm">{app.shopName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Loại hình kinh doanh:</span>
                <span className="font-semibold text-purple-700">
                  {app.businessType === 'ENTERPRISE'
                    ? 'Doanh nghiệp / Công ty'
                    : app.businessType === 'HOUSEHOLD'
                    ? 'Hộ kinh doanh cá thể'
                    : 'Cá nhân kinh doanh'}
                </span>
              </div>

              {app.householdName && (
                <div>
                  <span className="text-slate-400 block">Tên Hộ kinh doanh:</span>
                  <span className="font-bold text-slate-900">{app.householdName}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block">Mã số thuế (MST):</span>
                <span className="font-mono font-bold text-slate-900">{app.taxCode || 'Chưa cập nhật'}</span>
              </div>

              {app.businessLicenseNumber && (
                <div>
                  <span className="text-slate-400 block">Số Giấy phép ĐKKD:</span>
                  <span className="font-mono font-bold text-slate-900">{app.businessLicenseNumber}</span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block">Chủ sở hữu đại diện:</span>
                <span className="font-bold text-slate-900">{app.ownerFullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Số CCCD gắn chip:</span>
                <span className="font-mono font-bold text-slate-900">{app.idCardNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tài khoản ngân hàng nhận tiền:</span>
                <span className="font-mono font-bold text-blue-700">
                  {app.bankAccount?.bankName} - {app.bankAccount?.accountNumber}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Chủ TK: {app.bankAccount?.accountHolder}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block">Kho xuất hàng & trả hàng:</span>
                <span className="text-slate-800 leading-snug">{app.pickupAddress}</span>
              </div>
            </div>

            {/* Submitted verification images */}
            {app.idCardImages && app.idCardImages.length > 0 && (
              <div className="pt-3 border-t border-slate-200">
                <span className="text-slate-400 block mb-2 font-medium">Tài liệu định danh & pháp lý đã gửi:</span>
                <div className="flex flex-wrap gap-3">
                  {app.idCardImages.map((img, i) => (
                    <div key={i} className="text-center">
                      <img
                        src={img}
                        alt={`KYC doc ${i}`}
                        className="w-24 h-16 rounded-lg object-cover border border-slate-300 shadow-xs"
                      />
                      <span className="text-[10px] text-slate-400 block mt-1">
                        {i === 0 ? 'CCCD Mặt trước' : i === 1 ? 'CCCD Mặt sau' : i === 2 ? 'Selfie CCCD' : 'Giấy phép ĐKKD'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={async () => {
                await adminApi.reviewSeller(app.id, 'APPROVE');
                setApp({ ...app, status: 'APPROVED' });
                updateUser({ role: 'SELLER_OWNER', shopId: `shop_${app.id}` });
                alert('✓ [Mô Phỏng] Ban Quản Trị đã phê duyệt hồ sơ gian hàng! Tài khoản của bạn đã được nâng cấp lên Chủ Shop.');
              }}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
            >
              [Mô phỏng] Phê Duyệt Ngay & Kích Hoạt Shop
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (confirm('Bạn có muốn làm mới và tự nhập lại hồ sơ đăng ký mở gian hàng từ đầu không?')) {
                  setApp(null);
                }
              }}
              className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50 font-semibold cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Điền Lại Hồ Sơ Mới</span>
            </Button>
            <Button variant="outline" onClick={onBack} className="w-full sm:w-auto cursor-pointer">
              Quay Về Mua Sắm
            </Button>
          </div>
        </div>
      ) : app && app.status === 'APPROVED' ? (
        <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-5 shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-900">Gian Hàng Đã Được Phê Duyệt Hoạt Động!</h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
              Chúc mừng bạn! Gian hàng <strong>{app.shopName}</strong> đã vượt qua thẩm định pháp lý và sẵn sàng đăng bán sản phẩm.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              onClick={() => {
                const targetShopId = (app as any).shopId || `shop_${app.id}`;
                if (onViewShop) {
                  onViewShop(targetShopId);
                } else {
                  onBack();
                }
              }}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Store className="w-4 h-4" />
              <span>Truy Cập Quản Trị Gian Hàng</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setApp(null)}
              className="w-full sm:w-auto cursor-pointer"
            >
              Xem Lại Form Đăng Ký
            </Button>
          </div>
        </div>
      ) : (
        /* REGISTRATION FORM - TOÀN BỘ Ô NHẬP DO NGƯỜI DÙNG TỰ ĐIỀN */
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-8 shadow-xs">
          {/* BANNER THÔNG TIN QUY ĐỊNH */}
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-bold">Quy định thẩm định hồ sơ mở gian hàng năm 2026:</strong>
              <p className="leading-relaxed text-[11px] text-blue-800">
                Toàn bộ thông tin cần do người bán trực tiếp kê khai, không tự động điền mẫu. Bạn cần cung cấp <strong>ảnh chụp 2 mặt CCCD gắn chip</strong>, <strong>Mã số thuế (MST)</strong> và các giấy tờ theo <strong>yêu cầu mở Hộ kinh doanh</strong> để sàn xác thực danh tính và đối soát thuế tự động.
              </p>
            </div>
          </div>

          {/* STEP 1: CHỌN LOẠI HÌNH KINH DOANH */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  1. Chọn Loại Hình Kinh Doanh *
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">Chọn 1 trong 3 loại hình</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* HỘ KINH DOANH CÁ THỂ (TIÊU CHUẨN) */}
              <div
                onClick={() => setBusinessType('HOUSEHOLD')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 relative ${
                  businessType === 'HOUSEHOLD'
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-100 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-purple-100 text-purple-700">
                    <Store className="w-5 h-5" />
                  </div>
                  {businessType === 'HOUSEHOLD' && <Check className="w-4 h-4 text-purple-600 font-bold" />}
                </div>
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Phổ biến nhất</span>
                  <h4 className="font-bold text-xs text-slate-900">Hộ kinh doanh cá thể</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Có Giấy phép ĐKKD Hộ kinh doanh (UBND cấp), Mã số thuế HKD 10 số & CCCD 2 mặt chủ hộ.
                </p>
              </div>

              {/* CÁ NHÂN KINH DOANH */}
              <div
                onClick={() => setBusinessType('INDIVIDUAL')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                  businessType === 'INDIVIDUAL'
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-100 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                    <User className="w-5 h-5" />
                  </div>
                  {businessType === 'INDIVIDUAL' && <Check className="w-4 h-4 text-purple-600 font-bold" />}
                </div>
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-blue-700 tracking-wider">Cá nhân</span>
                  <h4 className="font-bold text-xs text-slate-900">Cá nhân kinh doanh</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Kinh doanh nick game, tài khoản AI/app bản quyền hoặc đồ cũ. Cần CCCD 2 mặt và MST cá nhân.
                </p>
              </div>

              {/* DOANH NGHIỆP / CÔNG TY */}
              <div
                onClick={() => setBusinessType('ENTERPRISE')}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer space-y-1.5 ${
                  businessType === 'ENTERPRISE'
                    ? 'border-purple-600 bg-purple-50/40 ring-2 ring-purple-100 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                    <Building className="w-5 h-5" />
                  </div>
                  {businessType === 'ENTERPRISE' && <Check className="w-4 h-4 text-purple-600 font-bold" />}
                </div>
                <div className="pt-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Pháp nhân</span>
                  <h4 className="font-bold text-xs text-slate-900">Doanh nghiệp / Công ty</h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Công ty TNHH/Cổ phần, phân phối phần cứng chính hãng có xuất hóa đơn GTGT.
                </p>
              </div>
            </div>
          </div>

          {/* STEP 2: THÔNG TIN GIAN HÀNG & NHÓM NGÀNH HÀNG */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Store className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                2. Thông Tin Gian Hàng & Nhóm Ngành Hàng *
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Tên gian hàng hiển thị trên sàn *"
                  required
                  placeholder="Nhập tên shop (VD: TechZone Official, Kho Game 247...)"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                />
                {shopName && (
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">
                    Đường dẫn shop: techmarket.vn/shop/
                    <span className="text-purple-600 font-bold">
                      {shopName
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]+/g, '-')
                        .replace(/(^-|-$)/g, '')}
                    </span>
                  </p>
                )}
              </div>

              <Input
                label="Số điện thoại hotline chăm sóc khách hàng *"
                required
                placeholder="Nhập số điện thoại liên hệ (VD: 0912345678)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-800 block mb-1.5">
                Nhóm ngành hàng đăng ký kinh doanh chính (Tích chọn ít nhất 1) *:
              </label>
              <div className="flex flex-wrap gap-2">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 font-normal'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      <span>{cat}</span>
                    </button>
                  );
                })}
              </div>
              {selectedCategories.length === 0 && (
                <p className="text-[10px] text-amber-600 mt-1">
                  * Vui lòng nhấp chọn các nhóm sản phẩm bạn sẽ kinh doanh trên sàn.
                </p>
              )}
            </div>

            <Input
              label="Mô tả tóm tắt kinh nghiệm & cam kết sản phẩm *"
              required
              placeholder="VD: Gian hàng chuyên phân phối phụ kiện công nghệ chính hãng, bảo hành 1 đổi 1..."
              value={shopDescription}
              onChange={(e) => setShopDescription(e.target.value)}
            />
          </div>

          {/* STEP 3: YÊU CẦU DÀNH RIÊNG CHO HỘ KINH DOANH (HIỂN THỊ KHI CHỌN HOUSEHOLD) */}
          {businessType === 'HOUSEHOLD' && (
            <div className="space-y-4 p-5 rounded-2xl bg-purple-50/50 border border-purple-200">
              <div className="flex items-center gap-2 pb-2 border-b border-purple-200">
                <FileCheck className="w-4 h-4 text-purple-700" />
                <h3 className="text-xs font-bold text-purple-900 uppercase tracking-wider">
                  3. Yêu Cầu Pháp Lý Mở Hộ Kinh Doanh (Nghị định 01/2021/NĐ-CP) *
                </h3>
              </div>

              <p className="text-[11px] text-purple-800 leading-relaxed">
                Theo quy định của Nhà nước về điều kiện kinh doanh TMĐT của Hộ kinh doanh, bạn cần cung cấp đầy đủ thông tin trên Giấy chứng nhận đăng ký hộ kinh doanh do Phòng Tài chính - Kế hoạch UBND cấp Quận/Huyện cấp.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tên Hộ kinh doanh (Theo Giấy chứng nhận ĐKHKD) *"
                  required
                  placeholder="VD: Hộ kinh doanh TechZone Store"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                />

                <div>
                  <Input
                    label="Mã số thuế Hộ kinh doanh (10 số) *"
                    required
                    maxLength={13}
                    placeholder="VD: 0315892104"
                    value={taxCode}
                    onChange={(e) => setTaxCode(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Mã số thuế 10 số cấp bởi Cơ quan Thuế quản lý
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Số Giấy chứng nhận ĐKHKD *"
                  required
                  placeholder="VD: 41A8012345"
                  value={businessLicenseNumber}
                  onChange={(e) => setBusinessLicenseNumber(e.target.value)}
                />

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Ngày cấp Giấy phép *
                  </label>
                  <input
                    type="date"
                    required
                    value={businessRegistrationDate}
                    onChange={(e) => setBusinessRegistrationDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-100 outline-none bg-white"
                  />
                </div>

                <Input
                  label="Cơ quan cấp Giấy phép *"
                  required
                  placeholder="VD: UBND Quận 1, TP. Hồ Chí Minh"
                  value={businessRegistrationPlace}
                  onChange={(e) => setBusinessRegistrationPlace(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Ngành nghề đăng ký kinh doanh chính *"
                  required
                  placeholder="VD: 4741 - Bán lẻ máy vi tính, linh kiện thiết bị số"
                  value={businessSectorCode}
                  onChange={(e) => setBusinessSectorCode(e.target.value)}
                />

                <Input
                  label="Địa chỉ trụ sở Hộ kinh doanh (Theo giấy phép) *"
                  required
                  placeholder="VD: 123 Nguyễn Thị Minh Khai, Phường 6, Quận 3, TP.HCM"
                  value={headquarterAddress}
                  onChange={(e) => setHeadquarterAddress(e.target.value)}
                />
              </div>

              {/* Tải lên Giấy chứng nhận Đăng ký Hộ Kinh Doanh */}
              <div className="pt-2">
                <label className="text-xs font-bold text-purple-950 block mb-1">
                  Ảnh chụp Giấy chứng nhận Đăng ký Hộ Kinh Doanh (Bản gốc có mộc đỏ) *
                </label>
                <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-purple-300 text-center space-y-2.5">
                  {businessLicenseImage ? (
                    <div className="space-y-2">
                      <img
                        src={businessLicenseImage}
                        alt="Giấy phép ĐKKD"
                        className="max-h-48 mx-auto rounded-xl object-contain border border-slate-200 shadow-xs"
                      />
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBusinessLicenseImage('')}
                          className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa và chọn ảnh khác</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <FileText className="w-10 h-10 text-purple-400 mx-auto" />
                      <p className="text-xs text-slate-600 font-medium">
                        Kéo thả file hoặc bấm nút bên dưới để tải ảnh chụp Giấy chứng nhận ĐKHKD
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Chấp nhận định dạng JPG, PNG, WEBP (tối đa 8MB). Bản chụp phải rõ nét và thấy rõ con dấu đỏ.
                      </p>
                      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                        <label className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Chọn file ảnh từ thiết bị</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, setBusinessLicenseImage)}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  <input
                    type="text"
                    value={businessLicenseImage}
                    onChange={(e) => setBusinessLicenseImage(e.target.value)}
                    placeholder="Hoặc dán trực tiếp đường dẫn URL ảnh Giấy phép..."
                    className="w-full text-[11px] px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 (PHỤ): NẾU CHỌN DOANH NGHIỆP */}
          {businessType === 'ENTERPRISE' && (
            <div className="space-y-4 p-5 rounded-2xl bg-indigo-50/50 border border-indigo-200">
              <div className="flex items-center gap-2 pb-2 border-b border-indigo-200">
                <Building className="w-4 h-4 text-indigo-700" />
                <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  3. Thông Tin Doanh Nghiệp & Giấy Phép ĐKKD *
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Tên Doanh nghiệp / Công ty theo Giấy phép ĐKKD *"
                  required
                  placeholder="VD: CÔNG TY TNHH CÔNG NGHỆ TECHZONE"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />

                <Input
                  label="Mã số thuế Doanh nghiệp (10 số) *"
                  required
                  maxLength={13}
                  placeholder="VD: 0315892104"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Số Giấy chứng nhận ĐKDN *"
                  required
                  placeholder="VD: 0315892104"
                  value={businessLicenseNumber}
                  onChange={(e) => setBusinessLicenseNumber(e.target.value)}
                />

                <Input
                  label="Địa chỉ trụ sở chính Doanh nghiệp *"
                  required
                  placeholder="VD: Tòa nhà TechTower, Số 12 Lê Duẩn, Quận 1, TP.HCM"
                  value={headquarterAddress}
                  onChange={(e) => setHeadquarterAddress(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-bold text-indigo-950 block mb-1">
                  Ảnh Giấy chứng nhận Đăng ký Doanh nghiệp (GPKD) *
                </label>
                <div className="p-4 bg-white rounded-2xl border-2 border-dashed border-indigo-300 text-center space-y-2">
                  {businessLicenseImage ? (
                    <img
                      src={businessLicenseImage}
                      alt="GPKD Doanh Nghiệp"
                      className="max-h-40 mx-auto rounded-xl object-contain border border-slate-200 shadow-xs"
                    />
                  ) : (
                    <div className="py-2">
                      <label className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải file ảnh Giấy phép ĐKDN</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setBusinessLicenseImage)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                  <input
                    type="text"
                    value={businessLicenseImage}
                    onChange={(e) => setBusinessLicenseImage(e.target.value)}
                    placeholder="Hoặc dán URL ảnh Giấy phép ĐKDN..."
                    className="w-full text-[11px] px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ĐỊNH DANH ĐẠI DIỆN PHÁP LUẬT (CCCD & MÃ SỐ THUẾ CÁ NHÂN NẾU LÀ CÁ NHÂN) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <UserCheck className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                {businessType === 'HOUSEHOLD'
                  ? '4. Thông Tin Chủ Hộ Kinh Doanh (Người Đại Diện Theo Pháp Luật) *'
                  : businessType === 'ENTERPRISE'
                  ? '4. Thông Tin Người Đại Diện Theo Pháp Luật (CCCD) *'
                  : '3. Thông Tin Định Danh Cá Nhân Kinh Doanh (CCCD & Mã Số Thuế) *'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Họ và tên người đại diện (Theo đúng trên CCCD) *"
                required
                placeholder="Nhập họ và tên có dấu hoặc không dấu (VD: NGUYEN VAN AN)"
                value={ownerFullName}
                onChange={(e) => setOwnerFullName(e.target.value.toUpperCase())}
              />

              <Input
                label="Số Căn Cước Công Dân gắn chip (Đúng 12 chữ số) *"
                required
                maxLength={12}
                placeholder="Nhập 12 số CCCD gắn chip (VD: 079094001234)"
                value={idCardNumber}
                onChange={(e) => setIdCardNumber(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Ngày cấp CCCD *
                </label>
                <input
                  type="date"
                  required
                  value={idCardIssueDate}
                  onChange={(e) => setIdCardIssueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-100 outline-none bg-white"
                />
              </div>

              <Input
                label="Nơi cấp CCCD *"
                required
                placeholder="VD: Cục Cảnh sát QLHC về TTXH"
                value={idCardIssuePlace}
                onChange={(e) => setIdCardIssuePlace(e.target.value)}
              />

              <div>
                <Input
                  label="Mã số thuế (MST) *"
                  required
                  maxLength={13}
                  placeholder="Nhập 10 hoặc 13 số thuế"
                  value={taxCode}
                  onChange={(e) => setTaxCode(e.target.value.replace(/[^0-9]/g, ''))}
                />
                <span className="text-[10px] text-slate-400 block mt-0.5">
                  Bắt buộc theo NĐ 91/2022/NĐ-CP
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email chính thức nhận thông báo thuế & pháp lý *"
                type="email"
                required
                placeholder="Nhập địa chỉ email (VD: shop@domain.com)"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
              />

              <Input
                label="Số điện thoại cá nhân người đại diện *"
                required
                placeholder="Nhập số điện thoại (VD: 0987654321)"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>
          </div>

          {/* STEP 5: TÀI LIỆU XÁC MINH DANH TÍNH (CCCD 2 MẶT & CHÂN DUNG) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-purple-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  5. Cung Cấp Ảnh Chụp Căn Cước Công Dân (CCCD 2 Mặt) *
                </h3>
              </div>
              <button
                type="button"
                onClick={handleUseSamplePhotos}
                className="text-[11px] text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 cursor-pointer"
                title="Dành cho kiểm thử giao diện nhanh"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>[Dùng ảnh mẫu test]</span>
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-[11px] flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                <strong>Yêu cầu ảnh chụp CCCD:</strong> Ảnh bản gốc chụp trực tiếp, đủ 4 góc, không lóa sáng, không cắt xén, nhìn rõ mặt, quốc huy, số thẻ và chip điện tử.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* MẶT TRƯỚC CCCD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    1. Mặt trước CCCD gắn chip *
                  </label>
                  {idCardFrontImage && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Đã có ảnh
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-2">
                  {idCardFrontImage ? (
                    <div className="relative group">
                      <img
                        src={idCardFrontImage}
                        alt="CCCD Mặt trước"
                        className="w-full h-28 rounded-xl object-cover border border-slate-300 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setIdCardFrontImage('')}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-3 space-y-2">
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-[11px] text-slate-500 font-medium">Chưa có ảnh mặt trước</p>
                      <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh mặt trước</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setIdCardFrontImage)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  <input
                    type="text"
                    value={idCardFrontImage}
                    onChange={(e) => setIdCardFrontImage(e.target.value)}
                    placeholder="Hoặc dán URL ảnh mặt trước..."
                    className="w-full text-[10px] px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* MẶT SAU CCCD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    2. Mặt sau CCCD gắn chip *
                  </label>
                  {idCardBackImage && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Đã có ảnh
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-2">
                  {idCardBackImage ? (
                    <div className="relative group">
                      <img
                        src={idCardBackImage}
                        alt="CCCD Mặt sau"
                        className="w-full h-28 rounded-xl object-cover border border-slate-300 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setIdCardBackImage('')}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-3 space-y-2">
                      <ImageIcon className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-[11px] text-slate-500 font-medium">Chưa có ảnh mặt sau</p>
                      <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh mặt sau</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setIdCardBackImage)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  <input
                    type="text"
                    value={idCardBackImage}
                    onChange={(e) => setIdCardBackImage(e.target.value)}
                    placeholder="Hoặc dán URL ảnh mặt sau..."
                    className="w-full text-[10px] px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* CHÂN DUNG CẦM CCCD */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 block">
                    3. Ảnh chân dung cầm CCCD
                  </label>
                  {selfieWithIdImage && (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Đã có ảnh
                    </span>
                  )}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 text-center space-y-2">
                  {selfieWithIdImage ? (
                    <div className="relative group">
                      <img
                        src={selfieWithIdImage}
                        alt="Chân dung cầm CCCD"
                        className="w-full h-28 rounded-xl object-cover border border-slate-300 shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setSelfieWithIdImage('')}
                        className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-black/60 text-white hover:bg-rose-600 transition-colors"
                        title="Xóa ảnh"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="py-3 space-y-2">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                      <p className="text-[11px] text-slate-500 font-medium">Chân dung xác minh</p>
                      <label className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Tải ảnh chân dung</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileChange(e, setSelfieWithIdImage)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  <input
                    type="text"
                    value={selfieWithIdImage}
                    onChange={(e) => setSelfieWithIdImage(e.target.value)}
                    placeholder="Hoặc dán URL ảnh chân dung..."
                    className="w-full text-[10px] px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 6: ĐỊA CHỈ KHO LẤY HÀNG (LOGISTICS) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                6. Địa Chỉ Kho Lấy Hàng & Gửi Trả Hàng (Chuẩn Logistics) *
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700 block">Tỉnh / Thành phố *</label>
                <input
                  type="text"
                  required
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="VD: TP. Hồ Chí Minh, Hà Nội..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700 block">Quận / Huyện *</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="VD: Quận 1, Quận Cầu Giấy..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>

              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700 block">Phường / Xã *</label>
                <input
                  type="text"
                  required
                  value={ward}
                  onChange={(e) => setWard(e.target.value)}
                  placeholder="VD: Phường Bến Nghé, Phường Dịch Vọng..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-100 outline-none"
                />
              </div>
            </div>

            <Input
              label="Số nhà, Tên đường (Địa chỉ cụ thể để bưu tá đến lấy bưu kiện) *"
              required
              placeholder="VD: Số 12 Lê Duẩn, Tòa nhà TechTower..."
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
            />
          </div>

          {/* STEP 7: TÀI KHOẢN NGÂN HÀNG THỤ HƯỞNG */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-purple-600" />
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                7. Tài Khoản Ngân Hàng Nhận Tiền Bán Hàng (VietQR Quyết Toán) *
              </h3>
            </div>

            {/* Quy tắc bảo mật */}
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                <strong>Quy định bảo mật tài chính bắt buộc:</strong> Tên chủ tài khoản ngân hàng thụ hưởng phải{' '}
                <strong>trùng khớp 100%</strong> với Họ tên người đại diện trên CCCD / Giấy phép Hộ kinh doanh để đảm bảo quyền lợi và quyết toán doanh thu an toàn.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 text-xs">
                <label className="font-semibold text-slate-700 block">Ngân hàng thụ hưởng *</label>
                <select
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-100 outline-none bg-white"
                >
                  <option value="">-- Chọn ngân hàng --</option>
                  <option value="Vietcombank">Vietcombank (Ngoại Thương)</option>
                  <option value="MBBank">MBBank (Quân Đội)</option>
                  <option value="Techcombank">Techcombank (Kỹ Thương)</option>
                  <option value="ACB">ACB (Á Châu)</option>
                  <option value="VPBank">VPBank (Việt Nam Thịnh Vượng)</option>
                  <option value="TPBank">TPBank (Tiên Phong)</option>
                  <option value="VietinBank">VietinBank (Công Thương)</option>
                  <option value="BIDV">BIDV (Đầu Tư & Phát Triển)</option>
                  <option value="Sacombank">Sacombank (Sài Gòn Thương Tín)</option>
                  <option value="HDBank">HDBank</option>
                  <option value="OCB">OCB (Phương Đông)</option>
                  <option value="VIB">VIB (Quốc Tế)</option>
                </select>
              </div>

              <Input
                label="Số tài khoản ngân hàng *"
                required
                placeholder="Nhập số tài khoản ngân hàng"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tên chủ tài khoản (Khóa theo CCCD) *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={ownerFullName || '(Nhập họ tên tại mục CCCD)'}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 text-xs font-bold font-mono outline-none cursor-not-allowed"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <Input
              label="Chi nhánh ngân hàng"
              placeholder="VD: Chi nhánh TP. Hồ Chí Minh, Chi nhánh Hoàn Kiếm..."
              value={bankBranch}
              onChange={(e) => setBankBranch(e.target.value)}
            />
          </div>

          {/* STEP 8: CAM KẾT VÀ ĐIỀU KHOẢN PHÁP LÝ */}
          <div className="space-y-3 pt-2">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Cam Kết Tuân Thủ Pháp Luật & Nghĩa Vụ Thuế Thương Mại Điện Tử</span>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 mt-0.5"
                />
                <span className="text-[11px] leading-relaxed">
                  Tôi cam đoan toàn bộ thông tin đăng ký gian hàng, Căn Cước Công Dân 2 mặt và tài liệu Hộ kinh doanh cung cấp là chính xác, trung thực và hoàn toàn chịu trách nhiệm trước pháp luật Việt Nam.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedQuality}
                  onChange={(e) => setAgreedQuality(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 mt-0.5"
                />
                <span className="text-[11px] leading-relaxed">
                  Tôi cam kết 100% sản phẩm, tài khoản game, bản quyền AI và thiết bị công nghệ bán ra có xuất xứ rõ ràng, không kinh doanh hàng giả/nhái, hàng lậu hoặc vi phạm bản quyền.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedTaxCompliance}
                  onChange={(e) => setAgreedTaxCompliance(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500 mt-0.5"
                />
                <span className="text-[11px] leading-relaxed">
                  Tôi cam kết thực hiện đầy đủ nghĩa vụ kê khai thuế và nộp thuế theo đúng quy định tại Thông tư 40/2021/TT-BTC và Nghị định 91/2022/NĐ-CP của Chính phủ.
                </span>
              </label>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onBack} className="cursor-pointer">
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold cursor-pointer px-6 shadow-md shadow-purple-600/20"
            >
              {isSubmitting ? 'Đang gửi hồ sơ thẩm định...' : 'Nộp Hồ Sơ Mở Gian Hàng'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
