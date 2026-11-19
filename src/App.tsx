import { useCallback, useEffect, useState } from 'react';
import type { BuyerRequirement, MatchResult, Product, PublicUser } from './types';
import { api, getStoredToken, setStoredToken } from './lib/api';
import { Navbar, type AppView } from './components/Navbar';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { MarketplacePage } from './components/MarketplacePage';
import { RequirementsBoardPage } from './components/RequirementsBoardPage';
import { AboutPage } from './components/AboutPage';
import { AuthPage } from './components/AuthPage';
import { FarmerDashboard } from './components/FarmerDashboard';
import { BuyerDashboard } from './components/BuyerDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductDetailModal } from './components/ProductDetailModal';

const VALID_VIEWS: AppView[] = [
  'home',
  'marketplace',
  'requirements',
  'about',
  'login',
  'register',
  'dashboard',
];

function getInitialView(): AppView {
  const hash = window.location.hash.replace(/^#\/?/, '') as AppView;
  return VALID_VIEWS.includes(hash) ? hash : 'home';
}

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [registerRole, setRegisterRole] = useState<'farmer' | 'buyer'>('farmer');
  const [user, setUser] = useState<PublicUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [requirements, setRequirements] = useState<BuyerRequirement[]>([]);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loadingPublic, setLoadingPublic] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [dataRefreshKey, setDataRefreshKey] = useState(0);

  const updateView = useCallback((view: AppView, replace = false) => {
    setCurrentView(view);
    const targetHash = `#${view}`;
    if (window.location.hash !== targetHash) {
      if (replace) {
        window.history.replaceState(null, '', targetHash);
      } else {
        window.history.pushState(null, '', targetHash);
      }
    }
  }, []);

  const loadPublicMarketplace = useCallback(async () => {
    setLoadingPublic(true);
    try {
      const [prodRes, reqRes, matchRes] = await Promise.all([
        api.getProducts(),
        api.getRequirements(),
        api.getMatches('all'),
      ]);
      setProducts(prodRes.products);
      setRequirements(reqRes.requirements);
      setMatches(matchRes.matches);
    } catch (err) {
      console.error('Failed to load marketplace data:', err);
    } finally {
      setLoadingPublic(false);
    }
  }, []);

  const handleGlobalDataChanged = useCallback(() => {
    loadPublicMarketplace();
    setDataRefreshKey((k) => k + 1);
  }, [loadPublicMarketplace]);

  // Restore session on reload
  useEffect(() => {
    const restoreSession = async () => {
      const token = getStoredToken();
      if (token) {
        try {
          const res = await api.me();
          setUser(res.user);
        } catch {
          setStoredToken(null);
          setUser(null);
          if (getInitialView() === 'dashboard') {
            updateView('login', true);
          }
        }
      } else if (getInitialView() === 'dashboard') {
        updateView('login', true);
      }
      setAuthReady(true);
    };
    restoreSession();
    loadPublicMarketplace();
  }, [loadPublicMarketplace, updateView]);

  // Sync browser Back/Forward navigation and direct hash edits
  useEffect(() => {
    const syncFromHash = () => {
      const next = getInitialView();
      if (next === 'dashboard' && !getStoredToken()) {
        setCurrentView('login');
      } else {
        setCurrentView(next);
      }
    };
    window.addEventListener('popstate', syncFromHash);
    window.addEventListener('hashchange', syncFromHash);
    return () => {
      window.removeEventListener('popstate', syncFromHash);
      window.removeEventListener('hashchange', syncFromHash);
    };
  }, []);

  const handleNavigate = (view: AppView, sectionId?: string) => {
    if (view === 'dashboard' && !user) {
      updateView('login');
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    updateView(view);
    if (sectionId) {
      window.requestAnimationFrame(() => {
        setTimeout(() => {
          const el = document.getElementById(sectionId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 80);
      });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  const handleJoinRole = (role: 'farmer' | 'buyer') => {
    if (user) {
      handleNavigate('dashboard');
      return;
    }
    setRegisterRole(role);
    updateView('register');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleAuthSuccess = (authedUser: PublicUser) => {
    setUser(authedUser);
    updateView('dashboard');
    handleGlobalDataChanged();
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleLogout = () => {
    setStoredToken(null);
    setUser(null);
    updateView('home');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAF5] text-[#1A241B]">
      <Navbar
        currentView={currentView}
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            products={products}
            matches={matches}
            loading={loadingPublic}
            onNavigate={handleNavigate}
            onJoinRole={handleJoinRole}
            onSelectProduct={setSelectedProduct}
          />
        )}

        {currentView === 'marketplace' && (
          <MarketplacePage
            products={products}
            loading={loadingPublic}
            onSelectProduct={setSelectedProduct}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'requirements' && (
          <RequirementsBoardPage
            requirements={requirements}
            matches={matches}
            user={user}
            onRequireLogin={() => handleNavigate('login')}
            onRequirementCreated={handleGlobalDataChanged}
          />
        )}

        {currentView === 'about' && <AboutPage />}

        {(currentView === 'login' || currentView === 'register') && (
          <AuthPage
            mode={currentView}
            initialRole={registerRole}
            onSwitchMode={(mode) => updateView(mode)}
            onAuthSuccess={handleAuthSuccess}
          />
        )}

        {currentView === 'dashboard' && !authReady && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center text-sm text-[#4A594C]">
            Restoring your FreshKart Agro Connect session...
          </div>
        )}

        {currentView === 'dashboard' && authReady && user && (
          <>
            {user.role === 'farmer' && (
              <FarmerDashboard
                user={user}
                refreshKey={dataRefreshKey}
                onUserUpdated={setUser}
                onGlobalDataChanged={handleGlobalDataChanged}
                onLogout={handleLogout}
              />
            )}
            {user.role === 'buyer' && (
              <BuyerDashboard
                user={user}
                refreshKey={dataRefreshKey}
                onUserUpdated={setUser}
                onOpenMarketplace={() => handleNavigate('marketplace')}
                onSelectProduct={setSelectedProduct}
                onGlobalDataChanged={handleGlobalDataChanged}
                onLogout={handleLogout}
              />
            )}
            {user.role === 'admin' && (
              <AdminDashboard
                user={user}
                refreshKey={dataRefreshKey}
                onGlobalDataChanged={handleGlobalDataChanged}
                onLogout={handleLogout}
              />
            )}
          </>
        )}
      </main>

      <Footer onNavigate={handleNavigate} onOpenRegisterRole={handleJoinRole} />

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          user={user}
          onClose={() => setSelectedProduct(null)}
          onRequireLogin={() => {
            setSelectedProduct(null);
            handleNavigate('login');
          }}
          onEnquirySubmitted={handleGlobalDataChanged}
        />
      )}
    </div>
  );
}
