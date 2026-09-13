import React, { useState, useEffect } from 'react';
import { LanguageSwitcher } from '@marketplace/ui';
import {
  LayoutDashboard,
  Store,
  ShieldCheck,
  QrCode,
  Layers,
  ShoppingBag,
  ExternalLink,
  ShieldAlert,
  Gamepad2,
  Sliders,
  Gavel,
  Sparkles,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Inbox,
  Building2,
  X,
  MessageSquareText,
  Users,
} from 'lucide-react';


export interface AdminSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  pendingSellersCount: number;
  pendingProductsCount: number;
  pendingReportsCount?: number;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface AdminNavSubItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface AdminNavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: AdminNavSubItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingSellersCount,
  pendingProductsCount,
  pendingReportsCount = 0,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const sections: AdminNavSection[] = [
    {
      id: 'shops',
      title: 'Quản Lý Gian Hàng & Shop',
      icon: Building2,
      items: [
        {
          id: 'all-shops',
          label: 'Tất cả gian hàng & Chế tài',
          icon: Store,
        },
        {
          id: 'seller-approval',
          label: 'Duyệt hồ sơ mở Shop',
          icon: ShieldCheck,
          badge: pendingSellersCount,
        },
      ],
    },
    {
      id: 'moderation',
      title: 'Kiểm Duyệt Sản Phẩm',
      icon: ClipboardCheck,
      items: [
        {
          id: 'product-moderation',
          label: 'Duyệt SP công nghệ',
          icon: ShieldCheck,
          badge: pendingProductsCount,
        },
        {
          id: 'game-moderation',
          label: 'Duyệt Nick Game',
          icon: Gamepad2,
        },
        {
          id: 'app-moderation',
          label: 'Duyệt Tài khoản App / AI',
          icon: Sparkles,
        },
      ],
    },
    {
      id: 'trust-safety',
      title: 'An Toàn & Xử Lý Vi Phạm',
      icon: ShieldAlert,
      items: [
        {
          id: 'reports-inbox',
          label: 'Hòm thư tố cáo người dùng',
          icon: Inbox,
          badge: pendingReportsCount,
        },
        {
          id: 'digital-disputes',
          label: 'Xử lý khiếu nại Nick Game',
          icon: Gavel,
        },
      ],
    },
    {
      id: 'users',
      title: 'Quản Lý Người Dùng & Hỗ Trợ',
      icon: Users,
      items: [
        {
          id: 'user-management',
          label: 'Danh sách người dùng & Chế tài',
          icon: Users,
        },
        {
          id: 'user-messages-inbox',
          label: 'Hòm thư người dùng',
          icon: MessageSquareText,
        },
      ],
    },
    {
      id: 'operations',
      title: 'Giao Dịch & Vận Hành',
      icon: ShoppingBag,
      items: [
        {
          id: 'orders',
          label: 'Toàn bộ đơn hàng sàn',
          icon: ShoppingBag,
        },
        {
          id: 'payments',
          label: 'Giám sát SePay QR',
          icon: QrCode,
        },
      ],
    },
    {
      id: 'catalogs',
      title: 'Danh Mục & Cấu Hình',
      icon: Sliders,
      items: [
        {
          id: 'game-catalog',
          label: 'Catalog Game & Thuộc tính',
          icon: Gamepad2,
        },
        {
          id: 'app-catalog',
          label: 'Catalog Ứng Dụng & AI',
          icon: Layers,
        },
        {
          id: 'category-schema',
          label: 'Schema thông số SP vật lý',
          icon: Sliders,
        },
      ],
    },
  ];

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    shops: true,
    moderation: true,
    'trust-safety': true,
    users: true,
    operations: true,
    catalogs: true,
  });

  useEffect(() => {
    sections.forEach((sec) => {
      const containsActive = sec.items.some((item) => item.id === currentTab);
      if (containsActive) {
        setOpenSections((prev) => ({ ...prev, [sec.id]: true }));
      }
    });
  }, [currentTab]);

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden animate-in fade-in"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800 select-none transition-transform duration-300 ease-in-out lg:static lg:w-68 lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Admin Logo Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-10 w-14 rounded-xl bg-slate-950 p-1 flex items-center justify-center font-bold shadow-md shadow-blue-500/10 border border-slate-800 flex-shrink-0 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white leading-tight">TECHMARKET</h3>
              <span className="text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                Digital Solutions
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer transition-colors"
              title="Đóng menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Nav Menu */}
        <nav className="p-3 space-y-4 flex-1 text-xs overflow-y-auto">
          {/* Dashboard Direct */}
          <div>
            <button
              onClick={() => handleItemClick('dashboard')}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
              <span>Bảng Quản Trị Hệ Thống</span>
            </button>
          </div>

          {/* Categorized Sections */}
          {sections.map((section) => {
            const isOpen = openSections[section.id];
            const hasActiveItem = section.items.some((i) => i.id === currentTab);
            const SectionIcon = section.icon;

            return (
              <div key={section.id} className="space-y-1">
                <div
                  onClick={() => toggleSection(section.id)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold tracking-wide uppercase transition-colors cursor-pointer group ${
                    hasActiveItem
                      ? 'text-white bg-slate-800/50'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <SectionIcon
                      className={`w-4 h-4 transition-colors ${
                        hasActiveItem ? 'text-purple-400' : 'text-slate-500 group-hover:text-slate-300'
                      }`}
                    />
                    <span>{section.title}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500 font-mono">({section.items.length})</span>
                    {isOpen ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-500 transition-transform" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500 transition-transform" />
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="ml-3 pl-2.5 border-l border-slate-800/80 space-y-1 pt-0.5 animate-in fade-in-50 duration-200">
                    {section.items.map((subItem) => {
                      const isActive = currentTab === subItem.id;
                      const SubIcon = subItem.icon;

                      return (
                        <button
                          key={subItem.id}
                          onClick={() => handleItemClick(subItem.id)}
                          className={`flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                            isActive
                              ? 'bg-purple-600 text-white font-bold shadow-sm shadow-purple-600/25'
                              : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            {SubIcon && (
                              <SubIcon
                                className={`w-3.5 h-3.5 flex-shrink-0 ${
                                  isActive ? 'text-white' : 'text-slate-500'
                                }`}
                              />
                            )}
                            <span className="truncate">{subItem.label}</span>
                          </div>

                          {subItem.badge !== undefined && subItem.badge > 0 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 shadow-xs">
                              {subItem.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer language & link to buyer portal */}
        <div className="p-3 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Ngôn ngữ & Tiền tệ</span>
            <LanguageSwitcher variant="pill" showRateBadge={false} />
          </div>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all border border-slate-700/50 hover:border-slate-600"
          >
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Xem Sàn Người Mua</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>
        </div>
      </aside>
    </>
  );
};
