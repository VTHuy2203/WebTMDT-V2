import React, { useState, useEffect } from 'react';
import { LanguageSwitcher } from '@marketplace/ui';
import {

  LayoutDashboard,
  Package,
  PlusCircle,
  Boxes,
  ShoppingBag,
  DollarSign,
  ClipboardList,
  Store,
  ExternalLink,
  ShieldCheck,
  Gamepad2,
  KeyRound,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Layers,
  Sparkle,
  X,
  MessageCircle,
} from 'lucide-react';

export interface SellerSidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

interface NavSubItem {
  id: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  items: NavSubItem[];
  hubTabId?: string; // Optional parent tab
}

export const SellerSidebar: React.FC<SellerSidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const handleItemClick = (tabId: string) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const sections: NavSection[] = [
    {
      id: 'listing',
      title: 'Đăng Bán Sản Phẩm',
      icon: PlusCircle,
      hubTabId: 'listing-hub',
      items: [
        {
          id: 'product-new',
          label: 'Sản phẩm công nghệ',
          badge: 'Vật lý',
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: Package,
        },
        {
          id: 'game-account-new',
          label: 'Tài khoản Game',
          badge: 'Nick Game',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: Gamepad2,
        },
        {
          id: 'app-account-new',
          label: 'Tài khoản Ứng dụng & AI',
          badge: 'App / AI',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: Sparkles,
        },
      ],
    },
    {
      id: 'inventory',
      title: 'Sản Phẩm & Kho Hàng',
      icon: Boxes,
      items: [
        {
          id: 'products',
          label: 'Danh sách SP công nghệ',
          icon: Package,
        },
        {
          id: 'inventory',
          label: 'Kho hàng & SKU vật lý',
          icon: Boxes,
        },
        {
          id: 'game-account-inventory',
          label: 'Kho Nick Game (Vault)',
          badge: 'Mã hóa',
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: KeyRound,
        },
        {
          id: 'app-account-inventory',
          label: 'Kho App & Hạn mức gói',
          badge: 'Capacity',
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: Layers,
        },
      ],
    },
    {
      id: 'orders',
      title: 'Quản Lý Đơn Hàng',
      icon: ShoppingBag,
      items: [
        {
          id: 'orders',
          label: 'Đơn hàng SP công nghệ',
          icon: ShoppingBag,
        },
        {
          id: 'digital-orders',
          label: 'Đơn hàng Nick Game',
          icon: FileText,
        },
        {
          id: 'app-orders',
          label: 'Đơn hàng Ứng dụng & AI',
          icon: ClipboardList,
        },
      ],
    },
    {
      id: 'support',
      title: 'Chăm Sóc Khách Hàng',
      icon: MessageCircle,
      items: [
        {
          id: 'customer-chat',
          label: 'Chat với người mua',
          badge: '2 mới',
          badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: MessageCircle,
        },
      ],
    },
    {
      id: 'finance',
      title: 'Tài Chính & Gian Hàng',
      icon: DollarSign,
      items: [
        {
          id: 'finance',
          label: 'Tài chính & Rút tiền',
          icon: DollarSign,
        },
        {
          id: 'register',
          label: 'Hồ sơ đăng ký Shop',
          icon: Store,
        },
      ],
    },
  ];

  // Keep track of which sections are open
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    listing: true,
    inventory: true,
    orders: true,
    support: true,
    finance: true,
  });

  // Automatically expand group containing active tab
  useEffect(() => {
    sections.forEach((sec) => {
      const containsActive =
        sec.hubTabId === currentTab || sec.items.some((item) => item.id === currentTab);
      if (containsActive) {
        setOpenSections((prev) => ({ ...prev, [sec.id]: true }));
      }
    });
  }, [currentTab]);

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
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
        {/* Shop Info Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md shadow-blue-500/20 text-sm flex-shrink-0">
              GV
            </div>
            <div className="overflow-hidden flex-1">
              <h3 className="font-bold text-sm text-white truncate">GEARVN Official</h3>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Shop đã duyệt</span>
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

        {/* Main Navigation */}
        <nav className="p-3 space-y-4 flex-1 text-xs overflow-y-auto">
          {/* 1. Direct Dashboard Item */}
          <div>
            <button
              onClick={() => handleItemClick('dashboard')}
              className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-blue-400" />
              <span>Tổng quan (Dashboard)</span>
            </button>
          </div>

        {/* 2. Grouped Sections */}
        {sections.map((section) => {
          const isOpen = openSections[section.id];
          const hasActiveItem =
            section.hubTabId === currentTab ||
            section.items.some((item) => item.id === currentTab);
          const SectionIcon = section.icon;

          return (
            <div key={section.id} className="space-y-1">
              {/* Section Header Accordion Trigger */}
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
                      hasActiveItem ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
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

              {/* Sub-items */}
              {isOpen && (
                <div className="ml-3 pl-2.5 border-l border-slate-800/80 space-y-1 pt-0.5 animate-in fade-in-50 duration-200">
                  {/* Hub Link if present */}
                  {section.hubTabId && (
                    <button
                      onClick={() => handleItemClick(section.hubTabId!)}
                      className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                        currentTab === section.hubTabId
                          ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Sparkle className="w-3 h-3 text-amber-400" />
                        <span>Xem tất cả kênh đăng</span>
                      </span>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
                        Hub
                      </span>
                    </button>
                  )}

                  {section.items.map((subItem) => {
                    const isActive = currentTab === subItem.id;
                    const SubIcon = subItem.icon;

                    return (
                      <button
                        key={subItem.id}
                        onClick={() => handleItemClick(subItem.id)}
                        className={`flex items-center justify-between w-full px-2.5 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                          isActive
                            ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-600/25'
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

                        {subItem.badge && (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border flex-shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white border-white/20'
                                : subItem.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
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
