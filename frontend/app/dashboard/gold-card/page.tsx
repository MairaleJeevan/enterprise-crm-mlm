'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store';
import { CreditCard, User, Star, Shield, CheckCircle, Plus, X, UserPlus } from 'lucide-react';

declare global {
  interface Window { Razorpay: any; }
}

const GOLD_CARD_PRICE = 2999;

// ─── Quick Add Customer Modal ─────────────────────────────────────────────────
function AddCustomerModal({ onClose, onAdded }: { onClose: () => void; onAdded: (c: any) => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', email: '', city: '' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.phone) {
      toast.error('First name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/api/customers', form);
      toast.success(`Customer ${res.data.firstName} added!`);
      onAdded(res.data);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-indigo-400" /> Register New Customer
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">First Name *</label>
              <input
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                placeholder="Rahul"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 font-medium mb-1 block">Last Name</label>
              <input
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                placeholder="Kumar"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Phone Number *</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="9876543210"
              type="tel"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Email</label>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="rahul@email.com"
              type="email"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Mumbai"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> : <Plus className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Add Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GoldCardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  const handleCustomerAdded = (newCustomer: any) => {
    setCustomers((prev) => [newCustomer, ...prev]);
    setSelectedCustomer(newCustomer.id);
  };

  useEffect(() => {
    loadRazorpayScript();
    fetchCustomers();
  }, []);

  const loadRazorpayScript = () => {
    if (document.getElementById('razorpay-script')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/api/customers');
      setCustomers(res.data);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handlePurchase = async () => {
    if (!selectedCustomer) {
      toast.error('Please select a customer');
      return;
    }
    if (!user?.id) {
      toast.error('Session expired. Please login again.');
      return;
    }

    setLoading(true);
    try {
      const orderRes = await api.post('/api/payments/create-order', {
        customerId: selectedCustomer,
        advisorId: user.id,
        franchiseId: user.storeUsers?.[0]?.franchiseId,
      });

      const { orderId, paymentId, amount, currency, keyId, customerName, customerEmail, customerPhone } = orderRes.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Vortex Enterprise',
        description: 'Gold Membership Card',
        order_id: orderId,
        prefill: { name: customerName, email: customerEmail, contact: customerPhone },
        theme: { color: '#6366f1' },
        handler: async (response: any) => {
          try {
            const verifyRes = await api.post('/api/payments/verify', {
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              paymentId,
            });
            router.push(`/dashboard/gold-card/success?pid=${verifyRes.data.payment.id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
            router.push('/dashboard/gold-card/failed');
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast('Payment cancelled');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        setLoading(false);
        router.push('/dashboard/gold-card/failed');
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create order');
      setLoading(false);
    }
  };

  const selectedCust = customers.find((c) => c.id === selectedCustomer);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-600 flex items-center justify-center">
            <Star className="h-5 w-5 text-slate-950" />
          </div>
          Sell Gold Membership Card
        </h1>
        <p className="text-sm text-slate-400 mt-1">Select a customer and complete Razorpay payment to activate their Gold Card</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left - Form */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-6 space-y-5">
            <h2 className="font-bold text-slate-200 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-400" /> Select Customer
            </h2>

            {loadingCustomers ? (
              <div className="h-10 rounded-lg bg-slate-800 animate-pulse" />
            ) : (
              <div className="space-y-2">
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">— Choose existing customer —</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName || ''} — {c.phone}
                      {c.isGoldMember ? ' ✅ Gold Member' : ''}
                    </option>
                  ))}
                </select>

                {/* Quick Add Customer */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-indigo-500/50 bg-indigo-500/5 py-2.5 text-sm font-semibold text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-400 transition-all"
                >
                  <UserPlus className="h-4 w-4" />
                  + Register New Customer
                </button>
              </div>
            )}

            {selectedCust && (
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-1 text-xs text-slate-400">
                <p><span className="text-slate-300 font-medium">Name:</span> {selectedCust.firstName} {selectedCust.lastName || ''}</p>
                <p><span className="text-slate-300 font-medium">Phone:</span> {selectedCust.phone}</p>
                {selectedCust.email && <p><span className="text-slate-300 font-medium">Email:</span> {selectedCust.email}</p>}
                {selectedCust.isGoldMember && (
                  <p className="text-amber-400 font-semibold mt-1">⚠️ Already a Gold Member</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handlePurchase}
            disabled={loading || !selectedCustomer || selectedCust?.isGoldMember}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 text-slate-950 font-bold text-base hover:from-amber-400 hover:to-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-3"
          >
            {loading ? (
              <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <CreditCard className="h-5 w-5" />
            )}
            {loading ? 'Opening Razorpay...' : `Pay ₹${GOLD_CARD_PRICE.toLocaleString('en-IN')} via Razorpay`}
          </button>
        </div>

        {/* Right - Gold Card Preview */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10" style={{ aspectRatio: '1.586' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600" />
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="absolute inset-0 p-6 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900/60 text-xs font-semibold uppercase tracking-widest">Vortex Enterprise</p>
                  <p className="text-slate-900 font-extrabold text-lg tracking-wider">Gold Membership</p>
                </div>
                <Star className="h-8 w-8 text-slate-900/40" />
              </div>
              <div>
                <p className="text-slate-900 font-mono text-lg tracking-[0.3em] font-bold">
                  {selectedCust ? 'GLD2026·0000001' : '•••• •••• ••••'}
                </p>
                <div className="flex justify-between mt-2">
                  <div>
                    <p className="text-slate-900/50 text-[10px] uppercase">Cardholder</p>
                    <p className="text-slate-900 font-semibold text-sm">
                      {selectedCust ? `${selectedCust.firstName} ${selectedCust.lastName || ''}` : 'Customer Name'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900/50 text-[10px] uppercase">Valid Until</p>
                    <p className="text-slate-900 font-semibold text-sm">
                      {new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Card Benefits</h3>
            {['1 Year Gold Membership', 'Access to all showrooms & franchises', 'MLM commission eligible', 'Priority customer support', 'Exclusive member discounts'].map((benefit) => (
              <div key={benefit} className="flex items-center gap-2 text-sm text-slate-300">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                {benefit}
              </div>
            ))}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 text-sm">Gold Card Price</span>
              <span className="text-xl font-extrabold text-amber-400">₹{GOLD_CARD_PRICE.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Shield className="h-4 w-4 text-emerald-500" />
        Payments secured by Razorpay. Your transaction data is encrypted.
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <AddCustomerModal
          onClose={() => setShowAddModal(false)}
          onAdded={handleCustomerAdded}
        />
      )}
    </div>
  );
}
