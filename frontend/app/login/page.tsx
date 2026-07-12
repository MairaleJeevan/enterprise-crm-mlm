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

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('MLM_DISTRIBUTOR'); // Default
  const [franchiseId, setFranchiseId] = useState('');
  const [storeRole, setStoreRole] = useState('CASHIER');
  const [sponsorId, setSponsorId] = useState('');
  const [position, setPosition] = useState('LEFT');

  useEffect(() => {
    // Redirect if already logged in
    if (token) {
      router.push('/dashboard');
    }
  }, [token, router]);

  useEffect(() => {
    // Fetch franchises list for registration dropdown
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
        const payload: any = {
          email,
          password,
          firstName,
          lastName: lastName || undefined,
          role,
        };

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-radial from-slate-900 to-black px-4 font-sans text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950/60 p-8 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent">
            Jeevan CRM + MLM
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin ? 'Sign in to access your enterprise console' : 'Register a new account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {!isLogin && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">First Name</label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {!isLogin && (
            <div className="space-y-4 rounded-xl border border-slate-900 bg-slate-900/20 p-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">User Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 outline-hidden focus:border-indigo-500"
                >
                  <option value="MLM_DISTRIBUTOR">MLM Distributor</option>
                  <option value="STORE_USER">Store User (Cashier/Manager)</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>

              {role === 'STORE_USER' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Franchise</label>
                    <select
                      required
                      value={franchiseId}
                      onChange={(e) => setFranchiseId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 outline-hidden focus:border-indigo-500"
                    >
                      <option value="">Select Branch</option>
                      {franchises.map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Store Role</label>
                    <select
                      value={storeRole}
                      onChange={(e) => setStoreRole(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 outline-hidden focus:border-indigo-500"
                    >
                      <option value="CASHIER">Cashier</option>
                      <option value="MANAGER">Manager</option>
                    </select>
                  </div>
                </div>
              )}

              {role === 'MLM_DISTRIBUTOR' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Sponsor ID (Opt)</label>
                    <input
                      type="text"
                      placeholder="e.g. clk345..."
                      value={sponsorId}
                      onChange={(e) => setSponsorId(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Tree Leg</label>
                    <select
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 outline-hidden focus:border-indigo-500"
                    >
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
            className="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 font-semibold text-white transition-all hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-400"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : isLogin ? (
              'Sign In'
            ) : (
              'Register Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
          >
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
