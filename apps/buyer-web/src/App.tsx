import React, { useEffect, useState } from 'react';
import type { Product, ProductVariant, ShopGroupedCart, Order, SePayPaymentInfo, DigitalOrderListItem } from '@marketplace/types';
import { cartApi, paymentApi, productApi } from '@marketplace/api-client';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { CompareDrawer } from './components/CompareDrawer';
import { SePayModal } from './components/SePayModal';

import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { ProductDetailView } from './views/ProductDetailView';
import { CompareView } from './views/CompareView';
import { CartView } from './views/CartView';
import { CheckoutView } from './views/CheckoutView';
import { OrdersView } from './views/OrdersView';
import { WarrantiesView } from './views/WarrantiesView';
import { ReturnsView } from './views/ReturnsView';
import { AuthView } from './views/AuthView';
import { BuyerSellerRegisterView } from './views/BuyerSellerRegisterView';
import { ShopDetailView } from './views/ShopDetailView';
import { GameAccountsLandingView } from './views/GameAccountsLandingView';
import { AppAccountsLandingView } from './views/AppAccountsLandingView';
import { TechProductsLandingView } from './views/TechProductsLandingView';
import { UserProfileView } from './views/UserProfileView';
import { DigitalOrderDetailView } from './views/DigitalOrderDetailView';
import { ChatWidget } from './components/ChatWidget';
import { ErrorBoundary } from '@marketplace/ui';
import { useAuthStore } from '@marketplace/auth';

export function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [currentView, setCurrentView] = useState<string>('home');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [profileTab, setProfileTab] = useState<'profile' | 'addresses' | 'shop'>('profile');
  const [selectedShopId, setSelectedShopId] = useState<string>('shop_gamevn');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedDigitalOrder, setSelectedDigitalOrder] = useState<DigitalOrderListItem | null>(null);
  const [searchParams, setSearchParams] = useState<{ query?: string; category?: string }>({});

  // Cart state
  const [groupedCart, setGroupedCart] = useState<ShopGroupedCart[]>([]);

  // Compare state
  const [comparedProducts, setComparedProducts] = useState<Product[]>([]);

  // SePay Modal State
  const [sepayModalOpen, setSepayModalOpen] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string>('');
  const [currentSepayInfo, setCurrentSepayInfo] = useState<SePayPaymentInfo | undefined>(undefined);

  // Load initial cart
  useEffect(() => {
    async function loadCart() {
      try {
        const cart = await cartApi.getCart();
        setGroupedCart(cart);
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
    if (isAuthenticated) loadCart();
    else setGroupedCart([]);
  }, [isAuthenticated]);

  const totalCartCount = groupedCart.flatMap((g) => g.items).reduce((sum, i) => sum + i.quantity, 0);

  // Cart Handlers
  const handleAddToCart = async (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    const v = variant || product.variants[0];
    const updated = await cartApi.addItem(product.id, v.id, quantity);
    setGroupedCart(updated);
  };

  const handleBuyNow = async (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    await handleAddToCart(product, variant, quantity);
    setCurrentView('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleUpdateCartQuantity = async (cartItemId: string, newQty: number) => {
    const updated = await cartApi.updateQuantity(cartItemId, newQty);
    setGroupedCart(updated);
  };

  const handleRemoveCartItem = async (cartItemId: string) => {
    const updated = await cartApi.removeItem(cartItemId);
    setGroupedCart(updated);
  };

  const handleToggleSelectCartItem = async (cartItemId: string) => {
    const updated = await cartApi.toggleSelect(cartItemId);
    setGroupedCart(updated);
  };

  const handleSelectAllCart = async (selected: boolean) => {
    const updated = await cartApi.selectAll(selected);
    setGroupedCart(updated);
  };

  // Compare Handlers
  const handleToggleCompare = (product: Product) => {
    setComparedProducts((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 4) {
        alert('Bạn chỉ có thể so sánh tối đa 4 sản phẩm cùng lúc.');
        return prev;
      }
      return [...prev, product];
    });
  };

  const handleRemoveCompared = (productId: string) => {
    setComparedProducts((prev) => prev.filter((p) => p.id !== productId));
  };

  const handleClearCompared = () => {
    setComparedProducts([]);
  };

  // Navigation Handlers
  const handleNavigate = (view: string, params?: any) => {
    setCurrentView(view);
    if (params) {
      if (params.product) setSelectedProduct(params.product);
      if (params.digitalOrder) setSelectedDigitalOrder(params.digitalOrder);
      if (params.category || params.query) setSearchParams(params);
      if (params.mode) setAuthMode(params.mode);
      if (params.shopId) setSelectedShopId(params.shopId);
      if (params.tab) setProfileTab(params.tab);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
    setCurrentView('product-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleHeaderSearch = (query: string) => {
    setSearchParams({ query });
    setCurrentView('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Order & SePay Payment Trigger
  const handleOrderCreated = async (orderId: string, paymentId: string) => {
    // Refresh cart
    const updatedCart = await cartApi.getCart();
    setGroupedCart(updatedCart);

    // Fetch payment info for SePay QR
    const payment = await paymentApi.getPayment(paymentId);
    setCurrentPaymentId(paymentId);
    setCurrentSepayInfo(payment.sepayInfo);
    setSepayModalOpen(true);
  };

  const handlePayExistingOrder = async (order: Order) => {
    const payment = await paymentApi.getPayment(`pay_${order.id}`);
    setCurrentPaymentId(payment.id);
    setCurrentSepayInfo(payment.sepayInfo);
    setSepayModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setSepayModalOpen(false);
    setCurrentView('orders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        cartCount={totalCartCount}
        compareCount={comparedProducts.length}
        onSearch={handleHeaderSearch}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <ErrorBoundary>
          {currentView === 'home' && (
            <HomeView
              onSelectProduct={handleSelectProduct}
              onAddToCart={(p) => handleAddToCart(p)}
              onToggleCompare={handleToggleCompare}
              comparedIds={comparedProducts.map((p) => p.id)}
              onNavigateSearch={(cat) => handleNavigate('tech-products', { category: cat })}
              onNavigateView={(view) => handleNavigate(view)}
              onViewShop={(shopId) => handleNavigate('shop', { shopId })}
            />
          )}

          {currentView === 'tech-products' && (
            <TechProductsLandingView
              onSelectProduct={handleSelectProduct}
              onAddToCart={(p) => handleAddToCart(p)}
              onToggleCompare={handleToggleCompare}
              comparedIds={comparedProducts.map((p) => p.id)}
              initialCategory={searchParams.category || ''}
              onViewShop={(shopId) => handleNavigate('shop', { shopId })}
            />
          )}

          {currentView === 'game-accounts' && (
            <GameAccountsLandingView
              onSelectProduct={handleSelectProduct}
              onViewShop={(shopId) => handleNavigate('shop', { shopId })}
            />
          )}

          {currentView === 'app-accounts' && (
            <AppAccountsLandingView
              onSelectProduct={handleSelectProduct}
              onViewShop={(shopId) => handleNavigate('shop', { shopId })}
            />
          )}

          {currentView === 'search' && (
            <SearchView
              initialQuery={searchParams.query || ''}
              initialCategory={searchParams.category || ''}
              onSelectProduct={handleSelectProduct}
              onAddToCart={(p) => handleAddToCart(p)}
              onToggleCompare={handleToggleCompare}
              comparedIds={comparedProducts.map((p) => p.id)}
              onViewShop={(shopId) => handleNavigate('shop', { shopId })}
            />
          )}

          {currentView === 'product-detail' && selectedProduct && (
            <ProductDetailView
              product={selectedProduct}
              onAddToCart={handleAddToCart}
              onBuyNow={handleBuyNow}
              onToggleCompare={handleToggleCompare}
              isCompared={comparedProducts.some((p) => p.id === selectedProduct.id)}
              onNavigate={handleNavigate}
            />
          )}

          {currentView === 'compare' && (
            <CompareView
              products={comparedProducts}
              onRemove={handleRemoveCompared}
              onClear={handleClearCompared}
              onAddToCart={(p) => handleAddToCart(p)}
              onBackToSearch={() => handleNavigate('search')}
            />
          )}

          {currentView === 'cart' && (
            <CartView
              groupedCart={groupedCart}
              onUpdateQuantity={handleUpdateCartQuantity}
              onRemoveItem={handleRemoveCartItem}
              onToggleSelect={handleToggleSelectCartItem}
              onSelectAll={handleSelectAllCart}
              onProceedCheckout={() => handleNavigate('checkout')}
              onContinueShopping={() => handleNavigate('home')}
            />
          )}

          {currentView === 'checkout' && (
            <CheckoutView
              groupedCart={groupedCart}
              onOrderCreated={handleOrderCreated}
              onBackToCart={() => handleNavigate('cart')}
            />
          )}

          {currentView === 'orders' && (
            <OrdersView
              onPayNow={handlePayExistingOrder}
              onRequestReturn={(ord) => handleNavigate('returns', { order: ord })}
              onViewDigitalDetail={(dOrd) => {
                setSelectedDigitalOrder(dOrd);
                setCurrentView('digital-order-detail');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onContinueShopping={() => handleNavigate('home')}
            />
          )}

          {currentView === 'digital-order-detail' && selectedDigitalOrder && (
            <DigitalOrderDetailView
              order={selectedDigitalOrder}
              onBack={() => handleNavigate('orders')}
            />
          )}

          {currentView === 'warranties' && <WarrantiesView />}

          {currentView === 'returns' && (
            <ReturnsView onContinueShopping={() => handleNavigate('orders')} />
          )}

          {currentView === 'seller-register' && (
            <BuyerSellerRegisterView
              onBack={() => handleNavigate('home')}
              onRequireAuth={() => handleNavigate('auth', { mode: 'login' })}
              onViewShop={(sId) => handleNavigate('shop', { shopId: sId })}
            />
          )}

          {currentView === 'shop' && (
            <ShopDetailView
              shopId={selectedShopId}
              onNavigate={handleNavigate}
              onSelectProduct={handleSelectProduct}
              onAddToCart={handleAddToCart}
            />
          )}

          {currentView === 'auth' && (
            <AuthView
              initialMode={authMode}
              onSuccess={() => handleNavigate('home')}
            />
          )}

          {currentView === 'profile' && (
            <UserProfileView
              initialTab={profileTab}
              onNavigate={handleNavigate}
            />
          )}
        </ErrorBoundary>
      </main>

      {/* Floating Chat Widget (Section 38) */}
      <ChatWidget />

      {/* Floating Compare Drawer */}
      {currentView !== 'compare' && (
        <CompareDrawer
          comparedProducts={comparedProducts}
          onRemove={handleRemoveCompared}
          onClear={handleClearCompared}
          onCompareNow={() => handleNavigate('compare')}
        />
      )}

      {/* SePay VietQR Modal */}
      <SePayModal
        isOpen={sepayModalOpen}
        onClose={() => setSepayModalOpen(false)}
        paymentId={currentPaymentId}
        sepayInfo={currentSepayInfo}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}
export default App;
