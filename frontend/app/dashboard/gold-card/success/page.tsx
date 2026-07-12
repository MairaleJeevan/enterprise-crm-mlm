'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../../api';
import toast from 'react-hot-toast';
import { CheckCircle, Download, CreditCard, Star, User, Copy, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pid = searchParams.get('pid');
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!pid) return;
    api.get(`/api/payments/${pid}`)
      .then((res) => setPayment(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [pid]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied!`));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const card = payment?.goldCard;
  const invoice = payment?.invoice;
  const customer = payment?.customer;
  // linked User account created during purchase
  const memberAccount = customer?.user;
  // password is always the customer's phone number
  const accountPassword = customer?.phone;

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8">

      {/* ── Success Banner ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-4">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-emerald-400" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-100">Payment Successful!</h1>
        <p className="text-slate-400 text-sm">Gold Membership Card has been activated successfully</p>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/30 px-4 py-1.5 text-amber-400 text-sm font-bold">
          <Star className="h-4 w-4" />
          Gold Member Activated
        </div>
      </div>

      {/* ── New Account Credentials ────────────────────────────────────── */}
      {memberAccount && (
        <div className="rounded-2xl border border-indigo-500/30 bg-indigo-500/5 p-6 space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <User className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-200">Sales Advisor Account Created</h2>
              <p className="text-xs text-slate-500">
                {customer?.firstName} is now in your MLM downline as a Sales Advisor
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-slate-950/60 p-4 space-y-3">
            {/* Email / Login */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Login Email</p>
                <p className="text-sm text-slate-200 font-mono truncate">{memberAccount.email}</p>
              </div>
              <button
                onClick={() => copyToClipboard(memberAccount.email, 'Email')}
                className="shrink-0 rounded-lg p-2 hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
                title="Copy email"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>

            <div className="border-t border-slate-800" />

            {/* Password */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold flex items-center gap-1">
                  <KeyRound className="h-3 w-3" /> Initial Password
                </p>
                <p className="text-sm text-slate-200 font-mono">
                  {showPassword ? accountPassword : '••••••••••'}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setShowPassword((v) => !v)}
                  className="rounded-lg p-2 hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => copyToClipboard(accountPassword, 'Password')}
                  className="rounded-lg p-2 hover:bg-slate-800 text-slate-500 hover:text-slate-200 transition-colors"
                  title="Copy password"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-amber-400/80 flex items-start gap-1.5">
            <span className="mt-0.5">⚠</span>
            Share these credentials with the customer. They should change their password after first login.
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-slate-500">Role</p>
              <p className="text-indigo-400 font-bold mt-0.5">Sales Advisor</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-slate-500">MLM Rank</p>
              <p className="text-slate-200 font-medium mt-0.5">{memberAccount.mlmNode?.rank ?? 'Sales Advisor'}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Gold Card Display ──────────────────────────────────────────── */}
      {card && (
        <div className="rounded-2xl border border-amber-500/30 bg-slate-950 p-6 space-y-4">
          <h2 className="font-bold text-slate-200 flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-amber-400" /> Gold Card Details
          </h2>
          <div className="relative rounded-xl overflow-hidden shadow-2xl shadow-amber-500/20" style={{ aspectRatio: '1.586' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600" />
            <div className="absolute inset-0 p-5 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900/60 text-[10px] font-semibold uppercase tracking-widest">Jeevan Enterprise</p>
                  <p className="text-slate-900 font-extrabold tracking-wider">Gold Membership</p>
                </div>
                <Star className="h-6 w-6 text-slate-900/40" />
              </div>
              <div>
                <p className="text-slate-900 font-mono tracking-[0.3em] font-bold">{card.cardNumber}</p>
                <div className="flex justify-between mt-1">
                  <div>
                    <p className="text-slate-900/50 text-[9px] uppercase">Cardholder</p>
                    <p className="text-slate-900 font-semibold text-sm">{customer?.firstName} {customer?.lastName || ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-900/50 text-[9px] uppercase">Expires</p>
                    <p className="text-slate-900 font-semibold text-sm">
                      {new Date(card.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-slate-500">Card Number</p>
              <p className="text-slate-200 font-mono font-bold mt-0.5">{card.cardNumber}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-slate-500">Status</p>
              <p className="text-emerald-400 font-bold mt-0.5 uppercase">{card.status}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-slate-500">Activated</p>
              <p className="text-slate-200 font-medium mt-0.5">{new Date(card.activationDate).toLocaleDateString('en-IN')}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
              <p className="text-slate-500">Valid Until</p>
              <p className="text-slate-200 font-medium mt-0.5">{new Date(card.expiryDate).toLocaleDateString('en-IN')}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Invoice ────────────────────────────────────────────────────── */}
      {invoice && (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5 space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-200">Invoice</h2>
            <span className="text-xs text-slate-400 font-mono">{invoice.invoiceNumber}</span>
          </div>
          <div className="space-y-1 text-sm text-slate-400">
            <div className="flex justify-between"><span>Subtotal (ex. GST)</span><span>₹{invoice.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between"><span>GST (18%)</span><span>₹{invoice.tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-slate-200 border-t border-slate-800 pt-1 mt-1">
              <span>Total</span><span>₹{invoice.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => router.push(`/dashboard/gold-card/invoice/${pid}`)}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <Download className="h-4 w-4" /> View Invoice
        </button>
        <button
          onClick={() => router.push(`/dashboard/gold-card/card/${card?.id}`)}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 hover:bg-amber-400 transition-colors"
        >
          <Star className="h-4 w-4" /> View Membership Card
        </button>
      </div>

      <button
        onClick={() => router.push('/dashboard/gold-card')}
        className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors"
      >
        ← Sell another card
      </button>
    </div>
  );
}
