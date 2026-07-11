'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Calendar, Plus, Trash2, Clock, CheckCircle2, AlertCircle, FileText, Check } from 'lucide-react';

export default function FollowUpsPage() {
  const [followups, setFollowups] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // FollowUp Form State
  const [showFollowForm, setShowFollowForm] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followStatus, setFollowStatus] = useState('PENDING');

  // Reminder Form State
  const [showRemForm, setShowRemForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [remindAt, setRemindAt] = useState('');

  const fetchData = async () => {
    try {
      const [folRes, remRes, custRes] = await Promise.all([
        api.get('/api/followups'),
        api.get('/api/reminders'),
        api.get('/api/customers'),
      ]);
      setFollowups(folRes.data);
      setReminders(remRes.data);
      setCustomers(custRes.data);
    } catch {
      toast.error('Failed to load follow-ups and reminders');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId || !notes || !followUpDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/followups', {
        customerId,
        notes,
        followUpDate: new Date(followUpDate).toISOString(),
        status: followStatus,
      });
      toast.success('Follow-up scheduled successfully');
      setCustomerId('');
      setNotes('');
      setFollowUpDate('');
      setFollowStatus('PENDING');
      setShowFollowForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create follow-up');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !remindAt) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/reminders', {
        title,
        description: description || undefined,
        remindAt: new Date(remindAt).toISOString(),
      });
      toast.success('Reminder added successfully');
      setTitle('');
      setDescription('');
      setRemindAt('');
      setShowRemForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFollowStatus = async (id: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      PENDING: 'COMPLETED',
      COMPLETED: 'CANCELLED',
      CANCELLED: 'PENDING',
    };
    const nextStatus = nextStatusMap[currentStatus];

    try {
      await api.patch(`/api/followups/${id}`, { status: nextStatus });
      toast.success(`Follow-up status set to ${nextStatus}`);
      fetchData();
    } catch {
      toast.error('Failed to update follow-up status');
    }
  };

  const handleToggleReminder = async (id: string, currentCompleted: boolean) => {
    try {
      await api.patch(`/api/reminders/${id}`, { isCompleted: !currentCompleted });
      toast.success(`Reminder marked as ${!currentCompleted ? 'completed' : 'pending'}`);
      fetchData();
    } catch {
      toast.error('Failed to update reminder status');
    }
  };

  const handleDeleteFollowup = async (id: string) => {
    if (!confirm('Delete this follow-up record?')) return;
    try {
      await api.delete(`/api/followups/${id}`);
      toast.success('Follow-up deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete follow-up');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    if (!confirm('Delete this reminder?')) return;
    try {
      await api.delete(`/api/reminders/${id}`);
      toast.success('Reminder deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete reminder');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Follow-ups & Reminders</h1>
        <p className="text-sm text-slate-400">Track client communications, callbacks, and daily store notifications</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Follow-up actions log */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-400" /> Scheduled Follow-ups
            </h2>
            <button
              onClick={() => setShowFollowForm(!showFollowForm)}
              className="rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Schedule Follow-up
            </button>
          </div>

          {showFollowForm && (
            <form onSubmit={handleAddFollowup} className="rounded-xl border border-slate-900 bg-slate-950/40 p-5 space-y-4">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Schedule Follow-up Call</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Customer *</label>
                  <select
                    value={customerId}
                    onChange={(e) => setCustomerId(e.target.value)}
                    className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName || ''} ({c.phone})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Follow-up Date *</label>
                  <input
                    type="datetime-local"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Conversation Notes *</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Summarize the action item, sales query, or callback reason..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Schedule Log
              </button>
            </form>
          )}

          <div className="space-y-3">
            {followups.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8 border border-dashed border-slate-900 rounded-xl">No follow-ups scheduled.</p>
            ) : (
              followups.map((fol) => (
                <div key={fol.id} className="rounded-xl border border-slate-900 bg-slate-950/20 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">
                        {fol.customer.firstName} {fol.customer.lastName || ''}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">({fol.customer.phone})</span>
                      <button
                        onClick={() => handleUpdateFollowStatus(fol.id, fol.status)}
                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider transition-colors ${
                          fol.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : fol.status === 'CANCELLED'
                            ? 'bg-red-500/10 text-red-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {fol.status}
                      </button>
                    </div>
                    <p className="text-xs text-slate-400">{fol.notes}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <Clock className="h-3 w-3 text-indigo-400" />
                      <span>Follow-up on: {new Date(fol.followUpDate).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteFollowup(fol.id)}
                    className="rounded-lg p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors self-end md:self-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Reminders Alerts */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-400" /> Daily Reminders
            </h2>
            <button
              onClick={() => setShowRemForm(!showRemForm)}
              className="rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" /> Add Alert
            </button>
          </div>

          {showRemForm && (
            <form onSubmit={handleAddReminder} className="rounded-xl border border-slate-900 bg-slate-950/40 p-4 space-y-3">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Create Alert Reminder</h3>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. End of day cash tally"
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional details"
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Remind At *</label>
                <input
                  type="datetime-local"
                  value={remindAt}
                  onChange={(e) => setRemindAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Add Reminder
              </button>
            </form>
          )}

          <div className="space-y-3 h-[400px] overflow-y-auto pr-1">
            {reminders.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No active reminders.</p>
            ) : (
              reminders.map((rem) => (
                <div key={rem.id} className="rounded-xl border border-slate-900 bg-slate-950/20 p-3.5 flex items-start justify-between gap-3">
                  <div className="flex gap-2.5 items-start">
                    <button
                      onClick={() => handleToggleReminder(rem.id, rem.isCompleted)}
                      className={`h-5 w-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                        rem.isCompleted
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400'
                          : 'border-slate-800 hover:border-indigo-500 text-transparent'
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                    <div>
                      <p className={`text-xs font-semibold ${rem.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {rem.title}
                      </p>
                      {rem.description && <p className="text-[10px] text-slate-500 mt-0.5">{rem.description}</p>}
                      <p className="text-[9px] text-slate-600 font-mono mt-1">
                        Time: {new Date(rem.remindAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteReminder(rem.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
