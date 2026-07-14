'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '../store';
import api from '../api';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertCircle,
  TrendingUp,
  Award,
  Network,
  Wallet,
  ArrowUpRight,
  UserPlus,
  Activity,
  CheckCircle,
  Zap,
  Shield,
  Clock,
  ExternalLink,
} from 'lucide-react';

export default function DashboardOverview() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);
  const [treeData, setTreeData] = useState<any>(null);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [heldData, setHeldData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const promises = [];
    if (user?.role === 'ADMIN' || user?.role === 'STORE_USER') {
      promises.push(api.get('/api/sales').then((res) => setSales(res.data)).catch(() => {}));
      promises.push(api.get('/api/customers').then((res) => setCustomers(res.data)).catch(() => {}));
      promises.push(api.get('/api/products/low-stock').then((res) => setLowStock(res.data)).catch(() => {}));
    }

    if (user?.role === 'MLM_DISTRIBUTOR') {
      promises.push(api.get('/api/mlm/tree').then((res) => setTreeData(res.data)).catch(() => {}));
      promises.push(api.get('/api/sales').then((res) => setSales(res.data)).catch(() => {}));
      promises.push(api.get('/api/mlm/commissions').then((res) => setCommissions(res.data)).catch(() => {}));
      promises.push(api.get('/api/mlm/held-commissions').then((res) => setHeldData(res.data)).catch(() => {}));
    }

    // Fetch system notifications for all logged-in profiles
    promises.push(api.get('/api/mlm/notifications').then((res) => setNotifications(res.data)).catch(() => {}));

    Promise.all(promises).finally(() => setLoading(false));
  }, [user]);

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalSalesCount = sales.length;
  const goldCount = customers.filter((c) => c.isGoldMember).length;

  const getDisplayRole = () => {
    if (user?.role === 'ADMIN') return 'Super Admin';
    if (user?.role === 'MLM_DISTRIBUTOR') return 'MLM Distributor';
    if (user?.role === 'STORE_USER') {
      const storeRole = user.storeUsers?.[0]?.role;
      if (storeRole === 'OWNER') return 'Franchise Owner';
      if (storeRole === 'MANAGER') return 'Store Manager';
      if (storeRole === 'CASHIER') return 'Sales Executive';
      return 'Store Executive';
    }
    return user?.role || 'Guest';
  };

  const displayRole = getDisplayRole();

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/mlm/notifications/read');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications');
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center text-slate-400">
        <div className="text-center space-y-2">
          <svg className="mx-auto h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-xs">Loading dashboard metrics...</p>
        </div>
      </div>
    );
  }

  // RENDER DYNAMIC DASHBOARDS BASED ON ROLES
  if (user?.role === 'ADMIN') {
    // ----------------------------------------------------
    // SUPER ADMIN DASHBOARD
    // ----------------------------------------------------
    return (
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-indigo-400">Super Admin Dashboard</h1>
            <p className="text-sm text-slate-400">Welcome back, {user.firstName}. Here is what is happening across your network today.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-400 font-medium">Last 30 Days</span>
            <button
              onClick={() => toast.success('CSV Report generated successfully')}
              className="rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              Export Report <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-2xl font-bold mt-1">₹{totalRevenue.toFixed(2)}</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">+24%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Combined franchise + direct sales</p>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
                <h3 className="text-2xl font-bold mt-1">{totalSalesCount}</h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">+10%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Orders processed in active showrooms</p>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Customers</p>
                <h3 className="text-2xl font-bold mt-1">{customers.length}</h3>
              </div>
              <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">-4%</span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              <div className="flex -space-x-1.5 overflow-hidden">
                <div className="inline-block h-4.5 w-4.5 rounded-full bg-slate-850 ring-2 ring-slate-950" />
                <div className="inline-block h-4.5 w-4.5 rounded-full bg-indigo-950 ring-2 ring-slate-950" />
                <div className="inline-block h-4.5 w-4.5 rounded-full bg-slate-800 ring-2 ring-slate-950" />
              </div>
              <span className="text-[9px] text-slate-500">Newly registered this week</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gold Cards Issued</p>
                <h3 className="text-2xl font-bold mt-1">{goldCount}</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">85% Limit</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Active Gold Card Memberships</p>
          </div>
        </div>

        {/* Charts & Organization curves */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Revenue Growth</h2>
            {/* Custom SVG Line Chart */}
            <div className="h-48 w-full flex items-end">
              <svg className="w-full h-full text-indigo-500/20" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,130 C50,130 80,90 130,100 C180,110 210,60 260,50 C310,40 350,70 400,30 C450,20 480,10 500,5 L500,150 L0,150 Z"
                  fill="url(#revenueGrad)"
                />
                <path
                  d="M0,130 C50,130 80,90 130,100 C180,110 210,60 260,50 C310,40 350,70 400,30 C450,20 480,10 500,5"
                  fill="none"
                  stroke="rgb(99, 102, 241)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>JAN</span>
              <span>FEB</span>
              <span>MAR</span>
              <span>APR</span>
              <span>MAY</span>
              <span>JUN</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Audit Logs</h2>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">System database updated</p>
                  <span className="text-[10px] text-slate-500">Schema version 2.1 • 3 mins ago</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">New Branch and Member</p>
                  <span className="text-[10px] text-slate-500">Sponsor Key: Root Node • 45 mins ago</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Security Alert</p>
                  <span className="text-[10px] text-slate-500">Multiple backend logins • 2 hours ago</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-2 w-2 rounded-full bg-slate-600 mt-1.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-slate-200">Weekly Backup Completed</p>
                  <span className="text-[10px] text-slate-500">Encrypted backup verified • 1 day ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower layout grids */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Recent Support Tickets</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-400">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5">Ticket ID</th>
                    <th className="py-2.5">Requester</th>
                    <th className="py-2.5 hidden sm:table-cell">Subject</th>
                    <th className="py-2.5 hidden sm:table-cell">Priority</th>
                    <th className="py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  <tr>
                    <td className="py-3 font-semibold text-indigo-400">#TK-1021</td>
                    <td className="py-3">David Jenkins</td>
                    <td className="py-3 hidden sm:table-cell">Commission payouts delay</td>
                    <td className="py-3 hidden sm:table-cell"><span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">High</span></td>
                    <td className="py-3 text-right"><span className="text-emerald-400 font-bold">Open</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-indigo-400">#TK-1022</td>
                    <td className="py-3">Michael Davis</td>
                    <td className="py-3 hidden sm:table-cell">Sales check out system latency</td>
                    <td className="py-3 hidden sm:table-cell"><span className="rounded-md bg-yellow-500/10 px-1.5 py-0.5 text-[9px] font-bold text-yellow-500 uppercase tracking-wider">Medium</span></td>
                    <td className="py-3 text-right"><span className="text-slate-500 font-bold">Pending</span></td>
                  </tr>
                  <tr>
                    <td className="py-3 font-semibold text-indigo-400">#TK-1023</td>
                    <td className="py-3">Jane Robs</td>
                    <td className="py-3 hidden sm:table-cell">Gold Card registration error</td>
                    <td className="py-3 hidden sm:table-cell"><span className="rounded-md bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-400 uppercase tracking-wider">High</span></td>
                    <td className="py-3 text-right"><span className="text-emerald-400 font-bold">Solved</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4 flex flex-col justify-between">
            <h2 className="text-sm font-bold text-slate-300">Store Network Overview</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Active Showrooms:</span>
                <span className="font-bold text-slate-200">12 branch locations</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Registered Distributors:</span>
                <span className="font-bold text-slate-200">1,280 accounts</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500">Pending Comm Payouts:</span>
                <span className="font-bold text-slate-200">₹8,500.00</span>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/franchises')}
              className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-800"
            >
              Manage Branches <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* System Notifications widget */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-400" /> Notifications & Alerts
            </h2>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 col-span-2">No recent notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  n.isRead ? 'border-slate-900 bg-slate-950/20' : 'border-indigo-500/20 bg-indigo-500/5'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200">{n.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  if (user?.role === 'MLM_DISTRIBUTOR') {
    // ----------------------------------------------------
    // MLM MEMBER DASHBOARD
    // ----------------------------------------------------
    const sponsorName = treeData?.parent?.user ? `${treeData.parent.user.firstName} ${treeData.parent.user.lastName || ''}` : 'Company Node';
    const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
    const pendingCommissions = commissions.filter(c => c.status === 'PENDING').reduce((sum, c) => sum + c.amount, 0);
    const totalHeld = heldData?.totalHeld || 0;

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-indigo-400">Welcome back, {user.firstName}</h1>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-900/40 rounded-lg border border-slate-800 p-4 max-w-xl">
            <div>
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Rank Status</p>
              <h4 className="text-sm font-bold text-indigo-400 mt-1">{treeData?.rank || 'Sales Advisor'}</h4>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 font-medium">Sponsor: {sponsorName}</span>
              <p className="text-xs text-indigo-300 font-bold mt-1">Level 1 Direct Recruiter</p>
            </div>
          </div>
        </div>

        {/* Exited Founder Banner */}
        {treeData?.rank === 'FOUNDER_EXITED' && (
          <div className="rounded-2xl border border-indigo-500/40 bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-950 p-6 space-y-4 shadow-xl">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 animate-pulse shrink-0">
                <Award className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 className="text-lg font-black text-slate-100 animate-bounce">Congratulations on your Auto-Exit! 🎓🏆</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  You have successfully reached the maximum earnings threshold of <strong>₹2.59 Crore</strong>! 
                  As a Founder Member, you are now auto-exited from the active downline commission walk, with your lifetime achievements cemented in the hall of fame.
                </p>
                <div className="text-xs text-slate-500 mt-2 flex flex-col sm:flex-row gap-4 font-mono">
                  <span>Exit Certificate: <strong>Active</strong></span>
                  <span>Exit Bonus (2%): <strong>₹5,18,000 Paid</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5 Stats Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Personal Sales</p>
                <h3 className="text-2xl font-bold mt-1">{treeData?.personalPv?.toFixed(0) || 0} PV</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">+12%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Your direct personal volume sales</p>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Team Volume</p>
                <h3 className="text-2xl font-bold mt-1">{treeData?.groupPv?.toFixed(0) || 0} PV</h3>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">+15%</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Cumulative volume in your downline</p>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direct Referrals</p>
                <h3 className="text-2xl font-bold mt-1">{treeData?.children?.length || 0}</h3>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">+6 New</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Personally sponsored accounts</p>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Commission</p>
                <h3 className="text-2xl font-bold mt-1">₹{totalCommissions.toFixed(2)}</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">₹{pendingCommissions.toFixed(0)} Pend</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Direct recruiter + matching bonuses</p>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Held Commissions</p>
                <h3 className="text-2xl font-bold mt-1 text-amber-500">₹{totalHeld.toFixed(2)}</h3>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">Held</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Released on rank promotion milestones</p>
          </div>
        </div>

        {/* Network & Commission Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-300">Earnings Overview</h2>
            <div className="h-44 w-full flex items-end">
              <svg className="w-full h-full text-indigo-500/20" viewBox="0 0 500 150" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="revenueGrad2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,120 C50,110 80,70 130,80 C180,90 210,40 260,30 C310,20 350,50 400,20 C450,10 480,5 500,2 L500,150 L0,150 Z"
                  fill="url(#revenueGrad2)"
                />
                <path
                  d="M0,120 C50,110 80,70 130,80 C180,90 210,40 260,30 C310,20 350,50 400,20 C450,10 480,5 500,2"
                  fill="none"
                  stroke="rgb(99, 102, 241)"
                  strokeWidth="2.5"
                />
              </svg>
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>JAN</span>
              <span>FEB</span>
              <span>MAR</span>
              <span>APR</span>
              <span>MAY</span>
              <span>JUN</span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-5 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-300">Commission Mix</h2>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Direct Sponsor Bonus:</span>
                    <span className="font-semibold text-slate-200">₹{totalCommissions ? (totalCommissions * 0.6).toFixed(0) : 0}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-900"><div className="h-full rounded-full bg-indigo-500 w-[60%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Binary Matching Cycle:</span>
                    <span className="font-semibold text-slate-200">₹{totalCommissions ? (totalCommissions * 0.3).toFixed(0) : 0}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-900"><div className="h-full rounded-full bg-emerald-500 w-[30%]" /></div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">Rank Milestone Pool:</span>
                    <span className="font-semibold text-slate-200">₹{totalCommissions ? (totalCommissions * 0.1).toFixed(0) : 0}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-900"><div className="h-full rounded-full bg-amber-500 w-[10%]" /></div>
                </div>
              </div>
            </div>
            <button
              onClick={() => router.push('/dashboard/mlm')}
              className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 py-2 text-xs font-bold transition-all"
            >
              Open Network Tree
            </button>
          </div>
        </div>

        {/* System Notifications widget at bottom */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-400" /> Notifications & Alerts
            </h2>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 col-span-2">No recent notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  n.isRead ? 'border-slate-900 bg-slate-950/20' : 'border-indigo-500/20 bg-indigo-500/5'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200">{n.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STORE CRM EXECUTIVE DASHBOARD (STORE_USER role)
  // ----------------------------------------------------
  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-indigo-400">Store Dashboard</h1>
          <p className="text-sm text-slate-400">Manage your inventory, checkout orders and franchise customer growth.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard/products')}
            className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            All Products
          </button>
          <button
            onClick={() => router.push('/dashboard/sales')}
            className="rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 px-3.5 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            New Order <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Sales</p>
              <h3 className="text-2xl font-bold mt-1">₹{totalRevenue.toFixed(2)}</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">+12.4%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Sales registered this month</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-2xl font-bold mt-1">{totalSalesCount}</h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">+8.3%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Completed customer checkouts</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Growth</p>
              <h3 className="text-2xl font-bold mt-1">{customers.length}</h3>
            </div>
            <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">+4%</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">New customers mapped to profile</p>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex flex-col justify-between h-32 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Showrooms</p>
              <h3 className="text-2xl font-bold mt-1">18</h3>
            </div>
            <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">Authorised</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2">Authorized locations in network</p>
        </div>
      </div>

      {/* Main performance curves & lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-300">Sales Performance</h2>
          <div className="h-44 w-full flex items-end">
            <svg className="w-full h-full text-indigo-500/20" viewBox="0 0 500 150" preserveAspectRatio="none">
              <defs>
                <linearGradient id="revenueGrad3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M0,140 C50,120 80,90 130,95 C180,100 210,50 260,60 C310,70 350,40 400,30 C450,20 480,10 500,5 L500,150 L0,150 Z"
                fill="url(#revenueGrad3)"
              />
              <path
                d="M0,140 C50,120 80,90 130,95 C180,100 210,50 260,60 C310,70 350,40 400,30 C450,20 480,10 500,5"
                fill="none"
                stroke="rgb(99, 102, 241)"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
            <span>SUN</span>
          </div>
        </div>

        {/* Top Selling Products Block */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-300">Top Products</h2>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                <div>
                  <p className="font-semibold text-slate-200">Apex V2 Headphones</p>
                  <span className="text-[10px] text-slate-500">SKU: HP-APEX</span>
                </div>
                <span className="font-bold text-slate-300">₹9,242.00</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                <div>
                  <p className="font-semibold text-slate-200">Nexus Smartwatch</p>
                  <span className="text-[10px] text-slate-500">SKU: SW-NEX</span>
                </div>
                <span className="font-bold text-slate-300">₹5,800.00</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-900 pb-2">
                <div>
                  <p className="font-semibold text-slate-200">Mechanical KB-9</p>
                  <span className="text-[10px] text-slate-500">SKU: KB-MECH</span>
                </div>
                <span className="font-bold text-slate-300">₹3,120.00</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/dashboard/products')}
            className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 py-2 text-xs font-semibold border border-slate-800 transition-colors"
          >
            Manage Products
          </button>
        </div>
      </div>

      {/* Recent sales table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-300">Recent Checkout Orders</h2>
          {sales.length === 0 ? (
            <p className="text-xs text-slate-500 py-4">No checkout orders registered yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-400 border-collapse">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-500 uppercase tracking-wider font-mono">
                    <th className="py-2.5">Order ID</th>
                    <th className="py-2.5">Customer</th>
                    <th className="py-2.5 hidden sm:table-cell">Date</th>
                    <th className="py-2.5 hidden sm:table-cell">Payment Method</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {sales.slice(0, 5).map((sale) => (
                    <tr key={sale.id}>
                      <td className="py-3 font-semibold text-slate-200">{sale.invoiceNumber}</td>
                      <td className="py-3">{sale.customer ? `${sale.customer.firstName} ${sale.customer.lastName || ''}`.trim() : 'Guest'}</td>
                      <td className="py-3 hidden sm:table-cell">{new Date(sale.saleDate).toLocaleDateString()}</td>
                      <td className="py-3 hidden sm:table-cell">{sale.paymentMethod || 'Cash'}</td>
                      <td className="py-3 text-right font-bold text-slate-100">₹{sale.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Stock warnings alert card */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-2"><AlertCircle className="h-4.5 w-4.5 text-yellow-500" /> Low Stock Alerts</h2>
            <span className="rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-500">{lowStock.length}</span>
          </div>
          <div className="space-y-3.5">
            {lowStock.length === 0 ? (
              <p className="text-xs text-slate-500">All products have healthy inventory levels.</p>
            ) : (
              lowStock.slice(0, 4).map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs border-b border-slate-900/50 pb-2">
                  <div>
                    <p className="font-semibold text-slate-300 leading-tight">{p.name}</p>
                    <span className="text-[10px] text-slate-500">SKU: {p.sku}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-red-400">{p.inventory?.quantity || 0}</span>
                    <span className="text-[10px] text-slate-500 block">Reorder: {p.inventory?.reorderLevel}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* System Notifications widget */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4 col-span-1 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-900 pb-3">
            <h2 className="text-sm font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-400" /> Notifications & Alerts
            </h2>
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-60 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4 col-span-2">No recent notifications</p>
            ) : (
              notifications.map((n) => (
                <div key={n.id} className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                  n.isRead ? 'border-slate-900 bg-slate-950/20' : 'border-indigo-500/20 bg-indigo-500/5'
                }`}>
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-slate-200">{n.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">{n.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
