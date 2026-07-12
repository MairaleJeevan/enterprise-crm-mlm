'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../../api';
import { Printer, Download } from 'lucide-react';

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/api/payments/${id}/invoice`)
      .then((res) => setInvoice(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg></div>;
  }

  if (!invoice) return <div className="text-center text-slate-400 py-16">Invoice not found.</div>;

  const payment = invoice.payment;
  const customer = payment?.customer;
  const advisor = payment?.advisor;
  const card = payment?.goldCard;
  const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold">Invoice</h1>
        <div className="flex gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> Print
          </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div id="invoice-content" className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden print:border-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-white text-sm">V</div>
                <div>
                  <p className="font-extrabold text-white">Vortex Enterprise</p>
                  <p className="text-indigo-200 text-[10px]">Gold Membership Division</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-indigo-200 text-xs uppercase tracking-widest">Invoice</p>
              <p className="text-white font-bold font-mono">{invoice.invoiceNumber}</p>
              <p className="text-indigo-200 text-xs mt-1">{invoiceDate}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Billed To / From */}
          <div className="grid grid-cols-2 gap-6 text-xs">
            <div>
              <p className="text-slate-500 uppercase tracking-widest font-semibold mb-2">Billed To</p>
              <p className="text-slate-200 font-bold">{customer?.firstName} {customer?.lastName || ''}</p>
              <p className="text-slate-400">{customer?.phone}</p>
              {customer?.email && <p className="text-slate-400">{customer?.email}</p>}
              {customer?.city && <p className="text-slate-400">{customer?.city}, {customer?.state}</p>}
            </div>
            <div>
              <p className="text-slate-500 uppercase tracking-widest font-semibold mb-2">Sold By</p>
              <p className="text-slate-200 font-bold">{advisor?.firstName} {advisor?.lastName || ''}</p>
              <p className="text-slate-400">{advisor?.email}</p>
              <p className="text-slate-400">Sales Advisor</p>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left text-slate-500 uppercase tracking-wider py-2 font-semibold">Description</th>
                <th className="text-right text-slate-500 uppercase tracking-wider py-2 font-semibold">Qty</th>
                <th className="text-right text-slate-500 uppercase tracking-wider py-2 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-800/50">
                <td className="py-3">
                  <p className="text-slate-200 font-medium">Vortex Gold Membership Card</p>
                  {card && <p className="text-slate-500 font-mono text-[10px] mt-0.5">{card.cardNumber}</p>}
                  <p className="text-slate-500 text-[10px]">
                    Valid: {card && new Date(card.activationDate).toLocaleDateString('en-IN')} – {card && new Date(card.expiryDate).toLocaleDateString('en-IN')}
                  </p>
                </td>
                <td className="text-right text-slate-300 py-3">1</td>
                <td className="text-right text-slate-300 py-3 font-mono">₹{invoice.subtotal.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="space-y-1 text-xs ml-auto max-w-[200px]">
            <div className="flex justify-between text-slate-400"><span>Subtotal</span><span className="font-mono">₹{invoice.subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-400"><span>GST (18%)</span><span className="font-mono">₹{invoice.tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-bold text-slate-100 border-t border-slate-700 pt-2 mt-1 text-sm">
              <span>Total</span><span className="font-mono">₹{invoice.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 grid grid-cols-2 gap-3 text-xs">
            <div>
              <p className="text-slate-500">Payment Method</p>
              <p className="text-slate-200 font-medium mt-0.5">{payment?.paymentMethod || 'Razorpay'}</p>
            </div>
            <div>
              <p className="text-slate-500">Payment Status</p>
              <p className="text-emerald-400 font-bold mt-0.5 uppercase">{payment?.status}</p>
            </div>
            {payment?.razorpayPaymentId && (
              <div className="col-span-2">
                <p className="text-slate-500">Transaction ID</p>
                <p className="text-slate-300 font-mono text-[10px] mt-0.5">{payment.razorpayPaymentId}</p>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-600">Thank you for choosing Vortex Gold Membership. This is a computer-generated invoice.</p>
        </div>
      </div>
    </div>
  );
}
