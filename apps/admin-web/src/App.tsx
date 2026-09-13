import React, { useEffect, useState } from 'react';
import { Menu, ShieldAlert } from 'lucide-react';
import { adminApi, authApi } from '@marketplace/api-client';
import { useAuthStore } from '@marketplace/auth';
import { AdminSidebar } from './components/AdminSidebar';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminShopManagementView } from './views/AdminShopManagementView';
import { AdminSellerApprovalView } from './views/AdminSellerApprovalView';
import { AdminProductModerationView } from './views/AdminProductModerationView';
import { AdminPaymentsView } from './views/AdminPaymentsView';
import { AdminCategorySchemaView } from './views/AdminCategorySchemaView';
import { AdminOrdersView } from './views/AdminOrdersView';
import { AdminGameModerationView } from './views/AdminGameModerationView';
import { AdminGameCatalogView } from './views/AdminGameCatalogView';
import { AdminDigitalDisputesView } from './views/AdminDigitalDisputesView';
import { AdminAppModerationView } from './views/AdminAppModerationView';
import { AdminApplicationCatalogView } from './views/AdminApplicationCatalogView';
import { AdminReportsInboxView } from './views/AdminReportsInboxView';
import { AdminMessagesInboxView } from './views/AdminMessagesInboxView';
import { AdminUserManagementView } from './views/AdminUserManagementView';

import { LanguageSwitcher } from '@marketplace/ui';
import { useI18n } from '@marketplace/utils';

export function App() {
  const { user, isAuthenticated, setSession, logout } = useAuthStore();
  const [email, setEmail] = useState('admin@marketplace.local');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const { locale } = useI18n();
  const [currentTab, setCurrentTab] = useState('all-shops');
  const [pendingSellersCount, setPendingSellersCount] = useState(0);
  const [pendingProductsCount, setPendingProductsCount] = useState(0);
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    async function loadCounts() {
      try {
        const [sellers, products, reports] = await Promise.all([
          adminApi.getSellerApplications(),
          adminApi.getPendingProducts(),
          adminApi.getUserReports(),
        ]);
        setPendingSellersCount(sellers.filter((s) => s.status === 'PENDING').length);
        setPendingProductsCount(products.length);
        setPendingReportsCount(reports.filter((r) => r.status === 'PENDING').length);
      } catch (err) {
        console.error('Error loading admin counts:', err);
      }
    }
    loadCounts();
  }, [currentTab, isAuthenticated]);

  if (!isAuthenticated) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <form className="w-full max-w-sm rounded-2xl bg-white p-6 space-y-4" onSubmit={async (event) => {
        event.preventDefault(); setAuthLoading(true); setAuthError('');
        try { setSession(await authApi.login(email, password)); }
        catch (error: any) { setAuthError(error?.message || 'Đăng nhập thất bại'); }
        finally { setAuthLoading(false); }
      }}>
        <h1 className="text-xl font-black">Đăng nhập quản trị</h1>
        <input className="w-full border rounded-xl px-3 py-2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full border rounded-xl px-3 py-2" type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {authError && <p className="text-sm text-red-600">{authError}</p>}
        <button disabled={authLoading} className="w-full rounded-xl bg-purple-600 text-white py-2 font-bold">{authLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}</button>
      </form>
    </div>
  );
  const roles = (user as any)?.roles ?? [(user as any)?.role];
  if (!roles.some((role: string) => ['ADMIN', 'SUPER_ADMIN', 'MODERATOR'].includes(role))) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"><p>Bạn không có quyền truy cập trang quản trị.</p><button className="px-4 py-2 bg-slate-900 text-white rounded-xl" onClick={logout}>Đăng xuất</button></div>
  );

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-slate-50 text-slate-900">
      {/* Mobile Top Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 -ml-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Mở menu quản trị"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-black text-white text-xs shadow-xs">
              AD
            </div>
            <span className="font-bold text-sm tracking-tight text-white">Admin Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="compact" />
          {(pendingSellersCount > 0 || pendingProductsCount > 0 || pendingReportsCount > 0) && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{pendingSellersCount + pendingProductsCount + pendingReportsCount} {locale === 'en' ? 'pending' : 'chờ duyệt'}</span>
            </div>
          )}
        </div>
      </header>


      <AdminSidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        pendingSellersCount={pendingSellersCount}
        pendingProductsCount={pendingProductsCount}
        pendingReportsCount={pendingReportsCount}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 w-full max-w-full overflow-x-hidden">
        {currentTab === 'dashboard' && (
          <AdminDashboardView onNavigate={(tab) => setCurrentTab(tab)} />
        )}
        {currentTab === 'all-shops' && <AdminShopManagementView />}
        {currentTab === 'seller-approval' && <AdminSellerApprovalView />}
        {currentTab === 'product-moderation' && <AdminProductModerationView />}
        {currentTab === 'game-moderation' && <AdminGameModerationView />}
        {currentTab === 'game-catalog' && <AdminGameCatalogView />}
        {currentTab === 'app-moderation' && <AdminAppModerationView />}
        {currentTab === 'app-catalog' && <AdminApplicationCatalogView />}
        {currentTab === 'reports-inbox' && <AdminReportsInboxView />}
        {currentTab === 'digital-disputes' && <AdminDigitalDisputesView />}
        {currentTab === 'payments' && <AdminPaymentsView />}
        {currentTab === 'category-schema' && <AdminCategorySchemaView />}
        {currentTab === 'orders' && <AdminOrdersView />}
        {currentTab === 'user-management' && <AdminUserManagementView />}
        {currentTab === 'user-messages-inbox' && <AdminMessagesInboxView />}
      </main>
    </div>
  );
}

export default App;
