import React, { useState, useEffect } from 'react';
import type {
  AppAccountProduct,
  AppAccountPlan,
  ApplicationSummary,
  AppAccountFulfillmentType,
  ApplicationCategory,
  ApplicationPlatform,
  BuyerFieldDefinition,
  ServiceDuration,
  WarrantyDuration,
} from '@marketplace/types';
import { appAccountApi, sellerApi, appInventoryApi } from '@marketplace/api-client';
import {
  ServiceDurationInput,
  WarrantyDurationInput,
} from '@marketplace/ui';
import {
  Sparkles,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Key,
  ArrowLeft,
  Save,
  Clock,
  ShieldCheck,
  FileText,
  Upload,
  Copy,
  Eye,
  Info,
  Users,
  Mail,
  Lock,
  ExternalLink,
  Check,
  FileCode,
  Zap,
  Globe,
  Edit,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  AlertCircle,
  X,
  Settings,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

// Smart Image URL Sanitizer & Extractor (Handles Bing/Google search URLs)
export function sanitizeImageUrl(raw: string): string {
  if (!raw) return '';
  let url = raw.trim();

  try {
    // 1. Bing Image search URLs: e.g. https://www.bing.com/images/search?view=detailV2&...&mediaurl=https%3A%2F%2F...
    if (url.includes('bing.com/images/search') || url.includes('bing.com/images/detail')) {
      const parsed = new URL(url);
      const mediaurl = parsed.searchParams.get('mediaurl');
      if (mediaurl) return decodeURIComponent(mediaurl);
    }

    // 2. Google Image search URLs: e.g. https://www.google.com/imgres?imgurl=https%3A%2F%2F...
    if (url.includes('google.com/imgres') || url.includes('google.com/search')) {
      const parsed = new URL(url);
      const imgurl = parsed.searchParams.get('imgurl');
      if (imgurl) return decodeURIComponent(imgurl);
    }

    // 3. Generic query params that carry direct image URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const parsed = new URL(url);
      for (const param of ['mediaurl', 'imgurl', 'src', 'url', 'target']) {
        const val = parsed.searchParams.get(param);
        if (
          val &&
          (val.startsWith('http://') || val.startsWith('https://')) &&
          (val.match(/\.(jpeg|jpg|gif|png|webp|svg|bmp)(\?.*)?$/i) ||
            val.includes('unsplash.com') ||
            val.includes('cloudinary.com') ||
            val.includes('imgur.com'))
        ) {
          return decodeURIComponent(val);
        }
      }
    }
  } catch (err) {
    // Return raw trimmed if URL parsing fails
  }

  return url;
}

// Robust App Icon Image with fallback
export const AppIconImage: React.FC<{
  src?: string;
  alt?: string;
  className?: string;
}> = ({
  src,
  alt = 'App',
  className = 'w-7 h-7 rounded-lg object-contain bg-white p-0.5 border border-slate-100 flex-shrink-0',
}) => {
  const [error, setError] = useState(false);

  // If invalid bing search link without mediaurl, treat as error directly
  const isSearchPageUrl =
    src &&
    (src.includes('bing.com/images/search') ||
      src.includes('google.com/imgres') ||
      src.includes('bing.com/images/detail'));

  if (!src || error || isSearchPageUrl) {
    return (
      <div
        className={`${className} bg-emerald-50 text-emerald-800 font-extrabold flex items-center justify-center text-xs uppercase select-none border border-emerald-200`}
      >
        {alt.charAt(0) || 'A'}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={className}
    />
  );
};

export interface SellerAppAccountProductFormViewProps {
  initialProduct?: AppAccountProduct | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const CATEGORIES: { value: ApplicationCategory; label: string }[] = [
  { value: 'AI', label: 'Trợ lý AI & Mô hình ngôn ngữ' },
  { value: 'DESIGN', label: 'Thiết kế đồ họa & Video' },
  { value: 'OFFICE', label: 'Văn phòng & Công việc' },
  { value: 'ENTERTAINMENT', label: 'Giải trí & Phim/Nhạc' },
  { value: 'EDUCATION', label: 'Học tập & Giáo dục' },
  { value: 'DEV_TOOLS', label: 'Lập trình & Dev Tools' },
  { value: 'SECURITY', label: 'VPN & Bảo mật mạng' },
  { value: 'CLOUD_STORAGE', label: 'Lưu trữ đám mây Cloud' },
];

const PLATFORMS: { value: ApplicationPlatform; label: string }[] = [
  { value: 'WEB', label: 'Trình duyệt Web' },
  { value: 'WINDOWS', label: 'Windows PC' },
  { value: 'MAC', label: 'macOS' },
  { value: 'ANDROID', label: 'Android' },
  { value: 'IOS', label: 'iOS / iPadOS' },
  { value: 'LINUX', label: 'Linux' },
];

const FULFILLMENT_TYPES: { value: AppAccountFulfillmentType; label: string; desc: string }[] = [
  {
    value: 'PRE_CREATED_ACCOUNT',
    label: 'Tài khoản cấp sẵn (Vault) - Bàn giao tự động',
    desc: 'Người bán nhập kho sẵn tài khoản (user|pass|file/text). Khách mua thanh toán xong nhận ngay.',
  },
  {
    value: 'LICENSE_KEY',
    label: 'Mã bản quyền / License Key chính hãng',
    desc: 'Người bán nạp danh sách key bản quyền và link tải. Hệ thống cấp key tự động cho khách.',
  },
  {
    value: 'BUYER_EMAIL_ACTIVATION',
    label: 'Nâng cấp chính chủ vào Tài khoản / Email người mua',
    desc: 'Người mua cung cấp tài khoản & mật khẩu tạm thời. Shop đăng nhập nâng cấp trực tiếp.',
  },
  {
    value: 'FAMILY_OR_TEAM_INVITATION',
    label: 'Mời nhóm Family / Team (Chỉ cần Email)',
    desc: 'Người mua cung cấp Email cá nhân. Shop gửi lời mời gia nhập gói bản quyền gia đình/nhóm.',
  },
  {
    value: 'MANUAL_SERVICE',
    label: 'Dịch vụ xử lý thủ công (Custom Fields)',
    desc: 'Người bán tự cấu hình các trường thông tin cần thu thập từ khách hàng.',
  },
];

const APP_PRESETS = [
  {
    name: 'Claude AI (Anthropic)',
    category: 'AI' as ApplicationCategory,
    website: 'https://claude.ai',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    description: 'Trợ lý AI Claude 3.5 Sonnet đỉnh cao cho lập trình và phân tích dữ liệu.',
  },
  {
    name: 'Midjourney AI',
    category: 'DESIGN' as ApplicationCategory,
    website: 'https://midjourney.com',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    description: 'Công cụ vẽ tranh và tạo ảnh nghệ thuật AI hàng đầu thế giới.',
  },
  {
    name: 'Cursor IDE Pro',
    category: 'DEV_TOOLS' as ApplicationCategory,
    website: 'https://cursor.com',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    description: 'Trình soạn thảo mã nguồn tích hợp AI thông minh thế hệ mới.',
  },
  {
    name: 'Notion Plus & AI',
    category: 'OFFICE' as ApplicationCategory,
    website: 'https://notion.so',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    description: 'Không gian làm việc và ghi chú cộng tác tích hợp trợ lý AI.',
  },
  {
    name: 'CapCut Pro',
    category: 'DESIGN' as ApplicationCategory,
    website: 'https://capcut.com',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    description: 'Phần mềm chỉnh sửa video chuyên nghiệp không logo watermark.',
  },
  {
    name: 'Duolingo Super',
    category: 'EDUCATION' as ApplicationCategory,
    website: 'https://duolingo.com',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    description: 'Ứng dụng học ngoại ngữ số 1 thế giới không giới hạn trái tim.',
  },
  {
    name: 'Netflix Premium 4K',
    category: 'ENTERTAINMENT' as ApplicationCategory,
    website: 'https://netflix.com',
    logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
    description: 'Gói xem phim chất lượng Ultra HD 4K không quảng cáo.',
  },
];

// Full presets with rich descriptions, warranty, and multi-plans for catalog templates
const APP_RICH_DEFAULTS: Record<
  string,
  {
    defaultTitle: string;
    description: string;
    warrantyPolicy: string;
    plans: AppAccountPlan[];
  }
> = {
  chatgpt: {
    defaultTitle: 'Tài khoản ChatGPT Plus (GPT-4o) Chính Hãng Kèm DALL-E 3',
    description: '• Trợ lý AI ChatGPT Plus với mô hình GPT-4o, GPT-4o-mini và Canvas mới nhất.\n• Tích hợp tính năng phân tích dữ liệu chuyên sâu (Data Analysis) và tạo ảnh DALL-E 3 không giới hạn sáng tạo.\n• Không giới hạn tốc độ truy cập giờ cao điểm, lưu lịch sử trò chuyện đầy đủ.\n• Đăng nhập trực tiếp trên web, máy tính (Windows/macOS) và ứng dụng di động (iOS/Android).',
    warrantyPolicy: 'Bảo hành 1 đổi 1 trong suốt thời gian sử dụng hoặc hoàn tiền theo tỷ lệ ngày chưa dùng nếu lỗi phát sinh từ hệ thống.',
    plans: [
      {
        id: 'plan-cg-1m',
        name: 'Gói 1 Tháng (Tài khoản cấp sẵn dùng ngay)',
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        serviceDuration: { value: 1, unit: 'MONTH' },
        warrantyDuration: { value: 1, unit: 'MONTH' },
        price: 99000,
        originalPrice: 220000,
        features: ['Tài khoản cấp sẵn nhận ngay sau khi mua', 'Dùng trọn gói GPT-4o & Canvas', 'Bảo hành 1 đổi 1 trọn 30 ngày'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'chatgpt.user01@gmail.com|Xk9#mP2$qL5\nchatgpt.user02@gmail.com|vN8@zW4!kJ7',
        deliveryGuideMarkdown: '1. Truy cập https://chatgpt.com\n2. Đăng nhập bằng tài khoản và mật khẩu được cấp.\n3. Kiểm tra huy hiệu Plus góc trên bên trái màn hình.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
      {
        id: 'plan-cg-upgrade',
        name: 'Gói 1 Tháng (Kích hoạt chính chủ qua Email khách)',
        fulfillmentType: 'BUYER_EMAIL_ACTIVATION',
        serviceDuration: { value: 1, unit: 'MONTH' },
        warrantyDuration: { value: 1, unit: 'MONTH' },
        price: 179000,
        originalPrice: 350000,
        features: ['Kích hoạt trực tiếp trên email cá nhân của bạn', 'Lưu giữ toàn bộ đoạn chat cũ', 'An toàn dữ liệu tuyệt đối 100%'],
        deliveryGuideMarkdown: 'Shop sẽ gửi lời mời kích hoạt bản quyền Plus vào email của bạn trong vòng 15-30 phút sau khi thanh toán. Không cần cung cấp mật khẩu cá nhân!',
        requiredBuyerFields: [
          {
            key: 'buyer_email',
            label: 'Email tài khoản OpenAI cần nâng cấp (nhận link mời)',
            type: 'TEXT',
            required: true,
            placeholder: 'VD: yourname@gmail.com',
          },
        ],
        status: 'ACTIVE',
      },
    ],
  },
  'claude-ai': {
    defaultTitle: 'Tài khoản Claude AI Pro (Anthropic Claude 3.5 Sonnet)',
    description: '• Gói Claude Pro với mô hình Claude 3.5 Sonnet đỉnh cao về viết mã, tư duy logic và phân tích văn bản.\n• Giới hạn sử dụng cao gấp 5 lần so với gói miễn phí, hỗ trợ tính năng Projects & Artifacts tương tác trực tiếp.\n• Khả năng xử lý ngữ cảnh dài 200K tokens, phân tích tài liệu và file PDF phức tạp tức thì.',
    warrantyPolicy: 'Bảo hành 1 đổi 1 tài khoản mới nếu bị khóa tài khoản hoặc lỗi kỹ thuật do hệ thống.',
    plans: [
      {
        id: 'plan-cl-1m',
        name: 'Gói 1 Tháng Pro (Cấp sẵn)',
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        serviceDuration: { value: 1, unit: 'MONTH' },
        warrantyDuration: { value: 1, unit: 'MONTH' },
        price: 149000,
        originalPrice: 350000,
        features: ['Claude 3.5 Sonnet không giới hạn tốc độ', 'Tài khoản riêng tư độc quyền', 'Bảo hành 1 đổi 1 trọn 30 ngày'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'claude.pro01@gmail.com|SonnetPass@2026',
        deliveryGuideMarkdown: '1. Truy cập https://claude.ai\n2. Đăng nhập bằng tài khoản và mật khẩu được cung cấp.\n3. Bắt đầu làm việc với Claude 3.5 Sonnet.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
    ],
  },
  'google-gemini': {
    defaultTitle: 'Tài khoản Google Gemini Advanced (2TB Google One)',
    description: '• Mô hình Gemini 1.5 Pro với cửa sổ ngữ cảnh 1 triệu token, hiểu sâu văn bản dài và mã nguồn lớn.\n• Kèm theo 2TB dung lượng lưu trữ đám mây Google One (Google Drive, Gmail, Google Photos).\n• Tích hợp trực tiếp trợ lý AI vào Google Docs, Sheets, Slides, Gmail.',
    warrantyPolicy: 'Bảo hành 1 đổi 1 hoặc hoàn lại tiền tương ứng với thời gian còn lại.',
    plans: [
      {
        id: 'plan-gem-1m',
        name: 'Gói 1 Tháng Gemini Advanced (Cấp sẵn)',
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        serviceDuration: { value: 1, unit: 'MONTH' },
        warrantyDuration: { value: 1, unit: 'MONTH' },
        price: 89000,
        originalPrice: 250000,
        features: ['Gemini 1.5 Pro siêu tốc', 'Kèm 2TB Google Drive', 'Bảo hành 30 ngày'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'gemini.vip01@gmail.com|GeminiPass@2026',
        deliveryGuideMarkdown: '1. Truy cập https://gemini.google.com\n2. Đăng nhập Google Account được cấp.\n3. Trải nghiệm Gemini Advanced.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
    ],
  },
  'cursor-ide': {
    defaultTitle: 'Tài khoản Cursor IDE Pro Chính Hãng (AI Code Editor)',
    description: '• Trình soạn thảo mã nguồn tích hợp AI Cursor Pro hỗ trợ Claude 3.5 Sonnet & GPT-4o.\n• 500 fast requests/tháng và unlimited slow requests.\n• Tính năng Composer chỉnh sửa đa tệp, tự sinh mã, fix bug và review codebase thông minh.',
    warrantyPolicy: 'Bảo hành trọn vẹn thời gian gói cước. Hỗ trợ kỹ thuật 24/7.',
    plans: [
      {
        id: 'plan-cur-1m',
        name: 'Gói 1 Tháng Pro (Cấp sẵn nhận ngay)',
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        serviceDuration: { value: 1, unit: 'MONTH' },
        warrantyDuration: { value: 1, unit: 'MONTH' },
        price: 199000,
        originalPrice: 500000,
        features: ['500 Fast Claude 3.5 requests/tháng', 'Composer đa file cực mạnh', 'Bảo hành 30 ngày'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'cursor.dev01@gmail.com|CursorPass@2026',
        deliveryGuideMarkdown: '1. Mở ứng dụng Cursor IDE trên máy tính.\n2. Vào Settings -> Sign In -> Nhập thông tin tài khoản được cấp.\n3. Kiểm tra gói Pro đã kích hoạt trong phần Account.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
    ],
  },
  canva: {
    defaultTitle: 'Tài khoản Canva Pro Bản Quyền Không Giới Hạn Thiết Kế',
    description: '• Mở khóa kho tài nguyên 100+ triệu hình ảnh, video, âm thanh và đồ họa cao cấp.\n• Công cụ ma thuật Magic Resize, Xóa nền 1 click (Background Remover), Magic Eraser AI.\n• Lưu trữ đám mây 1TB và quản lý bộ nhận diện thương hiệu Brand Kit.',
    warrantyPolicy: 'Bảo hành 1 đổi 1 hoặc mời lại nhóm mới nếu xảy ra lỗi trong suốt thời gian đăng ký.',
    plans: [
      {
        id: 'plan-canva-1y',
        name: 'Gói 1 Năm - Mời Email cá nhân chính chủ',
        fulfillmentType: 'FAMILY_OR_TEAM_INVITATION',
        serviceDuration: { value: 1, unit: 'YEAR' },
        warrantyDuration: { value: 1, unit: 'YEAR' },
        price: 120000,
        originalPrice: 400000,
        features: ['Nâng cấp chính chủ email cá nhân', 'Không mất thiết kế cũ', 'Bảo hành trọn 12 tháng'],
        deliveryGuideMarkdown: '1. Shop gửi thư mời vào email của bạn.\n2. Mở hộp thư đến (hoặc Spam), bấm "Tham gia đội ngũ / Join Team".\n3. Đăng nhập Canva là có ngay bản quyền Pro.',
        requiredBuyerFields: [
          {
            key: 'canva_email',
            label: 'Email tài khoản Canva của bạn',
            type: 'TEXT',
            required: true,
            placeholder: 'VD: yourcanva@gmail.com',
          },
        ],
        status: 'ACTIVE',
      },
    ],
  },
  'microsoft-365': {
    defaultTitle: 'Tài khoản Microsoft 365 (Office 365) Bản Quyền + 1TB OneDrive',
    description: '• Bộ ứng dụng văn phòng đầy đủ bản quyền chính hãng: Word, Excel, PowerPoint, Outlook, OneNote.\n• Tặng kèm 1TB (1024GB) lưu trữ đám mây OneDrive tốc độ cao, đồng bộ dữ liệu an toàn.\n• Cài đặt đồng thời trên 5 thiết bị: Windows, macOS, iPhone, iPad, Android.',
    warrantyPolicy: 'Bảo hành trọn thời hạn gói cước, hỗ trợ kỹ thuật cài đặt từ xa qua Ultraview/Anydesk.',
    plans: [
      {
        id: 'plan-ms-1y',
        name: 'Gói 1 Năm - Tài khoản riêng 1TB OneDrive',
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        serviceDuration: { value: 1, unit: 'YEAR' },
        warrantyDuration: { value: 1, unit: 'YEAR' },
        price: 199000,
        originalPrice: 650000,
        features: ['1TB OneDrive tốc độ cao riêng biệt', 'Cài trên 5 thiết bị cùng lúc', 'Bảo hành trọn 365 ngày'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'ms365.user01@companyvip.com|OfficePass@2026',
        deliveryGuideMarkdown: '1. Truy cập https://portal.office.com\n2. Đăng nhập bằng tài khoản được cấp và đổi mật khẩu mới lần đầu.\n3. Tải bộ cài Office và đăng nhập.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
    ],
  },
  spotify: {
    defaultTitle: 'Tài khoản Spotify Premium Nghe Nhạc Bản Quyền 320kbps',
    description: '• Nghe nhạc chất lượng cao đỉnh cao Very High (320kbps) không giới hạn.\n• Hoàn toàn không quảng cáo, tải nhạc offline nghe mọi lúc mọi nơi.\n• Chuyển bài không giới hạn trên điện thoại, máy tính và loa thông minh.',
    warrantyPolicy: 'Bảo hành full thời gian gói. Nếu lỗi nhóm sẽ chuyển sang nhóm mới giữ nguyên playlist.',
    plans: [
      {
        id: 'plan-spot-1y',
        name: 'Gói 1 Năm Family (Mời qua Email)',
        fulfillmentType: 'FAMILY_OR_TEAM_INVITATION',
        serviceDuration: { value: 1, unit: 'YEAR' },
        warrantyDuration: { value: 1, unit: 'YEAR' },
        price: 150000,
        originalPrice: 360000,
        features: ['Giữ nguyên tài khoản và playlist cá nhân', 'Không quảng cáo, tải offline', 'Bảo hành 12 tháng'],
        deliveryGuideMarkdown: '1. Shop gửi link mời Family và địa chỉ gia đình chuẩn.\n2. Bấm vào link và xác nhận địa chỉ theo hướng dẫn của shop để vào nhóm.',
        requiredBuyerFields: [
          {
            key: 'spotify_email',
            label: 'Email tài khoản Spotify của bạn',
            type: 'TEXT',
            required: true,
            placeholder: 'VD: spotifyuser@gmail.com',
          },
        ],
        status: 'ACTIVE',
      },
    ],
  },
  jetbrains: {
    defaultTitle: 'Key Bản Quyền JetBrains All Products Pack 1 Năm (License Key)',
    description: '• Kích hoạt trọn bộ hơn 15 IDEs lập trình đỉnh cao của JetBrains: IntelliJ IDEA Ultimate, PyCharm Pro, WebStorm, PhpStorm, GoLand, CLion...\n• Dùng cho mọi dự án thương mại và cá nhân, cập nhật phiên bản mới liên tục.\n• Sử dụng ổn định trên macOS, Windows, Linux.',
    warrantyPolicy: 'Bảo hành 1 đổi 1 mã kích hoạt mới nếu key bị thu hồi trong thời gian đăng ký.',
    plans: [
      {
        id: 'plan-jb-1y',
        name: 'Key Kích Hoạt 1 Năm Bản Quyền',
        fulfillmentType: 'LICENSE_KEY',
        serviceDuration: { value: 1, unit: 'YEAR' },
        warrantyDuration: { value: 1, unit: 'YEAR' },
        price: 350000,
        originalPrice: 1200000,
        features: ['Kích hoạt toàn bộ hơn 15 IDEs', 'Dùng trên Mac, Windows, Linux', 'Bảo hành 1 năm 1 đổi 1'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'JB-KEY-2026-ABCD-EFGH-IJKL\nJB-KEY-2026-MNOP-QRST-UVWX',
        deliveryGuideMarkdown: '1. Mở bất kỳ IDE nào của JetBrains (IntelliJ / WebStorm / PyCharm...)\n2. Vào Help -> Register -> Chọn Activation Code.\n3. Dán mã key được cấp và bấm Activate.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
    ],
  },
  midjourney: {
    defaultTitle: 'Tài khoản Midjourney AI Standard Plan Tạo Ảnh Đỉnh Cao',
    description: '• Công cụ vẽ tranh và tạo ảnh nghệ thuật AI Midjourney v6.1 chân thực nhất thế giới.\n• Unlimited Relax GPU, 15 giờ Fast GPU/tháng, chế độ Stealth riêng tư.\n• Sử dụng trực tiếp trên Discord hoặc giao diện Web Midjourney.',
    warrantyPolicy: 'Bảo hành 1 đổi 1 trọn 30 ngày.',
    plans: [
      {
        id: 'plan-mj-1m',
        name: 'Gói 1 Tháng Standard (Cấp sẵn)',
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        serviceDuration: { value: 1, unit: 'MONTH' },
        warrantyDuration: { value: 1, unit: 'MONTH' },
        price: 280000,
        originalPrice: 650000,
        features: ['15 giờ Fast GPU tạo ảnh tức thì', 'Unlimited Relax GPU', 'Bảo hành 30 ngày'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'midjourney.art01@gmail.com|ArtPass@2026',
        deliveryGuideMarkdown: '1. Đăng nhập tài khoản Discord được cấp.\n2. Vào máy chủ Midjourney và gõ /imagine prompt để tạo ảnh.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
    ],
  },
  netflix: {
    defaultTitle: 'Tài khoản Netflix Premium Ultra HD 4K Chính Hãng',
    description: '• Gói xem phim chất lượng cao nhất Ultra HD 4K, HDR và Spatial Audio đỉnh cao.\n• Xem không giới hạn hàng chục nghìn phim bom tấn, phim bộ độc quyền Netflix Originals.\n• Hỗ trợ Smart TV, máy tính, iPad và điện thoại.',
    warrantyPolicy: 'Bảo hành 1 đổi 1 tài khoản mới nếu bị mất gói hoặc sự cố đăng nhập.',
    plans: [
      {
        id: 'plan-nf-1m',
        name: 'Gói 1 Tháng 1 Profile Riêng PIN',
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        serviceDuration: { value: 1, unit: 'MONTH' },
        warrantyDuration: { value: 1, unit: 'MONTH' },
        price: 79000,
        originalPrice: 180000,
        features: ['1 Profile riêng có mã PIN bảo mật', 'Chất lượng xem 4K Ultra HD', 'Bảo hành 30 ngày'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'netflix.vip01@gmail.com|NfPass@2026',
        deliveryGuideMarkdown: '1. Mở ứng dụng Netflix hoặc truy cập https://netflix.com\n2. Đăng nhập tài khoản và chọn đúng Profile của bạn theo số PIN được cấp.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
    ],
  },
  youtube: {
    defaultTitle: 'Nâng cấp YouTube Premium Chính Chủ Không Quảng Cáo',
    description: '• Xem YouTube không quảng cáo trên mọi thiết bị: TV, điện thoại, máy tính bảng, máy tính.\n• Tặng kèm dịch vụ nghe nhạc YouTube Music Premium chất lượng cao, phát trong nền và khi tắt màn hình.\n• Tải video ngoại tuyến xem khi không có kết nối internet.',
    warrantyPolicy: 'Bảo hành suốt thời gian sử dụng, cam kết gia hạn hoặc chuyển nhóm nhanh chóng.',
    plans: [
      {
        id: 'plan-yt-1y',
        name: 'Gói 1 Năm - Mời Email Chính Chủ',
        fulfillmentType: 'FAMILY_OR_TEAM_INVITATION',
        serviceDuration: { value: 1, unit: 'YEAR' },
        warrantyDuration: { value: 1, unit: 'YEAR' },
        price: 240000,
        originalPrice: 500000,
        features: ['Nâng cấp chính chủ email Google của bạn', 'Kèm YouTube Music Premium', 'Bảo hành 12 tháng'],
        deliveryGuideMarkdown: '1. Shop gửi lời mời Google Family qua email của bạn.\n2. Mở email, bấm "Chấp nhận lời mời / Accept Invitation".\n3. Tận hưởng YouTube không quảng cáo ngay lập tức.',
        requiredBuyerFields: [
          {
            key: 'youtube_email',
            label: 'Email tài khoản Google của bạn',
            type: 'TEXT',
            required: true,
            placeholder: 'VD: yourgoogle@gmail.com',
          },
        ],
        status: 'ACTIVE',
      },
    ],
  },
  notion: {
    defaultTitle: 'Tài khoản Notion Plus & AI Không Giới Hạn Ghi Chú',
    description: '• Không gian làm việc cộng tác đa năng Notion Plus kèm trợ lý trí tuệ nhân tạo Notion AI.\n• Tải tệp lên không giới hạn dung lượng, lịch sử trang 30 ngày, mời 100 khách truy cập.\n• Tự động tóm tắt cuộc họp, viết tài liệu, dịch thuật và phân tích dữ liệu dạng bảng với AI.',
    warrantyPolicy: 'Bảo hành trọn thời hạn gói cước, hỗ trợ 1 đổi 1.',
    plans: [
      {
        id: 'plan-notion-1y',
        name: 'Gói 1 Năm Notion Plus & AI',
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        serviceDuration: { value: 1, unit: 'YEAR' },
        warrantyDuration: { value: 1, unit: 'YEAR' },
        price: 290000,
        originalPrice: 950000,
        features: ['Không giới hạn dung lượng tải lên', 'Tích hợp trợ lý Notion AI thông minh', 'Bảo hành 12 tháng'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'notion.vip01@gmail.com|NotionPass@2026',
        deliveryGuideMarkdown: '1. Truy cập https://notion.so\n2. Đăng nhập bằng tài khoản được cấp.\n3. Bắt đầu quản lý công việc và ghi chú.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
    ],
  },
  capcut: {
    defaultTitle: 'Tài khoản CapCut Pro Bản Quyền Xóa Phông AI Không Logo',
    description: '• Mở khóa toàn bộ hiệu ứng, bộ lọc màu, âm thanh và hiệu ứng chuyển cảnh Pro cao cấp.\n• Công cụ tự động tạo phụ đề (Auto Captions) bằng tiếng Việt siêu chuẩn xác.\n• Xuất video chất lượng cao 4K 60fps không dính watermark logo CapCut.',
    warrantyPolicy: 'Bảo hành 1 đổi 1 trọn thời hạn gói cước.',
    plans: [
      {
        id: 'plan-capcut-1y',
        name: 'Gói 1 Năm Pro (Cấp sẵn)',
        fulfillmentType: 'PRE_CREATED_ACCOUNT',
        serviceDuration: { value: 1, unit: 'YEAR' },
        warrantyDuration: { value: 1, unit: 'YEAR' },
        price: 180000,
        originalPrice: 450000,
        features: ['Mở khóa full tính năng Pro', 'Auto Captions tiếng Việt cực chuẩn', 'Xuất video 4K sắc nét'],
        inventoryFormat: 'TEXT_LIST',
        inventoryText: 'capcut.pro01@gmail.com|CapCutPass@2026',
        deliveryGuideMarkdown: '1. Mở ứng dụng CapCut trên máy tính hoặc điện thoại.\n2. Vào Hồ sơ -> Đăng nhập bằng tài khoản được cấp.\n3. Sử dụng đầy đủ tính năng Pro.',
        requiredBuyerFields: [],
        status: 'ACTIVE',
      },
    ],
  },
  duolingo: {
    defaultTitle: 'Tài khoản Duolingo Super Học Ngoại Ngữ Trái Tim Vô Hạn',
    description: '• Học ngoại ngữ không giới hạn trái tim (Unlimited Hearts), học liên tục không bị gián đoạn.\n• Hoàn toàn không quảng cáo, mở khóa toàn bộ bài kiểm tra vượt cấp độ.\n• Theo dõi tiến độ học tập thông minh và luyện tập sửa lỗi cá nhân hóa.',
    warrantyPolicy: 'Bảo hành 1 đổi 1 trọn thời hạn gói cước.',
    plans: [
      {
        id: 'plan-duo-1y',
        name: 'Gói 1 Năm Super (Mời Email Chính Chủ)',
        fulfillmentType: 'FAMILY_OR_TEAM_INVITATION',
        serviceDuration: { value: 1, unit: 'YEAR' },
        warrantyDuration: { value: 1, unit: 'YEAR' },
        price: 99000,
        originalPrice: 300000,
        features: ['Trái tim vô hạn không lo hết lượt', 'Không quảng cáo', 'Bảo hành 12 tháng'],
        deliveryGuideMarkdown: '1. Shop gửi link mời nhóm Duolingo Super qua email của bạn.\n2. Bấm vào link và xác nhận tham gia gia đình.\n3. Học tập không giới hạn.',
        requiredBuyerFields: [
          {
            key: 'duolingo_email',
            label: 'Email tài khoản Duolingo của bạn',
            type: 'TEXT',
            required: true,
            placeholder: 'VD: yourduolingo@gmail.com',
          },
        ],
        status: 'ACTIVE',
      },
    ],
  },
};

export const SellerAppAccountProductFormView: React.FC<SellerAppAccountProductFormViewProps> = ({
  initialProduct,
  onSuccess,
  onCancel,
}) => {
  const isEditing = !!initialProduct?.id;
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Section Collapse / Expand States
  const [isSection1Open, setIsSection1Open] = useState(true);
  const [isSection2Open, setIsSection2Open] = useState(true);

  // App Selection Mode: 'CATALOG' | 'CUSTOM'
  const [appSelectionMode, setAppSelectionMode] = useState<'CATALOG' | 'CUSTOM'>('CATALOG');

  // Modal: Create New Application
  const [showCreateAppModal, setShowCreateAppModal] = useState(false);
  const [newAppName, setNewAppName] = useState('');
  const [newAppCategory, setNewAppCategory] = useState<ApplicationCategory>('AI');
  const [newAppWebsite, setNewAppWebsite] = useState('');
  const [newAppLogo, setNewAppLogo] = useState('');
  const [newAppDescription, setNewAppDescription] = useState('');
  const [newAppPlatforms, setNewAppPlatforms] = useState<ApplicationPlatform[]>([
    'WEB', 'WINDOWS', 'MAC', 'ANDROID', 'IOS'
  ]);
  const [creatingApp, setCreatingApp] = useState(false);

  // Modal: Manage Template Library (Edit, Delete, Reset to clean defaults)
  const [showManageCatalogModal, setShowManageCatalogModal] = useState(false);
  const [editingCatalogApp, setEditingCatalogApp] = useState<ApplicationSummary | null>(null);
  const [editAppName, setEditAppName] = useState('');
  const [editAppCategory, setEditAppCategory] = useState<ApplicationCategory>('AI');
  const [editAppWebsite, setEditAppWebsite] = useState('');
  const [editAppLogo, setEditAppLogo] = useState('');
  const [editAppLogoError, setEditAppLogoError] = useState(false);
  const [editAppDescription, setEditAppDescription] = useState('');
  const [editAppPlatforms, setEditAppPlatforms] = useState<ApplicationPlatform[]>([
    'WEB', 'WINDOWS', 'MAC', 'ANDROID', 'IOS',
  ]);
  const [savingCatalogApp, setSavingCatalogApp] = useState(false);
  const [resettingCatalog, setResettingCatalog] = useState(false);

  // Product Basic Info
  const [selectedAppSlug, setSelectedAppSlug] = useState<string>('');
  const [name, setName] = useState(initialProduct?.name || '');
  const [category, setCategory] = useState<ApplicationCategory>(
    (initialProduct?.appCategory as any) || 'AI'
  );
  const [platforms, setPlatforms] = useState<ApplicationPlatform[]>(
    initialProduct?.platforms || ['WEB', 'WINDOWS', 'MAC', 'ANDROID', 'IOS']
  );
  const [thumbnail, setThumbnail] = useState(
    initialProduct?.thumbnail || initialProduct?.images?.[0] || ''
  );
  const [thumbnailError, setThumbnailError] = useState(false);
  const [newAppLogoError, setNewAppLogoError] = useState(false);
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [warrantyPolicy, setWarrantyPolicy] = useState(
    initialProduct?.warrantyPolicy || 'Bảo hành 1 đổi 1 hoặc hoàn tiền tương ứng thời gian còn lại nếu lỗi phát sinh từ nhà cung cấp.'
  );

  // File Upload Handlers (Upload images from local device storage)
  const handleThumbnailFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP, SVG).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Dung lượng ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setThumbnail(dataUrl);
        setThumbnailError(false);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleThumbnailChange = (val: string) => {
    const cleaned = sanitizeImageUrl(val);
    setThumbnail(cleaned);
    setThumbnailError(false);
  };

  const handleNewAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setNewAppLogo(dataUrl);
        setNewAppLogoError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNewAppLogoChange = (val: string) => {
    const cleaned = sanitizeImageUrl(val);
    setNewAppLogo(cleaned);
    setNewAppLogoError(false);
  };

  // Plans Management
  const [plans, setPlans] = useState<AppAccountPlan[]>(
    initialProduct?.plans && initialProduct.plans.length > 0
      ? initialProduct.plans
      : [
          {
            id: 'plan-' + Date.now(),
            name: 'Gói 1 Năm Cá Nhân (12 Tháng)',
            fulfillmentType: 'PRE_CREATED_ACCOUNT',
            serviceDuration: { value: 12, unit: 'MONTH' },
            warrantyDuration: { value: 12, unit: 'MONTH' },
            price: 799000,
            originalPrice: 1500000,
            features: ['Tài khoản cấp sẵn dùng ngay', 'Bảo hành full thời gian', 'Hỗ trợ 24/7'],
            inventoryFormat: 'TEXT_LIST',
            inventoryText: 'chatgpt.user01@gmail.com|PassVip@2026\nchatgpt.user02@gmail.com|PassVip@2026',
            deliveryGuideMarkdown: '1. Đăng nhập tại https://chat.openai.com với tài khoản được cấp.\n2. Kiểm tra gói ChatGPT Plus hoạt động bình thường.\n3. Vui lòng không thay đổi mật khẩu gốc.',
            requiredBuyerFields: [],
            status: 'ACTIVE',
          },
        ]
  );

  const [activePlanIndex, setActivePlanIndex] = useState(0);
  const [inventoryInputMode, setInventoryInputMode] = useState<'TEXT_LIST' | 'MARKDOWN' | 'FILE'>('TEXT_LIST');

  // Load applications catalog
  useEffect(() => {
    async function loadApps() {
      try {
        const list = await appAccountApi.getApplications();
        setApplications(list);
        if (initialProduct?.applicationSlug) {
          setSelectedAppSlug(initialProduct.applicationSlug);
          setAppSelectionMode('CATALOG');
        } else if (!initialProduct && list.length > 0) {
          setSelectedAppSlug(list[0].slug);
        }
      } catch (err) {
        console.error('Failed to load apps:', err);
      }
    }
    loadApps();
  }, []);

  // Sync state whenever initialProduct changes (Edit Mode)
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || '');
      setCategory((initialProduct.appCategory as any) || 'AI');
      setPlatforms(initialProduct.platforms || ['WEB', 'WINDOWS', 'MAC', 'ANDROID', 'IOS']);
      setThumbnail(initialProduct.thumbnail || initialProduct.images?.[0] || '');
      setDescription(initialProduct.description || '');
      setWarrantyPolicy(initialProduct.warrantyPolicy || '');
      if (initialProduct.plans && initialProduct.plans.length > 0) {
        setPlans(initialProduct.plans);
        setActivePlanIndex(0);
      }
      if (initialProduct.applicationSlug) {
        setSelectedAppSlug(initialProduct.applicationSlug);
        setAppSelectionMode('CATALOG');
      } else {
        setAppSelectionMode('CUSTOM');
      }
    }
  }, [initialProduct]);

  // Handle Application selection
  const handleSelectApp = (slug: string) => {
    setSelectedAppSlug(slug);
    const found = applications.find((a) => a.slug === slug);
    if (found) {
      // Intelligent key matching from APP_RICH_DEFAULTS
      const matchedKey = Object.keys(APP_RICH_DEFAULTS).find(
        (k) =>
          slug.toLowerCase().includes(k) ||
          found.name.toLowerCase().includes(k) ||
          (found.slug && found.slug.toLowerCase().includes(k))
      );
      const preset = matchedKey ? APP_RICH_DEFAULTS[matchedKey] : undefined;

      if (!isEditing || !name) {
        setName(preset?.defaultTitle || `Tài khoản ${found.name} Chính Hãng`);
      }
      setCategory(found.category);
      const icon = found.logo || found.logoUrl;
      if (icon) {
        setThumbnail(sanitizeImageUrl(icon));
        setThumbnailError(false);
      }
      if (found.supportedPlatforms && found.supportedPlatforms.length > 0) {
        setPlatforms(found.supportedPlatforms);
      }

      // Auto-populate detailed description & warranty policy if creating new or empty
      if (preset) {
        if (!isEditing || !description) {
          setDescription(preset.description);
        }
        if (
          !isEditing ||
          !warrantyPolicy ||
          warrantyPolicy.includes('hoàn tiền tương ứng thời gian còn lại nếu lỗi phát sinh từ nhà cung cấp')
        ) {
          setWarrantyPolicy(preset.warrantyPolicy);
        }
        if (!isEditing && preset.plans && preset.plans.length > 0) {
          setPlans(preset.plans);
          setActivePlanIndex(0);
        }
      }
    }
  };

  // Toggle platform
  const handleTogglePlatform = (p: ApplicationPlatform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((item) => item !== p) : [...prev, p]
    );
  };

  // Add Plan
  const handleAddPlan = () => {
    const newPlan: AppAccountPlan = {
      id: 'plan-' + Date.now(),
      name: `Gói mới ${plans.length + 1}`,
      fulfillmentType: 'PRE_CREATED_ACCOUNT',
      serviceDuration: { value: 1, unit: 'MONTH' },
      warrantyDuration: { value: 1, unit: 'MONTH' },
      price: 100000,
      features: ['Bảo hành uy tín', 'Hỗ trợ 24/7'],
      inventoryFormat: 'TEXT_LIST',
      inventoryText: '',
      deliveryGuideMarkdown: 'Hướng dẫn đăng nhập và sử dụng gói cước...',
      requiredBuyerFields: [],
      status: 'ACTIVE',
    };
    setPlans([...plans, newPlan]);
    setActivePlanIndex(plans.length);
  };

  // Remove plan
  const handleRemovePlan = (idx: number) => {
    if (plans.length <= 1) {
      alert('Sản phẩm phải có ít nhất 1 gói cước.');
      return;
    }
    const updated = plans.filter((_, i) => i !== idx);
    setPlans(updated);
    setActivePlanIndex(Math.max(0, idx - 1));
  };

  // Update current plan field
  const updateCurrentPlan = (patch: Partial<AppAccountPlan>) => {
    setPlans((prev) => {
      const copy = [...prev];
      copy[activePlanIndex] = { ...copy[activePlanIndex], ...patch };
      return copy;
    });
  };

  // Intelligent fulfillment type change handler
  const handleFulfillmentTypeChange = (newType: AppAccountFulfillmentType) => {
    const cur = plans[activePlanIndex];
    let defaultFields: BuyerFieldDefinition[] = [];
    let guide = cur.deliveryGuideMarkdown || '';

    if (newType === 'PRE_CREATED_ACCOUNT') {
      defaultFields = [];
      if (!guide) {
        guide = '1. Đăng nhập với tài khoản và mật khẩu được cấp bên trên.\n2. Kiểm tra thông tin gói cước trong phần Cài đặt tài khoản.\n3. Vui lòng không thay đổi phương thức thanh toán gốc.';
      }
    } else if (newType === 'LICENSE_KEY') {
      defaultFields = [];
      if (!guide) {
        guide = '1. Tải phần mềm từ trang chủ chính thức.\n2. Mở ứng dụng, vào mục Kích hoạt / License và dán mã bản quyền nhận được.\n3. Nhấn Kích hoạt và tận hưởng bản quyền chính hãng.';
      }
    } else if (newType === 'FAMILY_OR_TEAM_INVITATION') {
      defaultFields = [
        {
          key: 'buyerEmail',
          label: 'Email tài khoản người mua nhận lời mời',
          type: 'EMAIL',
          required: true,
          placeholder: 'vidu@gmail.com',
          helpText: 'Shop sẽ gửi lời mời tham gia nhóm bản quyền vào email này trong vòng 15-30 phút.',
        },
      ];
      if (!guide) {
        guide = 'Vui lòng kiểm tra hộp thư email (bao gồm cả thư rác / Spam) và click nút "Chấp nhận lời mời" để gia nhập nhóm bản quyền.';
      }
    } else if (newType === 'BUYER_EMAIL_ACTIVATION') {
      defaultFields = [
        {
          key: 'buyerAccount',
          label: 'Tài khoản / Email cần nâng cấp',
          type: 'TEXT',
          required: true,
          placeholder: 'vidu@gmail.com hoặc Tên đăng nhập',
          helpText: 'Tài khoản để shop thực hiện nâng cấp gói chính chủ.',
        },
        {
          key: 'buyerTempPassword',
          label: 'Mật khẩu tạm thời (Để shop đăng nhập nâng cấp)',
          type: 'TEXT',
          required: true,
          placeholder: '••••••••',
          helpText: 'Vui lòng cung cấp mật khẩu tạm thời và đổi lại mật khẩu mới ngay sau khi shop hoàn tất đơn hàng.',
        },
        {
          key: 'buyer2FaNote',
          label: 'Ghi chú đăng nhập / Phương thức liên hệ 2FA',
          type: 'TEXT',
          required: false,
          placeholder: 'VD: Nhắn Zalo/SĐT để lấy mã xác thực 2 bước nếu có...',
          helpText: 'Cung cấp phương thức liên hệ nếu tài khoản của bạn đang bật xác thực 2 lớp.',
        },
      ];
      if (!guide) {
        guide = 'Shop sẽ đăng nhập vào tài khoản của bạn để nâng cấp trong vòng 15-30 phút. Vui lòng đổi lại mật khẩu sau khi nhận thông báo hoàn tất.';
      }
    } else {
      defaultFields = cur.requiredBuyerFields || [];
    }

    updateCurrentPlan({
      fulfillmentType: newType,
      requiredBuyerFields: defaultFields,
      deliveryGuideMarkdown: guide,
    });
  };

  // Buyer Field Validation check with context awareness
  const checkSecurityViolations = (field: BuyerFieldDefinition, fulfillmentType: AppAccountFulfillmentType): string | null => {
    if (fulfillmentType === 'PRE_CREATED_ACCOUNT' || fulfillmentType === 'LICENSE_KEY') {
      return null;
    }

    const key = (field.key || '').toLowerCase();
    const label = (field.label || '').toLowerCase();

    // Financial / OTP / 2FA terms that are strictly forbidden
    const strictForbidden = [
      'otp', 'ma otp', 'mã otp', 'pin', 'cvv', 'cvc', 'mã pin ngân hàng',
      '2fa', 'two_factor', 'two factor', 'auth code', 'mã xác thực', 'token'
    ];
    for (const term of strictForbidden) {
      if (key.includes(term) || label.includes(term)) {
        return `Vi phạm chính sách an toàn: Tuyệt đối không yêu cầu mã OTP, mã PIN, CVV hoặc mã xác thực 2FA của người mua!`;
      }
    }

    // Passwords of buyer are strictly prohibited for ALL types (P0.6 security policy)
    const passwordTerms = ['pass', 'mật khẩu', 'mat khau', 'mat_khau', 'password', 'mk '];
    for (const term of passwordTerms) {
      if (key.includes(term) || label.includes(term)) {
        return `Chính sách bảo mật: Không được yêu cầu mật khẩu tài khoản cá nhân của người mua dưới bất kỳ hình thức nào. Vui lòng sử dụng cơ chế Link mời gia nhập (Invite link) hoặc License key!`;
      }
    }

    return null;
  };

  // Add Buyer Field to current plan
  const handleAddBuyerField = () => {
    const cur = plans[activePlanIndex];
    const newField: BuyerFieldDefinition = {
      key: `field_${Date.now()}`,
      label: 'Thông tin cần thu thập',
      type: 'TEXT',
      required: true,
      placeholder: 'Nhập thông tin...',
      helpText: 'Thông tin này người mua sẽ điền khi thanh toán',
    };
    updateCurrentPlan({
      requiredBuyerFields: [...(cur.requiredBuyerFields || []), newField],
    });
  };

  // Update Buyer Field
  const handleUpdateBuyerField = (fIdx: number, patch: Partial<BuyerFieldDefinition>) => {
    const cur = plans[activePlanIndex];
    const fields = [...(cur.requiredBuyerFields || [])];
    fields[fIdx] = { ...fields[fIdx], ...patch };
    updateCurrentPlan({ requiredBuyerFields: fields });
  };

  // Remove Buyer Field
  const handleRemoveBuyerField = (fIdx: number) => {
    const cur = plans[activePlanIndex];
    const fields = [...(cur.requiredBuyerFields || [])].filter((_, i) => i !== fIdx);
    updateCurrentPlan({ requiredBuyerFields: fields });
  };

  // Add Feature to current plan
  const handleAddFeature = () => {
    const cur = plans[activePlanIndex];
    updateCurrentPlan({
      features: [...(cur.features || []), 'Đặc quyền mới'],
    });
  };

  const handleUpdateFeature = (idx: number, val: string) => {
    const cur = plans[activePlanIndex];
    const feats = [...(cur.features || [])];
    feats[idx] = val;
    updateCurrentPlan({ features: feats });
  };

  const handleRemoveFeature = (idx: number) => {
    const cur = plans[activePlanIndex];
    const feats = (cur.features || []).filter((_, i) => i !== idx);
    updateCurrentPlan({ features: feats });
  };

  // Handle Custom Application Creation
  const handleCreateNewApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) {
      alert('Vui lòng nhập tên ứng dụng mới.');
      return;
    }

    setCreatingApp(true);
    try {
      const sanitizedLogo =
        sanitizeImageUrl(newAppLogo.trim()) ||
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150';

      const created = await appAccountApi.createApplication({
        name: newAppName.trim(),
        category: newAppCategory,
        officialWebsiteUrl: newAppWebsite.trim() || undefined,
        logo: sanitizedLogo,
        logoUrl: sanitizedLogo,
        description: newAppDescription.trim() || undefined,
        supportedPlatforms: newAppPlatforms,
      });

      setApplications((prev) => [created, ...prev]);
      setSelectedAppSlug(created.slug);
      setName(`Tài khoản ${created.name} Chính Hãng`);
      setCategory(created.category);
      if (created.logo) {
        setThumbnail(created.logo);
        setThumbnailError(false);
      }
      if (created.supportedPlatforms) setPlatforms(created.supportedPlatforms);
      setShowCreateAppModal(false);
      setAppSelectionMode('CATALOG');

      // Reset modal inputs
      setNewAppName('');
      setNewAppWebsite('');
      setNewAppLogo('');
      setNewAppLogoError(false);
      setNewAppDescription('');
    } catch (err: any) {
      alert('Lỗi tạo ứng dụng: ' + err.message);
    } finally {
      setCreatingApp(false);
    }
  };

  // Preset click handler in modal
  const handleApplyPreset = (preset: typeof APP_PRESETS[0]) => {
    setNewAppName(preset.name);
    setNewAppCategory(preset.category);
    setNewAppWebsite(preset.website);
    setNewAppLogo(preset.logo);
    setNewAppLogoError(false);
    setNewAppDescription(preset.description);
  };

  // Open Edit Catalog App Modal
  const handleOpenEditCatalogApp = (app: ApplicationSummary) => {
    setEditingCatalogApp(app);
    setEditAppName(app.name);
    setEditAppCategory(app.category);
    setEditAppWebsite(app.officialWebsiteUrl || '');
    setEditAppLogo(app.logo || app.logoUrl || '');
    setEditAppLogoError(false);
    setEditAppDescription(app.description || '');
    setEditAppPlatforms(app.supportedPlatforms || ['WEB', 'WINDOWS', 'MAC', 'ANDROID', 'IOS']);
    setShowManageCatalogModal(true);
  };

  // Save Edit Catalog App
  const handleSaveEditCatalogApp = async () => {
    if (!editingCatalogApp) return;
    if (!editAppName.trim()) {
      alert('Vui lòng nhập tên ứng dụng.');
      return;
    }
    setSavingCatalogApp(true);
    try {
      const sanitized = sanitizeImageUrl(editAppLogo);
      const updated = await appAccountApi.updateApplication(editingCatalogApp.id, {
        name: editAppName.trim(),
        category: editAppCategory,
        officialWebsiteUrl: editAppWebsite.trim() || undefined,
        logo: sanitized,
        logoUrl: sanitized,
        description: editAppDescription.trim() || undefined,
        supportedPlatforms: editAppPlatforms,
      });

      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

      // If the currently active product is using this template, update its logo too
      if (selectedAppSlug === updated.slug || selectedAppSlug === editingCatalogApp.slug) {
        setThumbnail(updated.logo || updated.logoUrl || thumbnail);
        setCategory(updated.category);
      }

      setEditingCatalogApp(null);
    } catch (err: any) {
      alert('Không thể lưu cập nhật: ' + (err.message || 'Lỗi không xác định'));
    } finally {
      setSavingCatalogApp(false);
    }
  };

  // Delete Catalog App
  const handleDeleteCatalogApp = async (appId: string, appName: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu "${appName}" khỏi thư viện không?`)) {
      return;
    }
    try {
      await appAccountApi.deleteApplication(appId);
      setApplications((prev) => prev.filter((a) => a.id !== appId));
      if (editingCatalogApp?.id === appId) {
        setEditingCatalogApp(null);
      }
    } catch (err: any) {
      alert('Không thể xóa: ' + (err.message || 'Lỗi không xác định'));
    }
  };

  // Reset Catalog to 14 standard clean applications
  const handleResetCatalog = async () => {
    if (
      !window.confirm(
        'Khôi phục danh mục mẫu về 14 ứng dụng chuẩn với logo vector nét và xóa toàn bộ mẫu lỗi?'
      )
    ) {
      return;
    }
    setResettingCatalog(true);
    try {
      const list = await appAccountApi.resetApplications();
      setApplications(list);
      setEditingCatalogApp(null);
      if (list.length > 0) {
        handleSelectApp(list[0].slug);
      }
      alert('Đã khôi phục thành công 14 ứng dụng mẫu chuẩn không lỗi ảnh!');
    } catch (err: any) {
      alert('Không thể khôi phục danh mục: ' + (err.message || 'Lỗi'));
    } finally {
      setResettingCatalog(false);
    }
  };

  // Upload logo from local computer for Edit Catalog App
  const handleEditAppLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, SVG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setEditAppLogo(dataUrl);
        setEditAppLogoError(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditAppLogoChange = (val: string) => {
    const cleaned = sanitizeImageUrl(val);
    setEditAppLogo(cleaned);
    setEditAppLogoError(false);
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Vui lòng nhập tên sản phẩm.');
      return;
    }
    if (!thumbnail.trim()) {
      setError('Vui lòng cung cấp link ảnh Thumbnail hoặc logo ứng dụng.');
      return;
    }
    if (plans.length === 0) {
      setError('Sản phẩm cần có ít nhất một gói cước.');
      return;
    }

    // Security Check on all buyer fields across plans
    for (const p of plans) {
      for (const field of p.requiredBuyerFields || []) {
        const violation = checkSecurityViolations(field, p.fulfillmentType);
        if (violation) {
          setError(`[Gói: ${p.name}] ${violation}`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const selectedApp = applications.find((a) => a.slug === selectedAppSlug);
      const lowestPrice = Math.min(...plans.map((p) => p.price));

      // Calculate stock for plans with pre-created accounts or keys
      const calculatedPlans = plans.map((p) => {
        if (p.fulfillmentType === 'PRE_CREATED_ACCOUNT' || p.fulfillmentType === 'LICENSE_KEY') {
          const lines = (p.inventoryText || '').split('\n').map((l) => l.trim()).filter(Boolean);
          const stockCount = lines.length;
          return {
            ...p,
            availableStock: stockCount > 0 ? stockCount : p.availableStock || 5,
            stock: stockCount > 0 ? stockCount : p.stock || 5,
          };
        }
        return p;
      });

      const productPayload: any = {
        id: initialProduct?.id || `app_prod_${Date.now()}`,
        name,
        slug: initialProduct?.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now(),
        type: 'DIGITAL_APP_ACCOUNT',
        category,
        appCategory: category,
        applicationSlug: appSelectionMode === 'CATALOG' ? selectedAppSlug : undefined,
        applicationName: appSelectionMode === 'CATALOG' ? (selectedApp?.name || 'Ứng Dụng Bản Quyền') : name,
        thumbnail,
        images: [thumbnail],
        description,
        platforms,
        plans: calculatedPlans,
        warrantyPolicy,
        price: lowestPrice,
        originalPrice: calculatedPlans.some((p) => p.originalPrice)
          ? Math.max(...calculatedPlans.map((p) => p.originalPrice || p.price))
          : undefined,
        status: 'ACTIVE',
      };

      await sellerApi.saveSellerAppAccount(productPayload);

      // Automatically sync pre-created accounts or license keys into Inventory Vault
      for (const p of calculatedPlans) {
        if ((p.fulfillmentType === 'PRE_CREATED_ACCOUNT' || p.fulfillmentType === 'LICENSE_KEY') && p.inventoryText) {
          const lines = p.inventoryText.split('\n').map((l: string) => l.trim()).filter(Boolean);
          for (const line of lines) {
            try {
              if (p.fulfillmentType === 'LICENSE_KEY') {
                await appInventoryApi.addItem({
                  productId: productPayload.id,
                  planId: p.id,
                  itemType: 'LICENSE_KEY',
                  licenseKey: line,
                  privateNote: 'Nhập tự động khi tạo/sửa gói cước',
                });
              } else {
                const parts = line.split('|').map((s: string) => s.trim());
                const login = parts[0] || '';
                const password = parts[1] || '';
                const twoFactorSecret = parts[2] || undefined;
                const recoveryCode = parts[3] || undefined;
                if (login && password) {
                  await appInventoryApi.addItem({
                    productId: productPayload.id,
                    planId: p.id,
                    credentials: {
                      login,
                      password,
                      twoFactorSecret,
                      recoveryCode,
                    },
                    privateNote: 'Nhập tự động khi tạo/sửa gói cước',
                  });
                }
              }
            } catch (err) {
              console.warn('Could not auto-add inventory item:', err);
            }
          }
        }
      }

      onSuccess();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setError(err.message || 'Không thể lưu sản phẩm. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const curPlan = plans[activePlanIndex];

  // Detected accounts count in current plan
  const detectedCount = (curPlan?.inventoryText || '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean).length;

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-8 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">
                {isEditing ? `Chỉnh Sửa Gói Bán & Tồn Kho: ${name}` : 'Đăng Bán Tài Khoản Ứng Dụng & Trí Tuệ Nhân Tạo (AI)'}
              </h1>
              {isEditing && (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                  Đang chỉnh sửa
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing
                ? 'Cập nhật giá bán, nạp thêm tài khoản vào kho hoặc điều chỉnh các gói cước mà không cần nhập lại từ đầu.'
                : 'Cấu hình tự động giao hàng theo từng hình thức (Tài khoản cấp sẵn, Nâng chính chủ, Mời nhóm, License Key).'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Đang lưu...' : isEditing ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm & Đăng bán'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center gap-3 text-rose-800 text-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <span className="font-semibold">{error}</span>
        </div>
      )}

      {/* SECTION 1: APPLICATION & PRODUCT BASIC INFO */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div
            onClick={() => setIsSection1Open(!isSection1Open)}
            className="flex items-center gap-2.5 cursor-pointer select-none group flex-1"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                !isSection1Open && name.trim()
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {!isSection1Open && name.trim() ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Thông Tin Ứng Dụng & Danh Mục
                </h2>
                {!isSection1Open && name.trim() && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ Đã điền xong
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {!isSection1Open && name.trim()
                  ? `${name} • ${CATEGORIES.find((c) => c.value === category)?.label || category} • ${platforms.length} nền tảng`
                  : 'Chọn ứng dụng từ thư viện mẫu hoặc tự do thiết lập tiêu đề, ảnh và danh mục.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mode Switcher (Visible when section is open) */}
            {isSection1Open && (
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setAppSelectionMode('CATALOG')}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    appSelectionMode === 'CATALOG'
                      ? 'bg-white text-emerald-800 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📚 Thư viện mẫu
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateAppModal(true)}
                  className="px-3 py-1 rounded-lg font-bold text-emerald-700 hover:bg-emerald-50 transition-all cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  <span>Thêm app mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAppSelectionMode('CUSTOM');
                    setSelectedAppSlug('');
                  }}
                  className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    appSelectionMode === 'CUSTOM'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✍️ Tự do
                </button>
              </div>
            )}

            {/* Collapse/Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSection1Open(!isSection1Open)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSection1Open
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {isSection1Open ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Thu gọn</span>
                </>
              ) : (
                <>
                  <Edit className="w-3.5 h-3.5" />
                  <span>Mở rộng chỉnh sửa</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* SUMMARY CARD WHEN SECTION 1 IS COLLAPSED */}
        {!isSection1Open && (
          <div
            onClick={() => setIsSection1Open(true)}
            className="p-4 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              {thumbnail && !thumbnailError ? (
                <img
                  src={thumbnail}
                  alt="preview"
                  onError={() => setThumbnailError(true)}
                  className="w-12 h-12 rounded-xl object-contain bg-white border border-slate-200 p-1 flex-shrink-0 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-base flex-shrink-0">
                  {name ? name.charAt(0).toUpperCase() : 'App'}
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sm text-slate-900 truncate">
                    {name || 'Chưa nhập tiêu đề sản phẩm'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {CATEGORIES.find((c) => c.value === category)?.label || category}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                  <span>Nền tảng:</span>
                  {platforms.map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-medium text-slate-700"
                    >
                      {PLATFORMS.find((pl) => pl.value === p)?.label || p}
                    </span>
                  ))}
                  {description && (
                    <span className="text-slate-400 truncate max-w-xs block sm:inline">
                      • {description}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 flex-shrink-0">
              <span>Bấm để chỉnh sửa</span>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        )}

        {/* FULL FORM WHEN SECTION 1 IS EXPANDED */}
        {isSection1Open && (
          <div className="space-y-6">
            {/* Application Catalog Selector (If mode === 'CATALOG') */}
            {appSelectionMode === 'CATALOG' ? (
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Chọn Ứng Dụng từ Thư Viện Mẫu (Tự động điền logo, mô tả, bảo hành & gói cước):
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatalogApp(null);
                        setShowManageCatalogModal(true);
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer bg-slate-100 hover:bg-emerald-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                      title="Chỉnh sửa ảnh lỗi, xóa mẫu thừa hoặc khôi phục 14 mẫu chuẩn"
                    >
                      <Settings className="w-3.5 h-3.5 text-slate-600" />
                      <span>⚙️ Quản lý & Sửa mẫu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateAppModal(true)}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Thêm app mới</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                  {/* Add New Custom App Button Card */}
                  <button
                    type="button"
                    onClick={() => setShowCreateAppModal(true)}
                    className="p-2.5 rounded-xl border border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 text-left flex items-center gap-2 transition-all cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 group-hover:bg-emerald-700 text-white flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs transition-colors">
                      +
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-emerald-950 leading-tight">+ Thêm Mới</p>
                      <p className="text-[10px] text-emerald-700 truncate">Tùy chỉnh app</p>
                    </div>
                  </button>

                  {applications.map((app) => {
                    const isSelected = selectedAppSlug === app.slug;
                    return (
                      <div key={app.id} className="relative group/card">
                        <button
                          type="button"
                          onClick={() => handleSelectApp(app.slug)}
                          className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                        >
                          <AppIconImage
                            src={app.logo || app.logoUrl}
                            alt={app.name}
                            className="w-7 h-7 rounded-lg object-contain bg-white p-0.5 border border-slate-100 flex-shrink-0"
                          />
                          <div className="min-w-0 pr-3">
                            <p className="text-xs font-bold truncate">{app.name}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{app.category}</p>
                          </div>
                        </button>
                        {/* Quick edit button on card hover */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditCatalogApp(app);
                          }}
                          title="Chỉnh sửa mẫu này (đổi ảnh, tên...)"
                          className="absolute top-1.5 right-1.5 p-1 rounded-md bg-white/90 hover:bg-white text-slate-400 hover:text-emerald-700 opacity-0 group-hover/card:opacity-100 transition-opacity border border-slate-200 shadow-xs cursor-pointer"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Notice for Free Form Mode */
              <div className="p-3.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-slate-600" />
                  <span>
                    <strong>Chế độ nhập tự do:</strong> Bạn có thể tự đặt bất kỳ tên sản phẩm, dán link logo và chọn nền tảng theo ý muốn mà không phụ thuộc vào thư viện mẫu.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAppSelectionMode('CATALOG')}
                  className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  Quay lại thư viện mẫu
                </button>
              </div>
            )}

            {/* Product Name & Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tiêu đề sản phẩm hiển thị <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="VD: Tài khoản ChatGPT Plus (GPT-4o) Chính Chủ Kèm DALL-E 3"
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phân loại danh mục
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ApplicationCategory)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Thumbnail & Platforms */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    Ảnh Thumbnail / Logo <span className="text-rose-500">*</span>
                  </label>
                  <label className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Tải ảnh từ máy tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleThumbnailFileUpload}
                    />
                  </label>
                </div>

                <div className="flex gap-2.5 items-start">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={thumbnail}
                      onChange={(e) => handleThumbnailChange(e.target.value)}
                      placeholder="Dán link ảnh (.png, .jpg, .webp) hoặc link tìm kiếm ảnh..."
                      className={`w-full text-xs font-medium pl-3.5 pr-8 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:bg-white transition-all ${
                        thumbnailError
                          ? 'border-amber-400 focus:ring-amber-500 text-amber-950'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {thumbnail && (
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnail('');
                          setThumbnailError(false);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Xóa link ảnh"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Thumbnail Preview Box */}
                  <div className="w-11 h-11 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs relative">
                    {thumbnail && !thumbnailError ? (
                      <img
                        src={thumbnail}
                        alt="preview"
                        onError={() => setThumbnailError(true)}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <ImageIcon className="w-4 h-4 text-slate-300" />
                        <span className="text-[8px] font-semibold text-slate-400 mt-0.5">Logo</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Banner when link fails or is search URL */}
                {thumbnailError && (
                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 space-y-1.5 animate-in fade-in">
                    <div className="flex items-start gap-1.5 font-bold">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>Đường liên kết không hiển thị được hình ảnh trực tiếp:</span>
                    </div>
                    <p className="text-amber-800 pl-5 leading-relaxed">
                      Link bạn dán có thể là <strong>trang tìm kiếm (Bing/Google)</strong> hoặc trang web HTML thay vì tệp ảnh trực tiếp (.png, .jpg).
                    </p>
                    <div className="pl-5 pt-0.5 flex items-center gap-2 flex-wrap">
                      <label className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 shadow-xs transition-colors">
                        <Upload className="w-3 h-3" />
                        <span>Tải ảnh từ máy tính (Khuyên dùng)</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleThumbnailFileUpload}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setThumbnail('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150');
                          setThumbnailError(false);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-amber-300 text-amber-900 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                      >
                        Dùng ảnh mẫu AI
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nền tảng hỗ trợ sử dụng
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {PLATFORMS.map((p) => {
                    const active = platforms.includes(p.value);
                    return (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => handleTogglePlatform(p.value)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                          active
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả sản phẩm & Cam kết</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs font-medium px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                placeholder="Mô tả quyền lợi, mô hình AI hỗ trợ, tính năng nổi bật..."
              />
            </div>

            {/* Bottom Section 1: Completion and Collapse button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                {name.trim() ? '✓ Đã hoàn tất thông tin cơ bản.' : 'Vui lòng điền tiêu đề và link ảnh đại diện.'}
              </span>
              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setIsSection1Open(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ChevronUp className="w-4 h-4" />
                  <span>Thu gọn phần 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSection1Open(false);
                    setIsSection2Open(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Xong phần 1 & Sang Cấu hình Gói cước (Phần 2) ↓</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: MULTI-PLAN & DYNAMIC FULFILLMENT CONFIGURATION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-xs transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div
            onClick={() => setIsSection2Open(!isSection2Open)}
            className="flex items-center gap-2.5 cursor-pointer select-none group flex-1"
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                !isSection2Open && plans.length > 0
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {!isSection2Open && plans.length > 0 ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Cấu hình các Gói cước (Multi-Plan & Thời hạn & Kho Bàn Giao)
                </h2>
                {!isSection2Open && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    ✓ {plans.length} gói cước
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {!isSection2Open
                  ? `${plans.length} gói cước • Giá từ ${Math.min(...plans.map((p) => p.price)).toLocaleString('vi-VN')}đ`
                  : 'Mỗi gói cước có thể có giá bán, thời hạn và hình thức giao hàng riêng biệt.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsSection2Open(true);
                handleAddPlan();
              }}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm gói cước khác</span>
            </button>

            {/* Collapse/Expand Toggle Button */}
            <button
              type="button"
              onClick={() => setIsSection2Open(!isSection2Open)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isSection2Open
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              {isSection2Open ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Thu gọn</span>
                </>
              ) : (
                <>
                  <Edit className="w-3.5 h-3.5" />
                  <span>Mở rộng cấu hình</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* SUMMARY CARDS WHEN SECTION 2 IS COLLAPSED */}
        {!isSection2Open && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {plans.map((p, idx) => {
                const linesCount = (p.inventoryText || '').split('\n').map((l) => l.trim()).filter(Boolean).length;
                const fulfillmentLabel = FULFILLMENT_TYPES.find((f) => f.value === p.fulfillmentType)?.label || p.fulfillmentType;
                return (
                  <div
                    key={p.id || idx}
                    onClick={() => {
                      setActivePlanIndex(idx);
                      setIsSection2Open(true);
                    }}
                    className="p-3.5 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 space-y-2 cursor-pointer transition-all hover:shadow-xs group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-slate-900 group-hover:text-emerald-700 truncate">
                        {p.name}
                      </span>
                      <span className="font-extrabold text-xs text-emerald-700">
                        {p.price.toLocaleString('vi-VN')}đ
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-500 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700 truncate max-w-[130px]">
                        {fulfillmentLabel.split('-')[0].trim()}
                      </span>
                      {p.serviceDuration && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                          {p.serviceDuration.value} {p.serviceDuration.unit === 'MONTH' ? 'Tháng' : p.serviceDuration.unit === 'YEAR' ? 'Năm' : 'Ngày'}
                        </span>
                      )}
                      {(p.fulfillmentType === 'PRE_CREATED_ACCOUNT' || p.fulfillmentType === 'LICENSE_KEY') && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">
                          {linesCount} tài khoản/key
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div
              onClick={() => setIsSection2Open(true)}
              className="text-center py-1 text-xs font-bold text-emerald-700 hover:underline cursor-pointer flex items-center justify-center gap-1"
            >
              <span>Bấm vào gói để mở rộng và chỉnh sửa chi tiết</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </div>
          </div>
        )}

        {/* FULL CONTENT WHEN SECTION 2 IS EXPANDED */}
        {isSection2Open && (
          <div className="space-y-6">
            {/* Plan Tabs Switcher */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {plans.map((p, idx) => {
            const isActive = idx === activePlanIndex;
            return (
              <button
                key={p.id || idx}
                type="button"
                onClick={() => setActivePlanIndex(idx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{p.name}</span>
                <span className="ml-1.5 opacity-70">({p.price.toLocaleString('vi-VN')}đ)</span>
              </button>
            );
          })}
        </div>

        {/* Current Active Plan Details */}
        {curPlan && (
          <div className="bg-slate-50/70 rounded-2xl border border-slate-200 p-5 space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cấu hình chi tiết: <strong className="text-slate-900">{curPlan.name}</strong>
              </span>

              {plans.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemovePlan(activePlanIndex)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa gói này</span>
                </button>
              )}
            </div>

            {/* Plan Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên gói cước</label>
                <input
                  type="text"
                  value={curPlan.name}
                  onChange={(e) => updateCurrentPlan({ name: e.target.value })}
                  className="w-full text-xs font-medium px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="VD: Gói 1 Năm Cá Nhân (12 Tháng)"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Hình thức giao hàng / Kích hoạt <span className="text-rose-500">*</span>
                </label>
                <select
                  value={curPlan.fulfillmentType}
                  onChange={(e) => handleFulfillmentTypeChange(e.target.value as AppAccountFulfillmentType)}
                  className="w-full text-xs font-medium px-3.5 py-2 bg-white border border-emerald-300 rounded-xl focus:ring-2 focus:ring-emerald-500 cursor-pointer font-bold text-emerald-950"
                >
                  {FULFILLMENT_TYPES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {FULFILLMENT_TYPES.find((f) => f.value === curPlan.fulfillmentType)?.desc}
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Giá bán (VNĐ)</label>
                <input
                  type="number"
                  value={curPlan.price}
                  onChange={(e) => updateCurrentPlan({ price: Number(e.target.value) })}
                  className="w-full text-xs font-medium px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Giá gốc niêm yết (VNĐ - Gạch giá)</label>
                <input
                  type="number"
                  value={curPlan.originalPrice || ''}
                  onChange={(e) => updateCurrentPlan({ originalPrice: Number(e.target.value) || undefined })}
                  className="w-full text-xs font-medium px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                  placeholder="Tùy chọn"
                />
              </div>
            </div>

            {/* Decoupled Duration Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-200">
              <div>
                <ServiceDurationInput
                  value={curPlan.serviceDuration || { value: 1, unit: 'MONTH' }}
                  onChange={(dur) => updateCurrentPlan({ serviceDuration: dur })}
                />
              </div>

              <div>
                <WarrantyDurationInput
                  value={curPlan.warrantyDuration || { value: 1, unit: 'MONTH' }}
                  onChange={(dur) => updateCurrentPlan({ warrantyDuration: dur })}
                />
              </div>
            </div>

            {/* ========================================================================= */}
            {/* DYNAMIC FULFILLMENT SECTION                                               */}
            {/* ========================================================================= */}

            {/* CASE 1: PRE_CREATED_ACCOUNT (TÀI KHOẢN CẤP SẴN - VAULT) */}
            {curPlan.fulfillmentType === 'PRE_CREATED_ACCOUNT' && (
              <div className="pt-4 border-t border-slate-200 space-y-4 bg-white p-4 rounded-xl border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-200">
                        <Key className="w-4 h-4" />
                      </span>
                      <span>📦 Kho Tài Khoản Cấp Sẵn (Vault) - Người Bán Nhập Để Giao Tự Động</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Hệ thống tự động cấp tài khoản từ kho cho người mua ngay sau khi thanh toán VietQR thành công.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Đã phát hiện: {detectedCount} tài khoản
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>Không yêu cầu người mua điền thông tin:</strong> Với hình thức Tài khoản cấp sẵn, người mua chỉ cần bấm Mua ngay và thanh toán VietQR. Hệ thống sẽ tự động gửi thông tin tài khoản cho khách.
                  </span>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setInventoryInputMode('TEXT_LIST')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      inventoryInputMode === 'TEXT_LIST' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Danh sách tài khoản (Text / Hàng loạt)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryInputMode('MARKDOWN')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      inventoryInputMode === 'MARKDOWN' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Nội dung bàn giao / Markdown / Token
                  </button>
                  <button
                    type="button"
                    onClick={() => setInventoryInputMode('FILE')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-colors cursor-pointer ${
                      inventoryInputMode === 'FILE' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Tải File đính kèm (.txt, .md, .doc)
                  </button>
                </div>

                {/* Text List Input */}
                {inventoryInputMode === 'TEXT_LIST' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Mỗi dòng 1 tài khoản theo định dạng: <code className="text-indigo-600 font-bold">tài_khoản|mật_khẩu|mã_2fa|email_khôi_phục</code></span>
                      <span className="font-bold text-indigo-600">{detectedCount} tài khoản</span>
                    </div>
                    <textarea
                      rows={5}
                      value={curPlan.inventoryText || ''}
                      onChange={(e) => updateCurrentPlan({ inventoryText: e.target.value, inventoryFormat: 'TEXT_LIST' })}
                      placeholder={`chatgpt.user01@gmail.com|P@ssw0rdSecure1|2FA_SECRET_KEY|recovery@gmail.com\nchatgpt.user02@gmail.com|P@ssw0rdSecure2`}
                      className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all leading-relaxed"
                    />
                  </div>
                )}

                {/* Markdown Input */}
                {inventoryInputMode === 'MARKDOWN' && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-slate-500">
                      Nhập toàn bộ thông tin đăng nhập, token, cookie hoặc hướng dẫn chi tiết bàn giao cho người mua:
                    </p>
                    <textarea
                      rows={5}
                      value={curPlan.inventoryText || ''}
                      onChange={(e) => updateCurrentPlan({ inventoryText: e.target.value, inventoryFormat: 'MARKDOWN' })}
                      placeholder={`# THÔNG TIN BÀN GIAO TÀI KHOẢN\n- Email: user@gmail.com\n- Password: [Mật khẩu bàn giao]\n- Cookie/Session: eyJhbGci...`}
                      className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all leading-relaxed"
                    />
                  </div>
                )}

                {/* File Upload */}
                {inventoryInputMode === 'FILE' && (
                  <div className="space-y-2 p-4 border border-dashed border-slate-300 rounded-xl text-center bg-slate-50">
                    <Upload className="w-6 h-6 text-indigo-600 mx-auto" />
                    <p className="text-xs font-bold text-slate-800">Chọn file danh sách tài khoản hoặc tài liệu hướng dẫn</p>
                    <p className="text-[11px] text-slate-500">Hỗ trợ các định dạng .txt, .csv, .md, .docx, .json (Tối đa 10MB)</p>
                    <input
                      type="file"
                      accept=".txt,.csv,.md,.doc,.docx,.json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          updateCurrentPlan({
                            inventoryFileName: file.name,
                            inventoryFormat: 'FILE',
                            inventoryText: `[Đã đính kèm file tài khoản: ${file.name} - ${(file.size / 1024).toFixed(1)} KB]`,
                          });
                        }
                      }}
                      className="text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                    />
                    {curPlan.inventoryFileName && (
                      <p className="text-xs text-emerald-600 font-bold mt-1">
                        ✓ Đã đính kèm: {curPlan.inventoryFileName}
                      </p>
                    )}
                  </div>
                )}

                {/* Delivery Guide / Instructions */}
                <div className="space-y-1 pt-2">
                  <label className="block text-xs font-bold text-slate-700">
                    Hướng dẫn đăng nhập & Lưu ý bàn giao cho người mua
                  </label>
                  <textarea
                    rows={3}
                    value={curPlan.deliveryGuideMarkdown || ''}
                    onChange={(e) => updateCurrentPlan({ deliveryGuideMarkdown: e.target.value })}
                    placeholder="1. Đăng nhập tại trang chủ... 2. Không thay đổi phương thức thanh toán..."
                    className="w-full text-xs font-medium px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {/* Live Preview */}
                <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Xem trước giao diện người mua nhận được sau khi thanh toán VietQR:</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="font-bold text-indigo-900">Thông tin tài khoản cấp sẵn</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold">Bàn giao tức thì</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Tài khoản:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {curPlan.inventoryText?.split('\n')[0]?.split('|')[0] || 'user@example.com'}
                        </span>
                      </div>
                      <div className="p-2 bg-slate-50 rounded border border-slate-200">
                        <span className="text-slate-400 block text-[10px]">Mật khẩu:</span>
                        <span className="font-mono font-bold text-slate-800">•••••••••••</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CASE 2: LICENSE_KEY */}
            {curPlan.fulfillmentType === 'LICENSE_KEY' && (
              <div className="pt-4 border-t border-slate-200 space-y-4 bg-white p-4 rounded-xl border">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
                      <span className="p-1 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
                        <Key className="w-4 h-4" />
                      </span>
                      <span>🔑 Kho Mã Bản Quyền (License Keys) - Tự Động Trích Xuất</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Nhập danh sách mã kích hoạt bản quyền. Hệ thống sẽ tự động trích 1 key cho mỗi đơn hàng thanh toán thành công.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Đã nhập: {detectedCount} key
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>
                    <strong>Không yêu cầu người mua điền thông tin:</strong> Người mua chỉ cần thanh toán và nhận ngay chuỗi mã License Key kèm link tải chính thức.
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    Danh sách License Key (Mỗi dòng 1 key)
                  </label>
                  <textarea
                    rows={4}
                    value={curPlan.inventoryText || ''}
                    onChange={(e) => updateCurrentPlan({ inventoryText: e.target.value, inventoryFormat: 'LICENSE_KEYS' })}
                    placeholder={`XXXXX-XXXXX-XXXXX-XXXXX\nYYYYY-YYYYY-YYYYY-YYYYY\nZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ`}
                    className="w-full text-xs font-mono px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Link tải phần mềm chính thức (Download URL)
                    </label>
                    <input
                      type="text"
                      value={curPlan.activationUrl || ''}
                      onChange={(e) => updateCurrentPlan({ activationUrl: e.target.value })}
                      placeholder="https://official-download.com/setup.exe"
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Hướng dẫn kích hoạt bản quyền
                    </label>
                    <input
                      type="text"
                      value={curPlan.deliveryGuideMarkdown || ''}
                      onChange={(e) => updateCurrentPlan({ deliveryGuideMarkdown: e.target.value })}
                      placeholder="VD: Cài đặt phần mềm, vào Cài đặt -> Nhập License Key..."
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CASE 3: FAMILY_OR_TEAM_INVITATION */}
            {curPlan.fulfillmentType === 'FAMILY_OR_TEAM_INVITATION' && (
              <div className="pt-4 border-t border-slate-200 space-y-4 bg-white p-4 rounded-xl border">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-purple-50 text-purple-600 border border-purple-200">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      👥 Hình Thức Mời Nhóm Family / Team (Người mua chỉ cần gửi Email)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Quy trình: Người mua điền Email của họ khi thanh toán ➔ Sau khi thanh toán, shop nhận Email khách và gửi lời mời gia nhập nhóm.
                    </p>
                  </div>
                </div>

                <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3.5 space-y-2 text-xs text-purple-900">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-purple-700" />
                    <span>Hệ thống tự động thiết lập trường thông tin cho Người Mua:</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-purple-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900">Email tài khoản người mua nhận lời mời</span>
                      <span className="text-slate-400 block text-[10px]">Bắt buộc người mua phải điền khi thanh toán</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-bold">Kiểu Email</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Hướng dẫn người mua chấp nhận lời mời (Hiển thị sau khi thanh toán)
                  </label>
                  <textarea
                    rows={2}
                    value={curPlan.deliveryGuideMarkdown || ''}
                    onChange={(e) => updateCurrentPlan({ deliveryGuideMarkdown: e.target.value })}
                    placeholder="Vui lòng kiểm tra hộp thư email (bao gồm cả thư rác / Spam) và click nút 'Chấp nhận lời mời'..."
                    className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* CASE 4: BUYER_EMAIL_ACTIVATION */}
            {curPlan.fulfillmentType === 'BUYER_EMAIL_ACTIVATION' && (
              <div className="pt-4 border-t border-slate-200 space-y-4 bg-white p-4 rounded-xl border">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-extrabold text-slate-900">
                      ⚡ Kích Hoạt Bản Quyền Qua Email / Invite Link Khách Hàng
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Khách hàng cung cấp email để nhận lời mời kích hoạt bản quyền hoặc link tham gia Workspace / Team an toàn.
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-emerald-900 text-xs">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Chính sách bảo vệ tài khoản người mua:</span> Tuyệt đối <strong>không yêu cầu mật khẩu hoặc OTP</strong> của khách hàng. Mọi quy trình kích hoạt chính chủ được thực hiện an toàn qua lời mời gửi tới Email của khách.
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Trường thông tin khách hàng cung cấp:</span>
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block text-[10px]">Trường #1 (Bắt buộc)</span>
                      <strong className="text-slate-900">Email khách hàng cần kích hoạt bản quyền / nhận invite link</strong>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Cam kết thời gian & Hướng dẫn khách sau khi thanh toán
                  </label>
                  <textarea
                    rows={2}
                    value={curPlan.deliveryGuideMarkdown || ''}
                    onChange={(e) => updateCurrentPlan({ deliveryGuideMarkdown: e.target.value })}
                    placeholder="Shop sẽ gửi link kích hoạt bản quyền qua email của bạn trong vòng 15-30 phút..."
                    className="w-full text-xs px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>
            )}

            {/* CASE 5: MANUAL_SERVICE */}
            {curPlan.fulfillmentType === 'MANUAL_SERVICE' && (
              <div className="pt-4 border-t border-slate-200 space-y-4 bg-white p-4 rounded-xl border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Key className="w-4 h-4 text-indigo-600" />
                      <span>Trường thông tin người mua cần điền khi thanh toán</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Áp dụng cho dịch vụ tùy biến thủ công theo yêu cầu riêng của người bán.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBuyerField}
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm trường</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(curPlan.requiredBuyerFields || []).map((field, fIdx) => {
                    const violation = checkSecurityViolations(field, curPlan.fulfillmentType);
                    return (
                      <div
                        key={fIdx}
                        className={`bg-white rounded-xl border p-3.5 space-y-3 shadow-xs ${
                          violation ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold text-slate-800">
                            Trường #{fIdx + 1}: {field.label}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveBuyerField(fIdx)}
                            className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {violation && (
                          <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{violation}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Mã trường (Key)</label>
                            <input
                              type="text"
                              value={field.key}
                              onChange={(e) => handleUpdateBuyerField(fIdx, { key: e.target.value })}
                              className="w-full text-xs font-mono px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                              placeholder="buyerEmail"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Tiêu đề trường</label>
                            <input
                              type="text"
                              value={field.label}
                              onChange={(e) => handleUpdateBuyerField(fIdx, { label: e.target.value })}
                              className="w-full text-xs font-medium px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg"
                              placeholder="VD: Email nhận kích hoạt"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">Kiểu dữ liệu</label>
                            <select
                              value={field.type}
                              onChange={(e) => handleUpdateBuyerField(fIdx, { type: e.target.value as any })}
                              className="w-full text-xs font-medium px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                            >
                              <option value="EMAIL">Email</option>
                              <option value="TEXT">Văn bản (Text)</option>
                              <option value="SELECT">Lựa chọn (Select)</option>
                              <option value="BOOLEAN">Đúng / Sai (Boolean)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Plan Features Bullet Points */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  Đặc quyền / Tính năng nổi bật của gói cước
                </label>
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-900 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm dòng</span>
                </button>
              </div>

              <div className="space-y-1.5">
                {(curPlan.features || []).map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    <input
                      type="text"
                      value={feat}
                      onChange={(e) => handleUpdateFeature(fIdx, e.target.value)}
                      className="flex-1 text-xs font-medium px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(fIdx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

            {/* Bottom Section 2: Completion and Collapse button */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                ✓ Đã cấu hình {plans.length} gói cước với hình thức bàn giao tự động.
              </span>
              <button
                type="button"
                onClick={() => setIsSection2Open(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1.5 self-end sm:self-auto"
              >
                <ChevronUp className="w-4 h-4" />
                <span>Thu gọn Phần 2 ▲</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
        >
          Hủy bỏ
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Đang lưu sản phẩm...' : isEditing ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm & Đăng bán'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW APPLICATION (NOT IN SAMPLE LIBRARY)                     */}
      {/* ========================================================================= */}
      {showCreateAppModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Thêm Ứng Dụng Mới Vào Thư Viện
                  </h3>
                  <p className="text-xs text-slate-500">Tự tạo ứng dụng của bạn để đăng bán tài khoản bản quyền</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateAppModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Popular App Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Gợi ý nhanh ứng dụng phổ biến (Bấm để điền tự động):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {APP_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 transition-colors cursor-pointer"
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên Ứng Dụng Mới <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  placeholder="VD: Claude AI (Anthropic) hoặc Midjourney"
                  className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Danh mục ứng dụng</label>
                  <select
                    value={newAppCategory}
                    onChange={(e) => setNewAppCategory(e.target.value as ApplicationCategory)}
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Website chính thức (URL)</label>
                  <input
                    type="text"
                    value={newAppWebsite}
                    onChange={(e) => setNewAppWebsite(e.target.value)}
                    placeholder="https://claude.ai"
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-bold text-slate-700">
                    Logo / Icon Ứng Dụng (Link hoặc Tải lên)
                  </label>
                  <label className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors">
                    <Upload className="w-3 h-3" />
                    <span>Tải ảnh từ máy tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNewAppLogoUpload}
                    />
                  </label>
                </div>

                <div className="flex gap-2 items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newAppLogo}
                      onChange={(e) => handleNewAppLogoChange(e.target.value)}
                      placeholder="Dán link ảnh (.png, .jpg, .webp) hoặc link tìm kiếm..."
                      className={`w-full text-xs px-3 pr-7 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 ${
                        newAppLogoError
                          ? 'border-amber-400 focus:ring-amber-500'
                          : 'border-slate-200 focus:ring-emerald-500'
                      }`}
                    />
                    {newAppLogo && (
                      <button
                        type="button"
                        onClick={() => {
                          setNewAppLogo('');
                          setNewAppLogoError(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                        title="Xóa link ảnh"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Preview box */}
                  <div className="w-9 h-9 rounded-xl border border-slate-200 bg-white p-0.5 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs">
                    {newAppLogo && !newAppLogoError ? (
                      <img
                        src={newAppLogo}
                        alt="logo preview"
                        onError={() => setNewAppLogoError(true)}
                        className="w-full h-full object-contain rounded-lg"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                        {newAppName ? newAppName.charAt(0) : 'App'}
                      </span>
                    )}
                  </div>
                </div>

                {newAppLogoError && (
                  <p className="text-[10px] text-amber-700 font-medium">
                    ⚠️ Link ảnh không hiển thị được trực tiếp. Hãy bấm <strong>Tải ảnh từ máy tính</strong> để chọn ảnh từ máy!
                  </p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mô tả ngắn</label>
                <textarea
                  rows={2}
                  value={newAppDescription}
                  onChange={(e) => setNewAppDescription(e.target.value)}
                  placeholder="Mô tả công dụng của ứng dụng..."
                  className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateAppModal(false)}
                  className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={creatingApp || !newAppName.trim()}
                  onClick={handleCreateNewApplication}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:bg-emerald-400 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{creatingApp ? 'Đang tạo...' : 'Tạo & Chọn Ứng Dụng Này'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGE TEMPLATE LIBRARY (EDIT, DELETE, RESET BROKEN IMAGES)         */}
      {/* ========================================================================= */}
      {showManageCatalogModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Settings className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {editingCatalogApp ? `Chỉnh Sửa Mẫu: ${editingCatalogApp.name}` : 'Quản Lý Thư Viện Ứng Dụng Mẫu'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {editingCatalogApp
                      ? 'Cập nhật logo (tải từ máy tính/link), tên và thông tin ứng dụng mẫu'
                      : 'Sửa ảnh bị lỗi, tải ảnh từ máy, xóa mẫu thừa hoặc khôi phục danh mục chuẩn'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowManageCatalogModal(false);
                  setEditingCatalogApp(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* If in edit mode for a specific app */}
            {editingCatalogApp ? (
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setEditingCatalogApp(null)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại danh sách mẫu</span>
                  </button>
                  <span className="text-[11px] text-slate-400">ID: {editingCatalogApp.id}</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên Ứng Dụng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editAppName}
                    onChange={(e) => setEditAppName(e.target.value)}
                    className="w-full text-xs font-medium px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Danh mục</label>
                    <select
                      value={editAppCategory}
                      onChange={(e) => setEditAppCategory(e.target.value as ApplicationCategory)}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Website chính thức</label>
                    <input
                      type="text"
                      value={editAppWebsite}
                      onChange={(e) => setEditAppWebsite(e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                    />
                  </div>
                </div>

                {/* Edit App Logo with File Picker and URL Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-slate-700">
                      Ảnh Logo Ứng Dụng (Khắc phục lỗi ảnh)
                    </label>
                    <label className="text-[10px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition-colors">
                      <Upload className="w-3 h-3" />
                      <span>Tải ảnh từ máy tính</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleEditAppLogoUpload}
                      />
                    </label>
                  </div>

                  <div className="flex gap-2 items-center">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={editAppLogo}
                        onChange={(e) => handleEditAppLogoChange(e.target.value)}
                        placeholder="Dán link ảnh (.png, .svg, .webp, data:image...)"
                        className={`w-full text-xs px-3 pr-7 py-2 bg-slate-50 border rounded-xl focus:bg-white focus:ring-2 ${
                          editAppLogoError ? 'border-amber-400 focus:ring-amber-500' : 'border-slate-200 focus:ring-emerald-500'
                        }`}
                      />
                      {editAppLogo && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditAppLogo('');
                            setEditAppLogoError(false);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          title="Xóa link ảnh"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white p-1 flex items-center justify-center flex-shrink-0 shadow-xs overflow-hidden">
                      <AppIconImage
                        src={editAppLogo}
                        alt={editAppName}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  {editAppLogoError && (
                    <p className="text-[10px] text-amber-700 font-medium">
                      ⚠️ Link ảnh không hiển thị được. Hãy bấm <strong>Tải ảnh từ máy tính</strong> để chọn file ảnh từ máy của bạn!
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mô tả ứng dụng</label>
                  <textarea
                    rows={2}
                    value={editAppDescription}
                    onChange={(e) => setEditAppDescription(e.target.value)}
                    placeholder="Mô tả công dụng và tính năng chính..."
                    className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingCatalogApp(null)}
                    className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    disabled={savingCatalogApp || !editAppName.trim()}
                    onClick={handleSaveEditCatalogApp}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm cursor-pointer disabled:bg-emerald-400 flex items-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>{savingCatalogApp ? 'Đang lưu...' : 'Lưu Thay Đổi Mẫu'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* List of all templates with Edit, Delete & Reset catalog */
              <div className="space-y-4">
                {/* Reset Catalog Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-950">
                        Khôi phục danh mục mẫu chuẩn (14 Ứng Dụng Chuẩn)
                      </p>
                      <p className="text-[11px] text-emerald-800">
                        Tự động sửa toàn bộ các mẫu bị lỗi ảnh, trang bị logo vector SVG sắc nét không phụ thuộc mạng.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={resettingCatalog}
                    onClick={handleResetCatalog}
                    className="px-3.5 py-1.5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer flex-shrink-0 transition-colors"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${resettingCatalog ? 'animate-spin' : ''}`} />
                    <span>{resettingCatalog ? 'Đang khôi phục...' : '↺ Khôi phục chuẩn'}</span>
                  </button>
                </div>

                {/* Templates List */}
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-3 rounded-2xl border border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <AppIconImage
                          src={app.logo || app.logoUrl}
                          alt={app.name}
                          className="w-9 h-9 rounded-xl object-contain bg-white p-1 border border-slate-200 flex-shrink-0 shadow-xs"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-bold text-slate-900 truncate">{app.name}</p>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-slate-200 text-slate-700">
                              {app.category}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-md">
                            {app.description || app.officialWebsiteUrl || 'Mẫu ứng dụng'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditCatalogApp(app)}
                          className="px-2.5 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 hover:border-emerald-300 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="Chỉnh sửa tên hoặc thay logo từ máy tính"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCatalogApp(app.id, app.name)}
                          className="p-1.5 bg-white hover:bg-rose-50 text-rose-600 hover:border-rose-300 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-colors shadow-xs"
                          title="Xóa mẫu này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[11px] text-slate-400">
                    Tổng cộng: <strong>{applications.length}</strong> ứng dụng trong thư viện
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowManageCatalogModal(false)}
                    className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
};
