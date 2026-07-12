'use client';

import { useRouter } from 'next/navigation';
import { XCircle, RefreshCw, Phone } from 'lucide-react';

export default function PaymentFailedPage() {
  const router = useRouter();

  return (
    <div className="max-w-lg mx-auto py-16 space-y-8 text-center">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-400" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-slate-100">Payment Failed</h1>
        <p className="text-slate-400 text-sm">
          Your payment could not be processed. No amount has been debited.
          Please try again or contact support.
        </p>
      </div>

      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-5 text-left space-y-2">
        <h3 className="text-sm font-semibold text-red-400">Common Reasons</h3>
        <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
          <li>Insufficient funds in the account</li>
          <li>Bank declined the transaction</li>
          <li>Network timeout during payment</li>
          <li>Incorrect card details entered</li>
          <li>UPI transaction limit exceeded</li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => router.push('/dashboard/gold-card')}
          className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <RefreshCw className="h-4 w-4" /> Try Again
        </button>
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>

      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <Phone className="h-3.5 w-3.5" />
        Need help? Contact your franchise manager
      </div>
    </div>
  );
}
