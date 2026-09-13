import React, { useState } from 'react';
import type { Product, AppAccountProduct } from '@marketplace/types';
import { Menu, MessageCircle } from 'lucide-react';
import { SellerSidebar } from './components/SellerSidebar';
import { SellerDashboardView } from './views/SellerDashboardView';
import { SellerProductsView } from './views/SellerProductsView';
import { SellerProductFormView } from './views/SellerProductFormView';
import { SellerInventoryView } from './views/SellerInventoryView';
import { SellerOrdersView } from './views/SellerOrdersView';
import { SellerFinanceView } from './views/SellerFinanceView';
import { SellerRegisterView } from './views/SellerRegisterView';
import { SellerGameAccountProductFormView } from './views/SellerGameAccountProductFormView';
import { SellerGameAccountInventoryView } from './views/SellerGameAccountInventoryView';
import { SellerDigitalOrdersView } from './views/SellerDigitalOrdersView';
import { SellerAppAccountProductFormView } from './views/SellerAppAccountProductFormView';
import { SellerAppAccountInventoryView } from './views/SellerAppAccountInventoryView';
import { SellerAppOrdersView } from './views/SellerAppOrdersView';
import { SellerListingHubView } from './views/SellerListingHubView';
import { SellerCustomerChatView } from './views/SellerCustomerChatView';

import { LanguageSwitcher } from '@marketplace/ui';
import { useI18n } from '@marketplace/utils';
import { authApi } from '@marketplace/api-client';
import { useAuthStore } from '@marketplace/auth';

export function App() {
  const { user, isAuthenticated, setSession, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const { locale } = useI18n();
  const getInitialTab = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab) return tab;
    } catch {}
    return 'dashboard';
  };
  const [currentTab, setCurrentTab] = useState<string>(getInitialTab);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingAppProduct, setEditingAppProduct] = useState<AppAccountProduct | null>(null);

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4" onSubmit={async (event) => {
        event.preventDefault(); setAuthLoading(true); setAuthError('');
        try { setSession(await authApi.login(email, password)); }
        catch (error: any) { setAuthError(error?.message || 'Đăng nhập thất bại'); }
        finally { setAuthLoading(false); }
      }}>
        <h1 className="text-xl font-black">Đăng nhập Kênh người bán</h1>
        <p className="text-xs text-slate-500">Dùng tài khoản đã đăng ký trên website mua hàng.</p>
        <input className="w-full border rounded-xl px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded-xl px-3 py-2" type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {authError && <p className="text-sm text-red-600">{authError}</p>}
        <button disabled={authLoading} className="w-full rounded-xl bg-blue-600 text-white py-2 font-bold">{authLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
    </div>
  );
  const roles = (user as any)?.roles ?? [(user as any)?.role];
  if (!roles.some((role: string) => ['SELLER_OWNER', 'SELLER_MANAGER'].includes(role))) return (
    <div className="min-h-screen bg-slate-50 p-6"><div className="max-w-3xl mx-auto flex justify-end mb-4"><button className="px-4 py-2 bg-slate-900 text-white rounded-xl" onClick={logout}>Đăng xuất</button></div><SellerRegisterView /></div>
  );

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setCurrentTab('product-new');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setCurrentTab('product-new');
  };

  const handleAddNewAppProduct = () => {
    setEditingAppProduct(null);
    setCurrentTab('app-account-new');
  };

  const handleEditAppProduct = (product: AppAccountProduct) => {
    setEditingAppProduct(product);
    setCurrentTab('app-account-new');
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Top Navigation Bar (Only visible on screens < lg, i.e. phones and vertical tablets) */}
      <header className="lg:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white cursor-pointer transition-colors"
            title="Mở menu điều hướng"
            aria-label="Mở menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              GV
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white block leading-tight">
                {locale === 'en' ? 'Seller Center' : 'Kênh Người Bán'}
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">GEARVN Official</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCurrentTab('customer-chat')}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Chat với người mua (2 tin nhắn mới)"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
          </button>
          <LanguageSwitcher variant="compact" />
          <button
            type="button"
            onClick={() => setCurrentTab('listing-hub')}
            className="text-xs px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs transition-colors cursor-pointer"
          >
            {locale === 'en' ? '+ List Item' : '+ Đăng bán'}
          </button>
        </div>
      </header>


      <SellerSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-10 max-w-7xl min-w-0 overflow-x-hidden">
        {currentTab === 'dashboard' && (
          <SellerDashboardView onNavigate={(tab) => setCurrentTab(tab)} />
        )}

        {currentTab === 'listing-hub' && (
          <SellerListingHubView onSelectType={(type) => setCurrentTab(type)} />
        )}

        {currentTab === 'products' && (
          <SellerProductsView
            onAddNew={handleAddNewProduct}
            onEditProduct={handleEditProduct}
          />
        )}

        {currentTab === 'product-new' && (
          <SellerProductFormView
            initialProduct={editingProduct}
            onSuccess={() => setCurrentTab('products')}
            onCancel={() => setCurrentTab('products')}
          />
        )}

        {currentTab === 'inventory' && <SellerInventoryView />}

        {currentTab === 'orders' && <SellerOrdersView />}

        {currentTab === 'game-account-new' && (
          <SellerGameAccountProductFormView
            onSuccess={() => setCurrentTab('game-account-inventory')}
            onCancel={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'game-account-inventory' && (
          <SellerGameAccountInventoryView />
        )}

        {currentTab === 'digital-orders' && (
          <SellerDigitalOrdersView />
        )}

        {currentTab === 'app-account-new' && (
          <SellerAppAccountProductFormView
            initialProduct={editingAppProduct}
            onSuccess={() => {
              setEditingAppProduct(null);
              setCurrentTab('app-account-inventory');
            }}
            onCancel={() => {
              setEditingAppProduct(null);
              setCurrentTab('app-account-inventory');
            }}
          />
        )}

        {currentTab === 'app-account-inventory' && (
          <SellerAppAccountInventoryView
            onAddNewProduct={handleAddNewAppProduct}
            onEditProduct={handleEditAppProduct}
          />
        )}

        {currentTab === 'app-orders' && (
          <SellerAppOrdersView />
        )}

        {currentTab === 'customer-chat' && <SellerCustomerChatView />}

        {currentTab === 'finance' && <SellerFinanceView />}

        {currentTab === 'register' && <SellerRegisterView />}
      </main>
    </div>
  );
}
export default App;
