'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Network, DollarSign, Wallet, Award } from 'lucide-react';

function TreeNode({ node }: { node: any }) {
  if (!node) return null;
  return (
    <div className="flex flex-col items-center">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 min-w-[150px] text-center shadow-lg hover:border-indigo-500 transition-all">
        <p className="text-xs font-bold text-slate-200 truncate">{node.name}</p>
        <span className="text-[9px] text-indigo-400 font-extrabold block mt-0.5 uppercase tracking-wider">{node.rank}</span>
        <div className="mt-2 text-[9px] text-slate-500 border-t border-slate-900 pt-1.5 space-y-0.5 font-mono">
          <div>Personal: {node.personalPv.toFixed(0)} PV</div>
          <div>Group: {node.groupPv.toFixed(0)} PV</div>
          {node.position && <div>Leg: <span className="font-bold text-indigo-300">{node.position}</span></div>}
        </div>
      </div>
      {node.children && node.children.length > 0 && (
        <div className="flex gap-8 mt-6 relative before:absolute before:-top-6 before:left-1/2 before:w-[1px] before:h-6 before:bg-slate-800">
          {node.children.map((child: any) => (
            <TreeNode key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MLMPage() {
  const [tree, setTree] = useState<any>(null);
  const [downline, setDownline] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMlmData = async () => {
    try {
      const [treeRes, downRes, commRes, payRes] = await Promise.all([
        api.get('/api/mlm/tree'),
        api.get('/api/mlm/downline'),
        api.get('/api/mlm/commissions'),
        api.get('/api/mlm/payouts'),
      ]);
      setTree(treeRes.data);
      setDownline(downRes.data);
      setCommissions(commRes.data);
      setPayouts(payRes.data);
    } catch {
      toast.error('Failed to load MLM downline metrics');
    }
  };

  useEffect(() => {
    fetchMlmData();
  }, []);

  const totalCommissions = commissions.reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = commissions.filter((c) => c.status === 'PENDING');
  const totalPendingAmount = pendingCommissions.reduce((sum, c) => sum + c.amount, 0);

  const handleCashout = async () => {
    if (totalPendingAmount <= 0) {
      toast.error('No pending commissions available to cash out');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/mlm/payouts');
      toast.success(`Cashout of ₹${totalPendingAmount.toFixed(2)} completed!`);
      fetchMlmData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cashout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">MLM Downline Network</h1>
        <p className="text-sm text-slate-400">Track recruitments, group volumes, and claim commissions</p>
      </div>

      {/* MLM summary panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Commissions</p>
            <h3 className="text-xl font-bold mt-0.5">₹{totalCommissions.toFixed(2)}</h3>
          </div>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex items-center gap-4 justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Cashout</p>
              <h3 className="text-xl font-bold mt-0.5">₹{totalPendingAmount.toFixed(2)}</h3>
            </div>
          </div>
          <button
            onClick={handleCashout}
            disabled={loading || totalPendingAmount <= 0}
            className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-500 transition-colors"
          >
            Cashout
          </button>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direct Recruits</p>
            <h3 className="text-xl font-bold mt-0.5">{downline.length} members</h3>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 rounded-xl border border-slate-900 bg-slate-950/30 p-6 flex flex-col items-center min-h-[400px]">
          <h2 className="text-lg font-bold text-left w-full mb-8 flex items-center gap-2"><Network className="h-5 w-5 text-indigo-400" /> Network Placement Hierarchy</h2>
          <div className="flex-1 w-full overflow-auto flex items-start justify-center p-4">
            <TreeNode node={tree} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-6 space-y-4 h-[450px] overflow-y-auto">
          <h2 className="text-lg font-bold">Commission Ledgers</h2>
          {commissions.length === 0 ? (
            <p className="text-sm text-slate-500">No commission records yet.</p>
          ) : (
            <div className="space-y-3">
              {commissions.map((c) => (
                <div key={c.id} className="border-b border-slate-900/50 pb-2 flex justify-between items-start text-xs">
                  <div>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mb-1 ${
                      c.type === 'DIRECT_SPONSOR' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {c.type.replace('_', ' ')}
                    </span>
                    <p className="text-slate-400 leading-normal">{c.description}</p>
                    <span className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-slate-200 block font-mono">₹{c.amount.toFixed(2)}</span>
                    <span className={`text-[9px] font-bold ${c.status === 'PAID' ? 'text-emerald-500' : 'text-amber-500'}`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
