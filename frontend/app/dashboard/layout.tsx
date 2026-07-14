'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '../store';
import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  Users,
  CreditCard,
  Network,
  LogOut,
  User as UserIcon,
  Car,
  Calendar,
  BarChart3,
  Star,
  BadgeDollarSign,
  UserCog,
  Menu,
  X,
  FileText,
  Share2,
  Award,
  ShieldCheck,
  Settings,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      toast.error('Session expired, please login.');
      router.push('/login');
    }
  }, [token, router]);

  // Close sidebar on route change (mobile nav)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!mounted || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center">
          <svg className="mx-auto h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-2 text-sm">Verifying session...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/login');
  };

  const getDisplayRole = () => {
    if (user.role === 'ADMIN') return 'Super Admin';
    if (user.role === 'MLM_DISTRIBUTOR') return 'MLM Distributor';
    if (user.role === 'STORE_USER') {
      const storeRole = user.storeUsers?.[0]?.role;
      if (storeRole === 'OWNER') return 'Franchise Owner';
      if (storeRole === 'MANAGER') return 'Store Manager';
      if (storeRole === 'CASHIER') return 'Sales Executive';
      return 'Store Executive';
    }
    return user.role;
  };

  const displayRole = getDisplayRole();

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['Super Admin', 'Franchise Owner', 'Store Manager', 'Sales Executive', 'MLM Distributor'] },
    { name: 'Franchises', href: '/dashboard/franchises', icon: Store, roles: ['Super Admin'] },
    { name: 'Products & Stock', href: '/dashboard/products', icon: ShoppingBag, roles: ['Super Admin', 'Franchise Owner', 'Store Manager', 'Sales Executive', 'MLM Distributor'] },
    { name: 'Customers', href: '/dashboard/customers', icon: Users, roles: ['Super Admin', 'Franchise Owner', 'Store Manager', 'Sales Executive', 'MLM Distributor'] },
    { name: 'POS Checkout', href: '/dashboard/sales', icon: CreditCard, roles: ['Super Admin', 'Franchise Owner', 'Store Manager', 'Sales Executive', 'MLM Distributor'] },
    { name: 'Vehicles', href: '/dashboard/vehicles', icon: Car, roles: ['Super Admin', 'Franchise Owner', 'Store Manager', 'Sales Executive'] },
    { name: 'Follow-ups', href: '/dashboard/followups', icon: Calendar, roles: ['Super Admin', 'Franchise Owner', 'Store Manager', 'Sales Executive'] },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['Super Admin', 'Franchise Owner', 'Store Manager'] },
    { name: 'MLM Downline', href: '/dashboard/mlm', icon: Network, roles: ['Super Admin', 'MLM Distributor'] },
    { name: 'Referral Program', href: '/dashboard/referrals', icon: Share2, roles: ['MLM Distributor'] },
    { name: 'My Policy', href: '/dashboard/policy', icon: FileText, roles: ['MLM Distributor'] },
    { name: 'My Awards', href: '/dashboard/awards', icon: Award, roles: ['MLM Distributor'] },
    { name: 'KYC Document upload', href: '/dashboard/kyc', icon: ShieldCheck, roles: ['MLM Distributor', 'Super Admin'] },
    { name: 'Gold Card Sales', href: '/dashboard/gold-card', icon: Star, roles: ['Sales Executive', 'Store Manager', 'Franchise Owner', 'MLM Distributor'] },
    { name: 'Payment Dashboard', href: '/dashboard/gold-card/admin', icon: BadgeDollarSign, roles: ['Super Admin'] },
    { name: 'Appoint Founder', href: '/dashboard/admin/founder-appointment', icon: UserCheck, roles: ['Super Admin'] },
    { name: 'Joining Fee Config', href: '/dashboard/admin/joining-fee', icon: Settings, roles: ['Super Admin'] },
    { name: 'Assign Policies', href: '/dashboard/admin/policy-assign', icon: FileText, roles: ['Super Admin'] },
    { name: 'Manage Users', href: '/dashboard/users', icon: UserCog, roles: ['Super Admin'] },
  ];

  const filteredNav = navItems.filter((item) => item.roles.includes(displayRole));

  const SidebarContent = () => (
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
            J
          </div>
          <div>
            <h2 className="font-bold text-sm leading-none">Jeevan CRM</h2>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Enterprise</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="mt-6 space-y-0.5">
          {filteredNav.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400 border-l-2 border-indigo-500'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* User card + logout */}
      <div className="border-t border-slate-900 pt-4 space-y-3">
        <div className="flex items-center gap-3 px-2">
          <div className="h-9 w-9 shrink-0 rounded-full bg-slate-800 flex items-center justify-center">
            <UserIcon className="h-4 w-4 text-slate-400" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate leading-tight">{user.firstName} {user.lastName || ''}</p>
            <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{displayRole}</span>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">

      {/* ── Desktop Sidebar (hidden on mobile) ─────────────────────────── */}
      <aside className="hidden lg:flex w-64 shrink-0 border-r border-slate-900 bg-slate-950/90 flex-col p-5">
        <SidebarContent />
      </aside>

      {/* ── Mobile Sidebar Overlay ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Mobile Sidebar Drawer ───────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-800 bg-slate-950 p-5 flex flex-col transition-transform duration-300 ease-in-out lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarContent />
      </aside>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header className="sticky top-0 z-30 h-14 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Hamburger — only on mobile */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile logo (shown when sidebar is closed) */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
              J
            </div>
            <span className="text-sm font-bold text-slate-200">Jeevan CRM</span>
          </div>

          <div className="ml-auto text-xs text-slate-500 font-medium hidden sm:block">
            System status: <span className="text-emerald-500">Connected</span>
          </div>

          {/* Mobile: current user chip */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-7 w-7 rounded-full bg-slate-800 flex items-center justify-center">
              <UserIcon className="h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
