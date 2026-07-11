'use client';

import { useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { FileDown, FileSpreadsheet, Percent, BarChart3 } from 'lucide-react';

export default function ReportsPage() {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (endpoint: string, fileName: string) => {
    setDownloading(endpoint);
    try {
      const res = await api.get(endpoint, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success(`${fileName} downloaded successfully!`);
    } catch {
      toast.error('Failed to export CSV report');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Reports & Exports</h1>
        <p className="text-sm text-slate-400">Download formatted CSV reports of store metrics, inventory, and network volumes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sales Reports */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 flex flex-col justify-between h-56 hover:border-indigo-500/50 transition-all">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-200">Sales Transactions</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Contains all store receipts, invoice numbers, tax rates, subtotals, and linked cashier details.
            </p>
          </div>
          <button
            onClick={() => handleDownload('/api/reports/sales', 'sales_report.csv')}
            disabled={downloading !== null}
            className="w-full mt-4 rounded-lg bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-slate-950 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileDown className="h-4 w-4" /> {downloading === '/api/reports/sales' ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>

        {/* Inventory Reports */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 flex flex-col justify-between h-56 hover:border-indigo-500/50 transition-all">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BarChart3 className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-200">Inventory & Stock Levels</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Lists active stock quantities, reorder flags, warning indices, and warehouse locations.
            </p>
          </div>
          <button
            onClick={() => handleDownload('/api/reports/inventory', 'inventory_report.csv')}
            disabled={downloading !== null}
            className="w-full mt-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileDown className="h-4 w-4" /> {downloading === '/api/reports/inventory' ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>

        {/* MLM Commission Reports */}
        <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 flex flex-col justify-between h-56 hover:border-indigo-500/50 transition-all">
          <div className="space-y-2">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Percent className="h-5 w-5" />
            </div>
            <h3 className="font-bold text-slate-200">MLM Commissions</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Summarizes recruit direct sponsor bonuses, pairing leg matching cycles, and paid payout receipts.
            </p>
          </div>
          <button
            onClick={() => handleDownload('/api/reports/commissions', 'commissions_report.csv')}
            disabled={downloading !== null}
            className="w-full mt-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 py-2 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <FileDown className="h-4 w-4" /> {downloading === '/api/reports/commissions' ? 'Exporting...' : 'Download CSV'}
          </button>
        </div>

      </div>
    </div>
  );
}
