import { useEffect, useState } from 'react';
import { Sprout, Store, Shield, ArrowRight } from 'lucide-react';
import {
  BUYER_CATEGORIES,
  WESTERN_ODISHA_DISTRICTS,
  type BuyerCategory,
  type PublicUser,
} from '../types';
import { api, setStoredToken } from '../lib/api';
import { isValidIndianPhone } from '../utils/whatsapp';

interface AuthPageProps {
  mode: 'login' | 'register';
  initialRole?: 'farmer' | 'buyer';
  onSwitchMode: (mode: 'login' | 'register') => void;
  onAuthSuccess: (user: PublicUser) => void;
}

const DEMO_ACCOUNTS = [
  {
    label: 'Demo Farmer — Ramesh Sahu (Bargarh)',
    detail: '6 active produce listings, incoming enquiries & buyer matches',
    email: 'ramesh.farmer@freshkart.demo',
    pass: 'farmer123',
    icon: Sprout,
  },
  {
    label: 'Demo Buyer — Sharma Grocery Store (Bargarh)',
    detail: 'Active Tomato & Rice requirements, enquiries & order tracking',
    email: 'sharma.buyer@freshkart.demo',
    pass: 'buyer123',
    icon: Store,
  },
  {
    label: 'Demo Admin — FreshKart Operations Console',
    detail: 'Protected console for listing approvals, user accounts & monitoring',
    email: 'admin@freshkart.demo',
    pass: 'admin123',
    icon: Shield,
  },
];

export function AuthPage({
  mode,
  initialRole = 'farmer',
  onSwitchMode,
  onAuthSuccess,
}: AuthPageProps) {
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register state
  const [regRole, setRegRole] = useState<'farmer' | 'buyer'>(initialRole);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState<string>('Bargarh');
  const [village, setVillage] = useState('');
  const [farmingDetails, setFarmingDetails] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [buyerCategory, setBuyerCategory] = useState<BuyerCategory>('Grocery Store');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setRegRole(initialRole);
    setError('');
  }, [initialRole]);

  const performLogin = async (emailToUse: string, passwordToUse: string) => {
    setError('');
    setSubmitting(true);
    try {
      const { token, user } = await api.login(emailToUse, passwordToUse);
      setStoredToken(token);
      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(loginEmail, loginPassword);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (fullName.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }
    if (!isValidIndianPhone(mobile)) {
      setError('Please enter a valid 10-digit Indian mobile number (starting with 6-9).');
      return;
    }
    if (village.trim().length < 2) {
      setError('Please enter your village, town, or market area.');
      return;
    }
    setSubmitting(true);
    try {
      const { token, user } = await api.register({
        fullName,
        mobile,
        email,
        password,
        role: regRole,
        district,
        village,
        farmingDetails: regRole === 'farmer' ? farmingDetails : undefined,
        businessName: regRole === 'buyer' ? businessName : undefined,
        buyerCategory: regRole === 'buyer' ? buyerCategory : undefined,
      });
      setStoredToken(token);
      onAuthSuccess(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Form Card */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-[#DCE6D9] p-6 sm:p-8">
          <div className="flex items-center gap-2 p-1 rounded-lg bg-[#F8FAF5] border border-[#DCE6D9] mb-6">
            <button
              type="button"
              onClick={() => {
                setError('');
                onSwitchMode('login');
              }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors min-h-[42px] ${
                mode === 'login'
                  ? 'bg-[#2E7D32] text-white'
                  : 'text-[#4A594C] hover:text-[#1A241B]'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => {
                setError('');
                onSwitchMode('register');
              }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition-colors min-h-[42px] ${
                mode === 'register'
                  ? 'bg-[#2E7D32] text-white'
                  : 'text-[#4A594C] hover:text-[#1A241B]'
              }`}
            >
              Create Account
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <h1 className="font-display font-bold text-2xl text-[#1A241B]">
                  Sign In to FreshKart Agro Connect
                </h1>
                <p className="text-sm text-[#4A594C] mt-1">
                  Access your Farmer, Buyer, or protected Admin workspace.
                </p>
              </div>

              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Email Address
                </label>
                <input
                  id="login-email"
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[46px]"
                />
              </div>

              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-[#1A241B] mb-1">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[46px]"
                />
              </div>

              {error && (
                <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] disabled:opacity-60 transition-colors min-h-[48px]"
              >
                {submitting ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <h1 className="font-display font-bold text-2xl text-[#1A241B]">
                  Register on FreshKart Agro Connect
                </h1>
                <p className="text-sm text-[#4A594C] mt-1">
                  Choose your role to get started in Western Odisha&apos;s direct farm marketplace.
                </p>
              </div>

              {/* Role selector */}
              <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Account role">
                <button
                  type="button"
                  role="radio"
                  aria-checked={regRole === 'farmer'}
                  onClick={() => {
                    setRegRole('farmer');
                    setError('');
                  }}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    regRole === 'farmer'
                      ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#1B5E20]'
                      : 'bg-white border-[#DCE6D9] text-[#4A594C] hover:bg-[#F8FAF5]'
                  }`}
                >
                  <Sprout className="w-5 h-5 mb-1.5" aria-hidden="true" />
                  <p className="font-semibold text-sm text-[#1A241B]">I am a Farmer</p>
                  <p className="text-xs text-[#4A594C] mt-0.5">List produce &amp; connect with buyers</p>
                </button>

                <button
                  type="button"
                  role="radio"
                  aria-checked={regRole === 'buyer'}
                  onClick={() => {
                    setRegRole('buyer');
                    setError('');
                  }}
                  className={`p-4 rounded-xl border text-left transition-colors ${
                    regRole === 'buyer'
                      ? 'bg-[#E8F5E9] border-[#2E7D32] text-[#1B5E20]'
                      : 'bg-white border-[#DCE6D9] text-[#4A594C] hover:bg-[#F8FAF5]'
                  }`}
                >
                  <Store className="w-5 h-5 mb-1.5" aria-hidden="true" />
                  <p className="font-semibold text-sm text-[#1A241B]">I am a Buyer</p>
                  <p className="text-xs text-[#4A594C] mt-0.5">Retailer, hotel, wholesaler or home</p>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-name" className="block text-sm font-medium text-[#1A241B] mb-1">
                    Full Name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Suresh Panda"
                    className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="reg-mobile" className="block text-sm font-medium text-[#1A241B] mb-1">
                    Mobile Number (WhatsApp)
                  </label>
                  <input
                    id="reg-mobile"
                    type="tel"
                    required
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="10-digit Indian mobile"
                    className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm tabular-nums min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-[#1A241B] mb-1">
                    Email Address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                  />
                </div>
                <div>
                  <label htmlFor="reg-password" className="block text-sm font-medium text-[#1A241B] mb-1">
                    Password (min 6 characters)
                  </label>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-district" className="block text-sm font-medium text-[#1A241B] mb-1">
                    District (Western Odisha)
                  </label>
                  <select
                    id="reg-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
                  >
                    {WESTERN_ODISHA_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="reg-village" className="block text-sm font-medium text-[#1A241B] mb-1">
                    {regRole === 'farmer' ? 'Village / Block' : 'Town / Market Area'}
                  </label>
                  <input
                    id="reg-village"
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder={regRole === 'farmer' ? 'e.g. Attabira' : 'e.g. Bargarh Main Road'}
                    className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                  />
                </div>
              </div>

              {regRole === 'farmer' ? (
                <div>
                  <label htmlFor="reg-farm" className="block text-sm font-medium text-[#1A241B] mb-1">
                    Farming Details (crops grown, land size)
                  </label>
                  <textarea
                    id="reg-farm"
                    rows={2}
                    value={farmingDetails}
                    onChange={(e) => setFarmingDetails(e.target.value)}
                    placeholder="e.g. 5 acres vegetable and paddy cultivation"
                    className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="reg-buyer-cat" className="block text-sm font-medium text-[#1A241B] mb-1">
                      Buyer Category
                    </label>
                    <select
                      id="reg-buyer-cat"
                      value={buyerCategory}
                      onChange={(e) => setBuyerCategory(e.target.value as BuyerCategory)}
                      className="w-full rounded-lg border border-[#DCE6D9] bg-white px-3.5 py-2.5 text-sm min-h-[44px]"
                    >
                      {BUYER_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-business" className="block text-sm font-medium text-[#1A241B] mb-1">
                      Business Name (optional for households)
                    </label>
                    <input
                      id="reg-business"
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g. Mahadev Fresh Mart"
                      className="w-full rounded-lg border border-[#DCE6D9] px-3.5 py-2.5 text-sm min-h-[44px]"
                    />
                  </div>
                </div>
              )}

              {error && (
                <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-5 rounded-lg bg-[#2E7D32] text-white text-sm font-semibold hover:bg-[#1B5E20] disabled:opacity-60 transition-colors min-h-[48px]"
              >
                {submitting
                  ? 'Creating Account...'
                  : `Create ${regRole === 'farmer' ? 'Farmer' : 'Buyer'} Account`}
              </button>
            </form>
          )}
        </div>

        {/* Demo Accounts Card for Presentation */}
        <aside className="lg:col-span-5 bg-white rounded-xl border border-[#DCE6D9] p-6 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[#2E7D32]">DEMO ACCOUNTS · Western Odisha MVP</p>
            <h2 className="font-display font-bold text-lg text-[#1A241B] mt-1">
              Quick Demo Access for Presentation
            </h2>
            <p className="text-xs text-[#4A594C] mt-1 leading-relaxed">
              Use these clearly labeled demonstration accounts to test Farmer, Buyer, and protected
              Admin workflows immediately, or register a brand-new account on the left.
            </p>
          </div>

          <div className="space-y-3">
            {DEMO_ACCOUNTS.map((acct) => {
              const Icon = acct.icon;
              return (
                <button
                  key={acct.email}
                  type="button"
                  disabled={submitting}
                  onClick={() => performLogin(acct.email, acct.pass)}
                  className="w-full text-left p-4 rounded-xl bg-[#F8FAF5] border border-[#DCE6D9] hover:border-[#2E7D32] hover:bg-[#E8F5E9]/50 transition-colors flex items-start gap-3 group"
                >
                  <span className="w-9 h-9 rounded-lg bg-white border border-[#DCE6D9] text-[#1B5E20] flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-[#1A241B] flex items-center justify-between gap-2">
                      <span className="truncate">{acct.label}</span>
                      <ArrowRight
                        className="w-4 h-4 text-[#2E7D32] shrink-0 group-hover:translate-x-0.5 transition-transform"
                        aria-hidden="true"
                      />
                    </p>
                    <p className="text-xs text-[#4A594C] mt-0.5">{acct.detail}</p>
                    <p className="text-[11px] font-mono text-[#4A594C] mt-1.5 truncate">
                      {acct.email} / {acct.pass}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>
      </div>
    </div>
  );
}
