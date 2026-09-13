import { z } from 'zod';

// ==========================================
// 1. AUTH SCHEMAS
// ==========================================

export const loginSchema = z.object({
  email: z.string().email('Email không đúng định dạng'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên ít nhất 2 ký tự'),
  email: z.string().email('Email không đúng định dạng'),
  phoneNumber: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ (Việt Nam)'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Mật khẩu xác nhận không khớp',
  path: ['confirmPassword'],
});

export type RegisterInput = z.infer<typeof registerSchema>;

// ==========================================
// 2. ADDRESS SCHEMAS (Section 24)
// ==========================================

export const addressSchema = z.object({
  recipientName: z.string().min(2, 'Vui lòng nhập tên người nhận'),
  phoneNumber: z.string().regex(/(84|0[3|5|7|8|9])+([0-9]{8})\b/, 'Số điện thoại không hợp lệ'),
  province: z.string().min(1, 'Vui lòng chọn Tỉnh/Thành phố'),
  district: z.string().min(1, 'Vui lòng chọn Quận/Huyện'),
  ward: z.string().min(1, 'Vui lòng chọn Phường/Xã'),
  streetAddress: z.string().min(5, 'Vui lòng nhập số nhà, tên đường chi tiết'),
  label: z.enum(['HOME', 'OFFICE', 'OTHER']),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ==========================================
// 3. PRODUCT SCHEMAS (Section 45, 46)
// ==========================================

export const productVariantSchema = z.object({
  name: z.string().min(1, 'Tên biến thể bắt buộc'),
  sku: z.string().min(1, 'Mã SKU bắt buộc'),
  price: z.number().min(0, 'Giá không được âm'),
  compareAtPrice: z.number().optional(),
  stock: z.number().min(0, 'Số lượng kho không được âm'),
  options: z.record(z.string()),
});

export const productSpecificationSchema = z.object({
  group: z.string(),
  key: z.string(),
  label: z.string(),
  value: z.string(),
});

export const productFormSchema = z.object({
  name: z.string().min(5, 'Tên sản phẩm phải có ít nhất 5 ký tự'),
  description: z.string().min(20, 'Mô tả sản phẩm phải có ít nhất 20 ký tự'),
  categoryId: z.string().min(1, 'Vui lòng chọn danh mục'),
  brandId: z.string().optional(),
  basePrice: z.number().min(1000, 'Giá tối thiểu là 1.000 ₫'),
  compareAtPrice: z.number().optional(),
  thumbnail: z.string().url('URL ảnh đại diện không hợp lệ'),
  images: z.array(z.string().url()).min(1, 'Cần ít nhất 1 hình ảnh sản phẩm'),
  variants: z.array(productVariantSchema).min(1, 'Cần ít nhất 1 biến thể sản phẩm'),
  specifications: z.array(productSpecificationSchema),
  warrantyDurationMonths: z.number().min(0),
  warrantyType: z.enum(['CHINH_HANH', 'CUA_HANG', 'QUOC_TE']),
  warrantyPolicy: z.string().optional(),
  requiresSerial: z.boolean().default(true),
});

export type ProductFormInput = z.infer<typeof productFormSchema>;

// ==========================================
// 4. SELLER REGISTRATION SCHEMA (Section 41)
// ==========================================

export const sellerRegistrationSchema = z.object({
  shopName: z.string().min(3, 'Tên gian hàng tối thiểu 3 ký tự'),
  ownerFullName: z.string().min(2, 'Họ tên chủ gian hàng tối thiểu 2 ký tự'),
  idCardNumber: z.string().regex(/^[0-9]{9,12}$/, 'Số CCCD/CMND phải gồm 9-12 chữ số'),
  bankName: z.string().min(1, 'Vui lòng chọn ngân hàng nhận tiền'),
  bankAccountNumber: z.string().min(6, 'Số tài khoản ngân hàng không hợp lệ'),
  bankAccountHolder: z.string().min(2, 'Tên chủ tài khoản không được để trống'),
  pickupAddress: z.string().min(10, 'Địa chỉ lấy hàng phải cụ thể chi tiết'),
  shopDescription: z.string().min(10, 'Mô tả gian hàng tối thiểu 10 ký tự'),
});

export type SellerRegistrationInput = z.infer<typeof sellerRegistrationSchema>;

// ==========================================
// 5. PAYOUT SCHEMA (Section 52)
// ==========================================

export const payoutRequestSchema = z.object({
  amount: z.number().min(100000, 'Số tiền rút tối thiểu là 100.000 ₫'),
  bankName: z.string().min(1, 'Vui lòng chọn ngân hàng'),
  accountNumber: z.string().min(6, 'Số tài khoản ngân hàng không hợp lệ'),
  accountHolder: z.string().min(2, 'Tên chủ tài khoản không hợp lệ'),
});

export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;

// ==========================================
// 6. RETURN & WARRANTY CLAIM SCHEMAS
// ==========================================

export const returnRequestSchema = z.object({
  orderId: z.string().min(1),
  orderItemId: z.string().min(1),
  reason: z.string().min(5, 'Vui lòng chọn hoặc nêu rõ lý do đổi/trả'),
  description: z.string().min(10, 'Mô tả chi tiết tình trạng sản phẩm lỗi'),
  evidenceImages: z.array(z.string().url()).min(1, 'Cần đính kèm ít nhất 1 ảnh bằng chứng'),
});

export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;

export const warrantyClaimSchema = z.object({
  warrantyId: z.string().min(1),
  serialNumber: z.string().optional(),
  issueDescription: z.string().min(10, 'Mô tả lỗi sản phẩm gặp phải'),
  evidenceImages: z.array(z.string().url()).min(1, 'Đính kèm ảnh sản phẩm/tem bảo hành'),
});

export type WarrantyClaimInput = z.infer<typeof warrantyClaimSchema>;

// ==========================================
// 7. DIGITAL GAME ACCOUNT SCHEMAS
// ==========================================

export const gameAccountProductSchema = z.object({
  name: z.string().min(10, 'Tiêu đề listing từ 10 đến 120 ký tự').max(120, 'Tiêu đề tối đa 120 ký tự'),
  description: z.string().min(20, 'Mô tả listing từ 20 ký tự').max(5000, 'Mô tả tối đa 5.000 ký tự'),
  gameId: z.string().min(1, 'Vui lòng chọn game'),
  platform: z.enum(['PC', 'MOBILE', 'PLAYSTATION', 'XBOX', 'NINTENDO_SWITCH', 'CROSS_PLATFORM']),
  server: z.string().min(1, 'Vui lòng chọn hoặc nhập máy chủ'),
  loginMethod: z.enum(['USERNAME', 'EMAIL', 'PHONE', 'SOCIAL', 'OTHER']),
  basePrice: z.number().min(1000, 'Giá bán tối thiểu 1.000 ₫'),
  compareAtPrice: z.number().optional(),
  thumbnail: z.string().min(1, 'Vui lòng cung cấp ảnh đại diện'),
  images: z.array(z.string()).min(1, 'Cần ít nhất 1 ảnh bằng chứng thông tin tài khoản'),
  warrantyHours: z.number().min(0, 'Thời gian bảo hành không hợp lệ'),
  deliveryMode: z.enum(['AUTO_AFTER_PAYMENT', 'SELLER_CONFIRMATION']),
  deliveryEstimateMinutes: z.number().optional(),
  canChangePassword: z.boolean().default(true),
  canChangeEmail: z.boolean().default(false),
  canChangePhone: z.boolean().default(false),
  canRemoveLinkedServices: z.boolean().default(false),
  publicAttributes: z.record(z.any()).default({}),
  sellerCommitments: z.array(z.string()).default([]),
  legalOwnershipAgreed: z.boolean().refine((val) => val === true, 'Bạn phải xác nhận quyền sở hữu hợp pháp'),
  noViolationAgreed: z.boolean().refine((val) => val === true, 'Bạn phải cam kết không vi phạm chính sách'),
});

export type GameAccountProductInput = z.infer<typeof gameAccountProductSchema>;

export const gameAccountInventoryItemSchema = z.object({
  productId: z.string().min(1, 'Vui lòng chọn sản phẩm'),
  internalCode: z.string().optional(),
  login: z.string().min(1, 'Tài khoản/Email đăng nhập bắt buộc'),
  password: z.string().min(1, 'Mật khẩu bắt buộc'),
  recoveryEmail: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),
  recoveryCode: z.string().optional(),
  twoFactorSecret: z.string().optional(),
  privateNote: z.string().optional(),
});

export type GameAccountInventoryItemInput = z.infer<typeof gameAccountInventoryItemSchema>;

export const reportAccountIssueSchema = z.object({
  orderId: z.string().min(1),
  issueType: z.enum([
    'CANNOT_LOGIN',
    'WRONG_CREDENTIALS',
    'ACCOUNT_NOT_AS_DESCRIBED',
    'ACCOUNT_RECOVERED_BY_PREVIOUS_OWNER',
    'MISSING_RECOVERY_INFORMATION',
    'ACCOUNT_BANNED_OR_RESTRICTED',
    'OTHER',
  ]),
  description: z.string().min(10, 'Vui lòng mô tả chi tiết sự cố ít nhất 10 ký tự'),
  evidenceImages: z.array(z.string()).min(1, 'Cần ít nhất 1 ảnh bằng chứng'),
  desiredSolution: z.enum(['SUPPORT', 'REPLACEMENT', 'REFUND']),
  privacyConfirmed: z.boolean().refine((val) => val === true, 'Bạn phải xác nhận không chia sẻ mật khẩu trong ảnh mô tả'),
});

export type ReportAccountIssueInput = z.infer<typeof reportAccountIssueSchema>;

// ==========================================
// 8. APP ACCOUNT SCHEMAS (SPEC SECTION 30-44)
// ==========================================

export const durationSchema = z.object({
  value: z.number().int().min(1, 'Thời gian phải lớn hơn hoặc bằng 1'),
  unit: z.enum(['DAY', 'MONTH', 'YEAR']),
});

export type DurationInput = z.infer<typeof durationSchema>;

export const buyerFieldDefinitionSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(['TEXT', 'EMAIL', 'SELECT', 'BOOLEAN']),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().default(true),
  sensitive: z.boolean().default(false),
}).refine((field) => {
  const lbl = field.label.toLowerCase();
  const ky = field.key.toLowerCase();
  return !lbl.includes('mật khẩu') && !lbl.includes('password') && !lbl.includes('otp') && !ky.includes('password') && !ky.includes('otp');
}, {
  message: 'Tuyệt đối không được tạo trường yêu cầu mật khẩu hoặc mã OTP của khách hàng',
  path: ['label'],
});

export const appAccountPlanSchema = z.object({
  name: z.string().min(2, 'Tên gói ít nhất 2 ký tự'),
  sku: z.string().min(2, 'Mã SKU ít nhất 2 ký tự'),
  price: z.number().min(1000, 'Giá tối thiểu 1.000đ'),
  compareAtPrice: z.number().optional(),
  benefits: z.array(z.string()).default([]),
  platforms: z.array(z.enum(['WEB', 'WINDOWS', 'MACOS', 'ANDROID', 'IOS'])).min(1, 'Chọn ít nhất 1 nền tảng'),
  duration: durationSchema,
  warranty: durationSchema,
  fulfillmentType: z.enum([
    'PRE_CREATED_ACCOUNT',
    'BUYER_EMAIL_ACTIVATION',
    'FAMILY_OR_TEAM_INVITATION',
    'LICENSE_KEY',
    'MANUAL_SERVICE',
  ]),
  deliveryEstimateMinutes: z.number().optional(),
  availableStock: z.number().int().min(0).default(1),
  purchaseLimit: z.number().int().min(1).optional(),
  requiredBuyerFields: z.array(buyerFieldDefinitionSchema).default([]),
  publicAttributes: z.record(z.any()).default({}),
  status: z.enum(['ACTIVE', 'INACTIVE', 'OUT_OF_STOCK']).default('ACTIVE'),
});

export type AppAccountPlanInput = z.infer<typeof appAccountPlanSchema>;

export const appAccountProductSchema = z.object({
  applicationId: z.string().min(1, 'Vui lòng chọn ứng dụng'),
  name: z.string().min(3, 'Tên sản phẩm ít nhất 3 ký tự'),
  description: z.string().min(10, 'Mô tả ít nhất 10 ký tự'),
  plans: z.array(appAccountPlanSchema).min(1, 'Cần ít nhất 1 gói dịch vụ'),
  usageInstructions: z.array(z.string()).default([]),
  generalWarnings: z.array(z.string()).default([]),
  sellerCommitments: z.array(z.string()).default([]),
  termsAgreed: z.boolean().refine((val) => val === true, 'Bạn phải đồng ý với cam kết quyền phân phối và bảo hành'),
});

export type AppAccountProductInput = z.infer<typeof appAccountProductSchema>;

export const createAppAccountInventoryItemSchema = z.object({
  productId: z.string().min(1),
  planId: z.string().min(1),
  internalCode: z.string().optional(),
  itemType: z.enum(['ACCOUNT', 'LICENSE_KEY']),
  login: z.string().optional(),
  password: z.string().optional(),
  licenseKey: z.string().optional(),
  recoveryEmail: z.string().optional(),
  recoveryCode: z.string().optional(),
  privateNote: z.string().optional(),
});

export type CreateAppAccountInventoryItemInputType = z.infer<typeof createAppAccountInventoryItemSchema>;


