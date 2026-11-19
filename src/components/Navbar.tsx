import { useState } from 'react';
import { Menu, X, Sprout, LogOut, LayoutDashboard } from 'lucide-react';
import type { PublicUser } from '../types';

export type AppView =
  | 'home'
  | 'marketplace'
  | 'requirements'
  | 'about'
  | 'login'
  | 'register'
  | 'dashboard';

interface NavbarProps {
  currentView: AppView;
  user: PublicUser | null;
  onNavigate: (view: AppView, sectionId?: string) => void;
  onLogout: () => void;
}

export function Navbar({ currentView, user, onNavigate, onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLink = (view: AppView, sectionId?: string) => {
    setMobileOpen(false);
    onNavigate(view, sectionId);
  };

  const dashboardLabel =
    user?.role === 'admin'
      ? 'Admin Console'
      : user?.role === 'farmer'
      ? 'Farmer Dashboard'
      : 'Buyer Dashboard';

  const navItems: { label: string; view: AppView; sectionId?: string }[] = [
    { label: 'Home', view: 'home' },
    { label: 'Marketplace', view: 'marketplace' },
    { label: 'For Farmers', view: 'home', sectionId: 'for-farmers' },
    { label: 'For Buyers', view: 'home', sectionId: 'for-buyers' },
    { label: 'About Us', view: 'about' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#DCE6D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single line, no descriptor/badge) */}
        <button
          type="button"
          onClick={() => handleLink('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group"
          aria-label="FreshKart Agro Connect Home"
        >
          <span className="w-8 h-8 rounded-lg bg-[#2E7D32] text-white flex items-center justify-center shrink-0 group-hover:bg-[#1B5E20] transition-colors">
            <Sprout className="w-5 h-5" aria-hidden="true" />
          </span>
          <span className="font-display font-bold text-lg tracking-tight text-[#1A241B]">
            FreshKart Agro Connect
          </span>
        </button>

        {/* Zone 2: 5 clean single-line navigation links */}
        <nav aria-label="Main navigation" className="hidden lg:flex items-center gap-7">
          {navItems.map((item) => {
            const isActive = !item.sectionId && currentView === item.view;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleLink(item.view, item.sectionId)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  isActive
                    ? 'text-[#1B5E20] border-[#2E7D32]'
                    : 'text-[#4A594C] border-transparent hover:text-[#1A241B] hover:border-[#DCE6D9]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Auth / Primary Action */}
        <div className="hidden lg:flex items-center gap-4 shrink-0">
          {user ? (
            <>
              <button
                type="button"
                onClick={() => handleLink('dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#2E7D32] text-white hover:bg-[#1B5E20] transition-colors whitespace-nowrap shrink-0"
              >
                <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
                <span>{dashboardLabel}</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4A594C] hover:text-[#1A241B] whitespace-nowrap shrink-0 py-2"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => handleLink('login')}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-2 transition-colors ${
                  currentView === 'login'
                    ? 'text-[#1B5E20] underline underline-offset-4'
                    : 'text-[#4A594C] hover:text-[#1A241B]'
                }`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => handleLink('register')}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#2E7D32] text-white hover:bg-[#1B5E20] transition-colors whitespace-nowrap shrink-0"
              >
                Register
              </button>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#1A241B] hover:bg-[#E8F5E9] transition-colors"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="lg:hidden border-t border-[#DCE6D9] bg-white px-4 py-4 space-y-2">
          <nav aria-label="Mobile navigation" className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => handleLink(item.view, item.sectionId)}
                className="w-full text-left px-3 py-3 rounded-lg text-base font-medium text-[#1A241B] hover:bg-[#E8F5E9] min-h-[44px]"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-3 border-t border-[#DCE6D9] flex flex-col gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => handleLink('dashboard')}
                  className="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-[#2E7D32] text-white min-h-[44px]"
                >
                  {dashboardLabel}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    onLogout();
                  }}
                  className="w-full py-3 px-4 rounded-lg text-sm font-medium text-[#4A594C] border border-[#DCE6D9] min-h-[44px]"
                >
                  Logout ({user.fullName})
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => handleLink('login')}
                  className="w-full py-3 px-4 rounded-lg text-sm font-semibold text-[#1B5E20] border border-[#2E7D32]/30 min-h-[44px]"
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleLink('register')}
                  className="w-full py-3 px-4 rounded-lg text-sm font-semibold bg-[#2E7D32] text-white min-h-[44px]"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
