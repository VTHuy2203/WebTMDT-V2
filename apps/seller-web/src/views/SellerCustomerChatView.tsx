import React, { useState } from 'react';
import {
  MessageCircle,
  Search,
  Send,
  Sparkles,
  ShieldCheck,
  Package,
  Clock,
  CheckCheck,
  Check,
  User,
  Tag,
  Gift,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  ShoppingBag,
  Paperclip,
  Smile,
  Zap,
  Filter,
  X,
  Plus,
  CheckCircle2,
  FileText,
  Gamepad2,
  Cpu,
} from 'lucide-react';
import { formatCurrency } from '@marketplace/utils';

interface BuyerConversation {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerAvatar: string;
  buyerPhone: string;
  buyerEmail: string;
  buyerAddress: string;
  isOnline: boolean;
  unreadCount: number;
  lastActive: string;
  customerTag: 'VIP' | 'LOYAL' | 'NEW' | 'ORDER_ACTIVE';
  totalSpent: number;
  orderCount: number;
  inquiryProduct?: {
    id: string;
    name: string;
    price: number;
    image: string;
    category: 'TECH' | 'APP' | 'GAME';
    stockStatus: string;
  };
  recentOrders?: {
    code: string;
    date: string;
    total: number;
    statusText: string;
    statusColor: string;
  }[];
  messages: {
    id: string;
    sender: 'buyer' | 'seller';
    text: string;
    time: string;
    status?: 'SENT' | 'DELIVERED' | 'READ';
    voucherAttachment?: {
      code: string;
      discount: string;
      minSpend: string;
    };
  }[];
}

const INITIAL_CONVERSATIONS: BuyerConversation[] = [
  {
    id: 'conv_1',
    buyerId: 'usr_an_01',
    buyerName: 'Nguyễn Văn An',
    buyerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    buyerPhone: '0912 345 678',
    buyerEmail: 'nguyenvanan@gmail.com',
    buyerAddress: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, P. 22, Q. Bình Thạnh, TP. Hồ Chí Minh',
    isOnline: true,
    unreadCount: 1,
    lastActive: 'Vừa mới đây',
    customerTag: 'VIP',
    totalSpent: 42500000,
    orderCount: 3,
    inquiryProduct: {
      id: 'prod_rog_strix',
      name: 'Laptop Gaming ASUS ROG Strix G16 (2024) i9-14900HX RTX 4060',
      price: 38990000,
      image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500',
      category: 'TECH',
      stockStatus: 'Còn 12 máy tại kho TP.HCM',
    },
    recentOrders: [
      {
        code: 'VN20240911-100294',
        date: '10/09/2026',
        total: 38990000,
        statusText: 'Đã giao hàng',
        statusColor: 'bg-emerald-100 text-emerald-800',
      },
      {
        code: 'VN20240815-44210',
        date: '15/08/2026',
        total: 3510000,
        statusText: 'Hoàn tất',
        statusColor: 'bg-blue-100 text-blue-800',
      },
    ],
    messages: [
      {
        id: 'm1_1',
        sender: 'buyer',
        text: 'Shop ơi, dòng ASUS ROG Strix G16 này bản RTX 4060 còn seal nguyên hộp chính hãng ASUS VN/A không ạ?',
        time: '14:20',
      },
      {
        id: 'm1_2',
        sender: 'seller',
        text: 'Dạ chào anh An! Sản phẩm hoàn toàn nguyên seal 100% từ ASUS Việt Nam, bảo hành điện tử chính hãng 24 tháng tại các TTBH ASUS toàn quốc ạ.',
        time: '14:22',
        status: 'READ',
      },
      {
        id: 'm1_3',
        sender: 'buyer',
        text: 'Bên shop có hỗ trợ nâng cấp thêm 1 thanh RAM Kingston 16GB DDR5 luôn trước khi giao không shop?',
        time: '14:24',
      },
      {
        id: 'm1_4',
        sender: 'seller',
        text: 'Dạ có anh nhé! Kỹ thuật viên của GEARVN hỗ trợ lắp RAM miễn phí công lắp và dán tem bảo hành phụ kiện riêng biệt, không làm ảnh hưởng bảo hành chính hãng máy ạ.',
        time: '14:25',
        status: 'READ',
      },
      {
        id: 'm1_5',
        sender: 'buyer',
        text: 'Tuyệt vời, shop giữ máy giúp mình nhé, mình đặt và thanh toán qua mã QR ngay bây giờ.',
        time: '14:26',
      },
    ],
  },
  {
    id: 'conv_2',
    buyerId: 'usr_mai_02',
    buyerName: 'Trần Thị Mai',
    buyerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
    buyerPhone: '0988 765 432',
    buyerEmail: 'tranmai.work@gmail.com',
    buyerAddress: '15 Duy Tân, Cầu Giấy, Hà Nội',
    isOnline: true,
    unreadCount: 1,
    lastActive: '3 phút trước',
    customerTag: 'NEW',
    totalSpent: 450000,
    orderCount: 1,
    inquiryProduct: {
      id: 'app_chatgpt',
      name: 'Tài khoản ChatGPT Plus GPT-4o Cá Nhân (Cấp Sẵn Riêng Tư)',
      price: 450000,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500',
      category: 'APP',
      stockStatus: 'Bàn giao tự động 24/7',
    },
    recentOrders: [
      {
        code: 'VN20240912-99014',
        date: '12/09/2026',
        total: 450000,
        statusText: 'Đang bàn giao',
        statusColor: 'bg-amber-100 text-amber-800',
      },
    ],
    messages: [
      {
        id: 'm2_1',
        sender: 'buyer',
        text: 'Chào shop, gói ChatGPT Plus này mình dùng email riêng của mình hay là tài khoản shop tạo sẵn ạ?',
        time: '14:10',
      },
      {
        id: 'm2_2',
        sender: 'seller',
        text: 'Dạ chào chị Mai! Gói này là tài khoản tạo sẵn riêng tư 1 người dùng độc quyền, bảo mật 100% dữ liệu và có hỗ trợ đổi sang email cá nhân của chị nếu cần ạ.',
        time: '14:12',
        status: 'READ',
      },
      {
        id: 'm2_3',
        sender: 'buyer',
        text: 'Có được dùng tính năng Voice Mode nâng cao và tạo tranh vẽ DALL-E không giới hạn không shop?',
        time: '14:15',
      },
    ],
  },
  {
    id: 'conv_3',
    buyerId: 'usr_long_03',
    buyerName: 'Lê Hoàng Long',
    buyerAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
    buyerPhone: '0903 112 233',
    buyerEmail: 'longle.gaming@gmail.com',
    buyerAddress: 'Quận Hải Châu, Đà Nẵng',
    isOnline: false,
    unreadCount: 0,
    lastActive: '25 phút trước',
    customerTag: 'LOYAL',
    totalSpent: 3800000,
    orderCount: 4,
    inquiryProduct: {
      id: 'ga_001',
      name: 'Nick Valorant Full Skin Vandal Prime + Kuronami + Champions 2024',
      price: 1250000,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500',
      category: 'GAME',
      stockStatus: 'Kho Vault bảo mật',
    },
    messages: [
      {
        id: 'm3_1',
        sender: 'buyer',
        text: 'Shop ơi nick Valorant này thông tin trắng hoàn toàn đúng không? Mua xong có mã đổi mail gốc tức thì không shop?',
        time: '13:45',
      },
      {
        id: 'm3_2',
        sender: 'seller',
        text: 'Dạ chuẩn anh Long nhé! Tài khoản được lưu trên Vault mã hóa của sàn, khi anh thanh toán thành công sàn tự động gửi kèm mã bảo mật để anh liên kết mail chính chủ ngay ạ.',
        time: '13:48',
        status: 'READ',
      },
    ],
  },
  {
    id: 'conv_4',
    buyerId: 'usr_bao_04',
    buyerName: 'Phạm Quốc Bảo',
    buyerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
    buyerPhone: '0977 889 900',
    buyerEmail: 'quocbao@techcorp.vn',
    buyerAddress: 'Khu công nghệ cao, TP. Thủ Đức, TP.HCM',
    isOnline: false,
    unreadCount: 0,
    lastActive: '1 giờ trước',
    customerTag: 'ORDER_ACTIVE',
    totalSpent: 16500000,
    orderCount: 2,
    inquiryProduct: {
      id: 'prod_screen_samsung',
      name: 'Màn Hình Gaming Samsung Odyssey G7 28 inch 4K 144Hz IPS',
      price: 12490000,
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500',
      category: 'TECH',
      stockStatus: 'Sẵn hàng kho',
    },
    messages: [
      {
        id: 'm4_1',
        sender: 'buyer',
        text: 'Shop ơi màn hình đóng gói gửi đi các tỉnh xa có bọc xốp chống sốc chắc chắn không shop?',
        time: '12:30',
      },
      {
        id: 'm4_2',
        sender: 'seller',
        text: 'Dạ bên em bọc 5 lớp xốp hơi và đóng kiện khung gỗ chuyên dụng cho màn hình, bảo hiểm cấn vỡ 100% đổi mới ngay nên anh hoàn toàn yên tâm ạ!',
        time: '12:35',
        status: 'READ',
      },
    ],
  },
];

const QUICK_CANVAS_RESPONSES = [
  {
    label: '📦 Báo còn sẵn hàng',
    text: 'Dạ sản phẩm đang có sẵn hàng tại kho GEARVN, bạn đặt hàng shop sẽ đóng gói và bàn giao ngay trong 2 giờ ạ!',
  },
  {
    label: '⚡ Kích hoạt tự động 24/7',
    text: 'Dạ tài khoản bản quyền AI / game được cấp tự động 24/7 tức thì qua hệ thống ngay sau khi quét mã QR thanh toán ạ.',
  },
  {
    label: '🛡️ Bảo hành 1 đổi 1',
    text: 'Dạ chính sách của shop là bảo hành 1 đổi 1 trong toàn bộ thời gian sử dụng, cam kết hoàn tiền 100% nếu phát sinh lỗi ạ.',
  },
  {
    label: '🎁 Tặng Voucher 50K',
    text: 'Shop gửi tặng bạn mã giảm giá 50.000đ áp dụng ngay cho đơn hàng này: GEARVN50. Chúc bạn có trải nghiệm mua sắm tuyệt vời!',
    voucher: {
      code: 'GEARVN50',
      discount: '50.000 ₫',
      minSpend: 'Đơn từ 500.000 ₫',
    },
  },
];

export const SellerCustomerChatView: React.FC = () => {
  const [conversations, setConversations] = useState<BuyerConversation[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string>('conv_1');
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'ORDERS' | 'DIGITAL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [internalNote, setInternalNote] = useState('Khách VIP tiềm năng, quan tâm đồ công nghệ cao cấp. Cần ưu tiên giao nhanh.');
  const [showInternalNoteSaved, setShowInternalNoteSaved] = useState(false);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const activeConversation = conversations.find((c) => c.id === activeConvId) || conversations[0];

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (filterTab === 'UNREAD' && c.unreadCount === 0) return false;
    if (filterTab === 'ORDERS' && (!c.recentOrders || c.recentOrders.length === 0)) return false;
    if (filterTab === 'DIGITAL' && c.inquiryProduct?.category === 'TECH') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.buyerName.toLowerCase().includes(q) ||
        c.inquiryProduct?.name.toLowerCase().includes(q) ||
        c.messages.some((m) => m.text.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Handle Send Message
  const handleSendMessage = (textToSend?: string, voucherAttachment?: any) => {
    const content = (textToSend || inputText).trim();
    if (!content && !voucherAttachment) return;

    const newMessage = {
      id: `m_${Date.now()}`,
      sender: 'seller' as const,
      text: content,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      status: 'SENT' as const,
      voucherAttachment,
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConvId) {
          return {
            ...c,
            unreadCount: 0,
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );

    if (!textToSend) {
      setInputText('');
    }
  };

  // Select conversation & mark as read
  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unreadCount: 0 } : c))
    );
  };

  // Save internal note
  const handleSaveNote = () => {
    setShowInternalNoteSaved(true);
    setTimeout(() => setShowInternalNoteSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-blue-500/20">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  Trung Tâm Chat & Chăm Sóc Người Mua Hàng
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Đang trực tuyến
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Kết nối trực tiếp 2 chiều với khách hàng • Giải đáp thắc mắc, tư vấn cấu hình, bàn giao tài khoản và gửi ưu đãi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-slate-400 block font-medium">Tỷ lệ phản hồi tin nhắn</span>
            <span className="text-sm font-extrabold text-emerald-600">99.8% (Trung bình 1.2 phút)</span>
          </div>
        </div>
      </div>

      {/* Main 3-Column Messenger Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[780px] rounded-3xl bg-white border border-slate-200/80 shadow-lg overflow-hidden">
        
        {/* ========================================================= */}
        {/* COLUMN 1: CONVERSATIONS LIST (lg:col-span-4)              */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 border-r border-slate-200/80 flex flex-col h-full bg-slate-50/50">
          {/* Search Box */}
          <div className="p-4 border-b border-slate-200/80 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm khách hàng, sản phẩm, tin nhắn..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 mt-3 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterTab('ALL')}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === 'ALL'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('UNREAD')}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === 'UNREAD'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Chưa đọc (2)
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('ORDERS')}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === 'ORDERS'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Có đơn hàng
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('DIGITAL')}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  filterTab === 'DIGITAL'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tài khoản số
              </button>
            </div>
          </div>

          {/* Conversations Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-2">
                <MessageCircle className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs">Không tìm thấy cuộc trò chuyện phù hợp</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === activeConvId;
                const lastMsg = conv.messages[conv.messages.length - 1];

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className={`p-3.5 flex items-start gap-3 transition-all cursor-pointer select-none relative ${
                      isSelected
                        ? 'bg-blue-50/80 border-l-4 border-blue-600'
                        : 'hover:bg-slate-100/70 bg-white'
                    }`}
                  >
                    {/* Buyer Avatar & Online dot */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.buyerAvatar}
                        alt={conv.buyerName}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-white shadow-xs"
                      />
                      {conv.isOnline && (
                        <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                      )}
                    </div>

                    {/* Meta info & snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {conv.buyerName}
                          </span>
                          {conv.customerTag === 'VIP' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-100 text-amber-800">
                              VIP
                            </span>
                          )}
                          {conv.customerTag === 'NEW' && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-blue-100 text-blue-800">
                              MỚI
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                          {lastMsg?.time || conv.lastActive}
                        </span>
                      </div>

                      {/* Product Inquiry Badge */}
                      {conv.inquiryProduct && (
                        <div className="flex items-center gap-1 text-[10px] text-blue-700 font-semibold truncate mt-0.5 bg-blue-50/80 px-1.5 py-0.5 rounded-md">
                          {conv.inquiryProduct.category === 'GAME' ? (
                            <Gamepad2 className="w-3 h-3 flex-shrink-0" />
                          ) : conv.inquiryProduct.category === 'APP' ? (
                            <Sparkles className="w-3 h-3 flex-shrink-0 text-emerald-600" />
                          ) : (
                            <Cpu className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span className="truncate">{conv.inquiryProduct.name}</span>
                        </div>
                      )}

                      {/* Message Preview */}
                      <p className="text-xs text-slate-500 truncate mt-1">
                        {lastMsg ? (
                          <>
                            <span className="font-semibold text-slate-700">
                              {lastMsg.sender === 'seller' ? 'Bạn: ' : ''}
                            </span>
                            {lastMsg.text}
                          </>
                        ) : (
                          'Chưa có tin nhắn'
                        )}
                      </p>
                    </div>

                    {/* Unread badge */}
                    {conv.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs flex-shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: ACTIVE CHAT FEED & INPUT (lg:col-span-5)        */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex flex-col h-full bg-white border-r border-slate-200/80">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white shadow-xs">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={activeConversation.buyerAvatar}
                  alt={activeConversation.buyerName}
                  className="w-10 h-10 rounded-2xl object-cover ring-2 ring-slate-100"
                />
                {activeConversation.isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm text-slate-900">
                    {activeConversation.buyerName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    {activeConversation.customerTag === 'VIP' ? 'Khách VIP' : 'Người Mua Đã Xác Thực'}
                  </span>
                </div>
                <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {activeConversation.isOnline ? 'Đang trực tuyến' : `Hoạt động ${activeConversation.lastActive}`}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowVoucherModal(true)}
                className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="Tặng mã giảm giá cho khách"
              >
                <Gift className="w-3.5 h-3.5 text-amber-600" />
                <span>Tặng Voucher</span>
              </button>
            </div>
          </div>

          {/* Product Inquiry Context Banner */}
          {activeConversation.inquiryProduct && (
            <div className="p-3 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-blue-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={activeConversation.inquiryProduct.image}
                  alt={activeConversation.inquiryProduct.name}
                  className="w-11 h-11 rounded-xl object-cover border border-blue-200 flex-shrink-0 bg-white"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider block">
                    Khách đang hỏi mua sản phẩm này
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 truncate">
                    {activeConversation.inquiryProduct.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-extrabold text-red-600">
                      {formatCurrency(activeConversation.inquiryProduct.price)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      • {activeConversation.inquiryProduct.stockStatus}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  handleSendMessage(
                    `Dạ chào bạn, sản phẩm "${activeConversation.inquiryProduct?.name}" giá ${formatCurrency(
                      activeConversation.inquiryProduct?.price || 0
                    )} đang sẵn sàng bàn giao ngay ạ!`
                  );
                }}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex-shrink-0 transition-colors cursor-pointer shadow-xs"
              >
                Báo Giá Ngay
              </button>
            </div>
          )}

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
            {activeConversation.messages.map((m) => {
              const isSeller = m.sender === 'seller';
              return (
                <div
                  key={m.id}
                  className={`flex items-end gap-2 ${isSeller ? 'justify-end' : 'justify-start'}`}
                >
                  {!isSeller && (
                    <img
                      src={activeConversation.buyerAvatar}
                      alt={activeConversation.buyerName}
                      className="w-7 h-7 rounded-xl object-cover flex-shrink-0 shadow-xs"
                    />
                  )}

                  <div className="space-y-1 max-w-[80%]">
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isSeller
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                          : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-none'
                      }`}
                    >
                      <p className="whitespace-pre-line">{m.text}</p>

                      {/* Voucher Card Attachment if sent */}
                      {m.voucherAttachment && (
                        <div className="mt-2.5 p-3 rounded-xl bg-amber-500/20 border border-amber-400/40 text-white space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-200">
                            <Gift className="w-4 h-4" />
                            <span>Mã Ưu Đãi: {m.voucherAttachment.code}</span>
                          </div>
                          <p className="text-[11px] text-white">
                            Giảm {m.voucherAttachment.discount} • {m.voucherAttachment.minSpend}
                          </p>
                        </div>
                      )}
                    </div>

                    <div
                      className={`flex items-center gap-1 text-[10px] text-slate-400 px-1 ${
                        isSeller ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span>{m.time}</span>
                      {isSeller && (
                        <span>
                          {m.status === 'READ' ? (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-500 inline" />
                          ) : (
                            <Check className="w-3.5 h-3.5 inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Canned Response Bar */}
          <div className="p-2.5 bg-slate-100/80 border-t border-slate-200 overflow-x-auto flex items-center gap-1.5 text-xs">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 pl-1 whitespace-nowrap">
              <Zap className="w-3 h-3 text-amber-500" />
              Gợi ý nhanh:
            </span>
            {QUICK_CANVAS_RESPONSES.map((qr, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(qr.text, qr.voucher)}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium border border-slate-200/80 whitespace-nowrap transition-all cursor-pointer shadow-xs text-[11px]"
              >
                {qr.label}
              </button>
            ))}
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Nhập tin nhắn trả lời người mua (Enter để gửi)..."
              className="flex-1 bg-slate-100 hover:bg-slate-100/90 focus:bg-white p-2.5 text-xs rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500/20 font-medium transition-all"
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold disabled:opacity-40 transition-all cursor-pointer shadow-md shadow-blue-500/20 flex-shrink-0"
              title="Gửi tin nhắn"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: BUYER PROFILE & ORDER HISTORY (lg:col-span-3)   */}
        {/* ========================================================= */}
        <div className="lg:col-span-3 p-5 overflow-y-auto space-y-6 bg-slate-50/40">
          {/* Buyer Profile Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
            <div className="flex items-center gap-3">
              <img
                src={activeConversation.buyerAvatar}
                alt={activeConversation.buyerName}
                className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100"
              />
              <div>
                <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                  {activeConversation.buyerName}
                </h4>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  ID: {activeConversation.buyerId}
                </span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                  {activeConversation.customerTag === 'VIP' ? '★ KHÁCH HÀNG VIP' : 'KHÁCH HÀNG ĐÃ MUA'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span className="font-medium">{activeConversation.buyerPhone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                <span className="truncate font-medium">{activeConversation.buyerEmail}</span>
              </div>
              <div className="flex items-start gap-2 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-rose-600 flex-shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed line-clamp-2">
                  {activeConversation.buyerAddress}
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Metrics Card */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
            <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />
              <span>Giao Dịch Tại Shop GEARVN</span>
            </h5>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Tổng chi tiêu</span>
                <span className="font-extrabold text-blue-600">
                  {formatCurrency(activeConversation.totalSpent)}
                </span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block">Đơn hoàn tất</span>
                <span className="font-extrabold text-slate-900">
                  {activeConversation.orderCount} đơn hàng
                </span>
              </div>
            </div>
          </div>

          {/* Recent Orders List */}
          {activeConversation.recentOrders && activeConversation.recentOrders.length > 0 && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đơn Hàng Gần Nhất</span>
                </h5>
                <span className="text-[10px] text-slate-400">
                  {activeConversation.recentOrders.length} đơn
                </span>
              </div>

              <div className="space-y-2">
                {activeConversation.recentOrders.map((ord, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100 space-y-1 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800 text-[11px]">
                        {ord.code}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ord.statusColor}`}>
                        {ord.statusText}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{ord.date}</span>
                      <span className="font-extrabold text-red-600">{formatCurrency(ord.total)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Internal Note for Seller */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>Ghi chú nội bộ người bán</span>
              </label>
              {showInternalNoteSaved && (
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                  <CheckCircle2 className="w-3 h-3" /> Đã lưu
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Ghi chú về sở thích, lưu ý giao hàng của khách..."
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20"
            />
            <button
              type="button"
              onClick={handleSaveNote}
              className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              Lưu Ghi Chú
            </button>
          </div>
        </div>
      </div>

      {/* Modal Tặng Voucher Ưu Đãi */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-800 rounded-xl">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  Gửi Voucher Ưu Đãi Cho {activeConversation.buyerName}
                </h3>
              </div>
              <button
                onClick={() => setShowVoucherModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chọn mã giảm giá độc quyền từ gian hàng để gửi trực tiếp qua tin nhắn kích thích khách chốt đơn:
            </p>

            <div className="space-y-2.5 text-xs">
              {[
                {
                  code: 'GEARVN50',
                  discount: 'Giảm 50.000 ₫',
                  desc: 'Áp dụng cho đơn hàng phần cứng từ 500.000 ₫',
                },
                {
                  code: 'GEARVN100',
                  discount: 'Giảm 100.000 ₫',
                  desc: 'Áp dụng cho đơn hàng Laptop / Màn hình từ 5.000.000 ₫',
                },
                {
                  code: 'AIPRO15',
                  discount: 'Giảm 15%',
                  desc: 'Áp dụng cho gói tài khoản AI / Game bản quyền',
                },
              ].map((v) => (
                <div
                  key={v.code}
                  className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-center justify-between gap-3 hover:bg-amber-100/80 transition-all cursor-pointer"
                  onClick={() => {
                    handleSendMessage(
                      `Shop gửi tặng bạn mã ưu đãi ${v.code} (${v.discount})! Nhập mã khi thanh toán để được trừ trực tiếp vào đơn hàng nhé.`,
                      {
                        code: v.code,
                        discount: v.discount,
                        minSpend: v.desc,
                      }
                    );
                    setShowVoucherModal(false);
                  }}
                >
                  <div className="space-y-0.5">
                    <span className="font-mono font-black text-amber-900 text-xs">{v.code}</span>
                    <span className="block font-bold text-red-600 text-[11px]">{v.discount}</span>
                    <span className="text-[10px] text-slate-500 block">{v.desc}</span>
                  </div>
                  <button className="px-3 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors">
                    Gửi Khách
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
