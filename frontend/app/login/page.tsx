'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store';
import api from '../api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth, token } = useAuthStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [franchises, setFranchises] = useState<any[]>([]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('MLM_DISTRIBUTOR');
  const [franchiseId, setFranchiseId] = useState('');
  const [storeRole, setStoreRole] = useState('CASHIER');
  const [sponsorId, setSponsorId] = useState('');
  const [position, setPosition] = useState('LEFT');

  useEffect(() => {
    if (token) router.push('/dashboard');
  }, [token, router]);

  useEffect(() => {
    if (!isLogin) {
      api.get('/api/franchises')
        .then((res) => setFranchises(res.data))
        .catch(() => {});
    }
  }, [isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isLogin) {
        const res = await api.post('/api/auth/login', { email, password });
        setAuth(res.data.access_token, res.data.user);
        toast.success(`Welcome back, ${res.data.user.firstName}!`);
        router.push('/dashboard');
      } else {
        const payload: any = { email, password, firstName, lastName: lastName || undefined, role };
        if (role === 'STORE_USER') {
          payload.franchiseId = franchiseId;
          payload.storeRole = storeRole;
        } else if (role === 'MLM_DISTRIBUTOR') {
          payload.sponsorId = sponsorId || undefined;
          payload.position = position;
        }
        await api.post('/api/auth/register', payload);
        toast.success('Registration successful! Please login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Authentication failed';
      toast.error(Array.isArray(msg) ? msg[0] : msg);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-3 text-slate-200 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base sm:text-sm transition-colors';
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-slate-400';
  const selectCls = 'mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-3 text-slate-200 outline-none focus:border-indigo-500 text-base sm:text-sm transition-colors';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-8 font-sans text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950/60 p-6 sm:p-8 shadow-2xl backdrop-blur-xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xl">
            J
          </div>
          <h1 className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-2xl sm:text-3xl font-extrabold tracking-tight text-transparent">
            Jeevan CRM + MLM
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin ? 'Sign in to access your enterprise console' : 'Register a new account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name fields — stacked on mobile, side by side on sm+ */}
          {!isLogin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>First Name *</label>
                <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="Rahul" />
              </div>
              <div>
                <label className={labelCls}>Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Kumar" />
              </div>
            </div>
          )}

          <div>
            <label className={labelCls}>Email Address *</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" />
          </div>

          <div>
            <label className={labelCls}>Password *</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••••••" />
          </div>

          {!isLogin && (
            <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/30 p-4">
              <div>
                <label className={labelCls}>User Role</label>
                <select value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
                  <option value="MLM_DISTRIBUTOR">MLM Distributor</option>
                  <option value="STORE_USER">Store User (Cashier / Manager)</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              {role === 'STORE_USER' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Franchise *</label>
                    <select required value={franchiseId} onChange={(e) => setFranchiseId(e.target.value)} className={selectCls}>
                      <option value="">Select Branch</option>
                      {franchises.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Store Role</label>
                    <select value={storeRole} onChange={(e) => setStoreRole(e.target.value)} className={selectCls}>
                      <option value="CASHIER">Cashier</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                </div>
              )}

              {role === 'MLM_DISTRIBUTOR' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Sponsor ID (Optional)</label>
                    <input type="text" placeholder="e.g. clk345..." value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Tree Leg</label>
                    <select value={position} onChange={(e) => setPosition(e.target.value)} className={selectCls}>
                      <option value="LEFT">Left Leg</option>
                      <option value="RIGHT">Right Leg</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-xl bg-indigo-600 px-4 py-3.5 font-semibold text-white transition-all hover:bg-indigo-500 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-400 text-sm"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isLogin ? 'Sign In' : 'Register Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-semibold text-indigo-400 transition-colors hover:text-indigo-300 py-2"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
