'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '../../../../api';
import { Star, Printer, Download, Calendar, Shield } from 'lucide-react';

export default function MembershipCardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get payment first, then get goldCard from payment
    api.get(`/api/payments/${id}`)
      .then((res) => setCard(res.data.goldCard ? { ...res.data.goldCard, customer: res.data.customer } : null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  if (!card) return <div className="text-center text-slate-400 py-16">Card not found.</div>;

  const isExpired = new Date(card.expiryDate) < new Date();
  const daysLeft = Math.max(0, Math.floor((new Date(card.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400" /> Membership Card
        </h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Physical Card */}
      <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-amber-500/20" style={{ aspectRatio: '1.586' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-700" />
        {/* Shine overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
        {/* Subtle pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)', backgroundSize: '10px 10px' }} />

        <div className="absolute inset-0 p-7 flex flex-col justify-between">
          {/* Top row */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-900/50 text-[11px] font-bold uppercase tracking-[0.2em]">Vortex Enterprise</p>
              <p className="text-slate-900 font-black text-xl tracking-wide mt-0.5">GOLD MEMBERSHIP</p>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${isExpired ? 'bg-red-900/50 text-red-300' : 'bg-slate-900/30 text-slate-900'}`}>
                <Shield className="h-2.5 w-2.5" />
                {isExpired ? 'EXPIRED' : 'ACTIVE'}
              </div>
            </div>
          </div>

          {/* QR Code */}
          {card.qrCode && (
            <div className="absolute right-7 top-1/2 -translate-y-1/2">
              <img src={card.qrCode} alt="QR Code" className="h-16 w-16 rounded-lg shadow-lg" />
            </div>
          )}

          {/* Bottom row */}
          <div>
            <p className="text-slate-900 font-mono text-xl tracking-[0.25em] font-black">{card.cardNumber}</p>
            <div className="flex gap-8 mt-2">
              <div>
                <p className="text-slate-900/50 text-[9px] uppercase font-semibold tracking-wider">Cardholder</p>
                <p className="text-slate-900 font-bold text-sm">{card.customer?.firstName} {card.customer?.lastName || ''}</p>
              </div>
              <div>
                <p className="text-slate-900/50 text-[9px] uppercase font-semibold tracking-wider">Activated</p>
                <p className="text-slate-900 font-bold text-sm">{new Date(card.activationDate).toLocaleDateString('en-IN')}</p>
              </div>
              <div>
                <p className="text-slate-900/50 text-[9px] uppercase font-semibold tracking-wider">Expires</p>
                <p className="text-slate-900 font-bold text-sm">{new Date(card.expiryDate).toLocaleDateString('en-IN')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 mb-2"><Calendar className="h-3.5 w-3.5" /> Validity</div>
          {!isExpired ? (
            <p className="text-emerald-400 font-bold text-lg">{daysLeft} <span className="text-sm font-normal text-slate-400">days left</span></p>
          ) : (
            <p className="text-red-400 font-bold">Expired</p>
          )}
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-1">
          <p className="text-slate-500 mb-2">Unique UID</p>
          <p className="text-slate-300 font-mono text-[10px] break-all">{card.uniqueUID}</p>
        </div>
        <div className="col-span-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
          <Star className="h-8 w-8 text-amber-400 shrink-0" />
          <div>
            <p className="text-amber-400 font-bold">Gold Member Benefits Active</p>
            <p className="text-slate-400 text-[11px] mt-0.5">Access all showrooms, priority support, exclusive discounts</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => router.push('/dashboard/gold-card')}
        className="w-full text-sm text-slate-500 hover:text-slate-300 transition-colors py-2"
      >
        ← Back to Gold Card Sales
      </button>
    </div>
  );
}
