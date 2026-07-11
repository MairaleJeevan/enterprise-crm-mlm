'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Plus, Store, Navigation, Phone, Mail, FileText } from 'lucide-react';

export default function FranchisesPage() {
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [type, setType] = useState('FRANCHISE');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('USA');
  const [pincode, setPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [gstNumber, setGstNumber] = useState('');

  const fetchFranchises = async () => {
    try {
      const res = await api.get('/api/franchises');
      setFranchises(res.data);
    } catch {
      toast.error('Failed to load franchises list');
    }
  };

  useEffect(() => {
    fetchFranchises();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/franchises', {
        name,
        code,
        type,
        address,
        city,
        state,
        country,
        pincode,
        phone,
        email,
        gstNumber,
      });

      toast.success('Franchise branch created successfully!');
      setShowModal(false);
      fetchFranchises();
      // Clear form
      setName('');
      setCode('');
      setAddress('');
      setCity('');
      setState('');
      setPincode('');
      setPhone('');
      setEmail('');
      setGstNumber('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to create franchise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Franchise Network</h1>
          <p className="text-sm text-slate-400">View and manage your retail showrooms and outlets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" /> Add Branch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {franchises.map((f) => (
          <div key={f.id} className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 space-y-4 backdrop-blur-xs flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-200">{f.name}</h3>
                  <span className="text-xs text-slate-500 font-mono">Code: {f.code}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  f.type === 'SHOWROOM' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
                }`}>
                  {f.type}
                </span>
              </div>

              <div className="mt-4 space-y-2 text-sm text-slate-400">
                <div className="flex items-start gap-2">
                  <Navigation className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                  <span>{f.address}, {f.city}, {f.state}, {f.country} - {f.pincode}</span>
                </div>
                {f.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>{f.phone}</span>
                  </div>
                )}
                {f.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-500" />
                    <span>{f.email}</span>
                  </div>
                )}
                {f.gstNumber && (
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-500" />
                    <span>Tax ID: {f.gstNumber}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 border-t border-slate-900 pt-4 flex justify-between text-xs text-slate-500">
              <span>Sales logs: {f._count?.sales || 0}</span>
              <span>Customers: {f._count?.customers || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl space-y-6">
            <h2 className="text-xl font-bold">Register Franchise Branch</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Name</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Code</label>
                  <input
                    type="text" required value={code} onChange={(e) => setCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden focus:border-indigo-500 focus:ring-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Outlet Type</label>
                  <select
                    value={type} onChange={(e) => setType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-slate-200 outline-hidden"
                  >
                    <option value="FRANCHISE">Franchise</option>
                    <option value="SHOWROOM">Showroom</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">GST / Tax ID</label>
                  <input
                    type="text" value={gstNumber} onChange={(e) => setGstNumber(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Address</label>
                <input
                  type="text" required value={address} onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-400">City</label>
                  <input
                    type="text" required value={city} onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">State</label>
                  <input
                    type="text" required value={state} onChange={(e) => setState(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Pincode</label>
                  <input
                    type="text" required value={pincode} onChange={(e) => setPincode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Phone</label>
                  <input
                    type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Email</label>
                  <input
                    type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2 text-slate-200 outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
