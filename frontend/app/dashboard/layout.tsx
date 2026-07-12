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
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, user, logout } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Secure dashboard client-side
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      toast.error('Session expired, please login.');
      router.push('/login');
    }
  }, [token, router]);

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
    { name: 'Gold Card Sales', href: '/dashboard/gold-card', icon: Star, roles: ['Sales Executive', 'Store Manager', 'Franchise Owner', 'MLM Distributor'] },
    { name: 'Payment Dashboard', href: '/dashboard/gold-card/admin', icon: BadgeDollarSign, roles: ['Super Admin'] },
  ];

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-100 antialiased">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-900 bg-slate-950/90 p-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-lg">
              V
            </div>
            <div>
              <h2 className="font-bold text-sm leading-none">Vortex CRM</h2>
              <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Enterprise</span>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {navItems
              .filter((item) => item.roles.includes(displayRole))
              .map((item) => {
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
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* User Card */}
        <div className="border-t border-slate-900 pt-4 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center">
              <UserIcon className="h-4 w-4 text-slate-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold truncate leading-tight">{user.firstName} {user.lastName || ''}</p>
              <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{displayRole}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-900 bg-slate-950/50 backdrop-blur-md px-8 flex items-center justify-end">
          <div className="text-xs text-slate-500 font-medium">
            System status: <span className="text-emerald-500">Connected</span>
          </div>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
