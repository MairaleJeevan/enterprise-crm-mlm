'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Car, Plus, Trash2, Search, User } from 'lucide-react';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [make, setMake] = useState('');
  const [modelName, setModelName] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [licensePlate, setLicensePlate] = useState('');
  const [vin, setVin] = useState('');
  const [customerId, setCustomerId] = useState('');

  const fetchData = async () => {
    try {
      const [vehRes, custRes] = await Promise.all([
        api.get('/api/vehicles'),
        api.get('/api/customers'),
      ]);
      setVehicles(vehRes.data);
      setCustomers(custRes.data);
    } catch {
      toast.error('Failed to load vehicles metadata');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!make || !modelName || !licensePlate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/vehicles', {
        make,
        modelName,
        year: Number(year),
        licensePlate,
        vin: vin || undefined,
        customerId: customerId || undefined,
      });
      toast.success('Vehicle registered successfully!');
      // Reset form
      setMake('');
      setModelName('');
      setYear(new Date().getFullYear());
      setLicensePlate('');
      setVin('');
      setCustomerId('');
      setShowAddForm(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await api.delete(`/api/vehicles/${id}`);
      toast.success('Vehicle deleted successfully');
      fetchData();
    } catch {
      toast.error('Failed to delete vehicle');
    }
  };

  const filteredVehicles = vehicles.filter(
    (v) =>
      v.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.customer &&
        `${v.customer.firstName} ${v.customer.lastName || ''}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Vehicle Management</h1>
          <p className="text-sm text-slate-400">Register customer vehicles and link profiles to store records</p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Plus className="h-4 w-4" /> {showAddForm ? 'Close Form' : 'Register Vehicle'}
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddVehicle} className="rounded-xl border border-slate-900 bg-slate-950/40 p-6 space-y-4 max-w-2xl">
          <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-wider">New Vehicle Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Make *</label>
              <input
                type="text"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="e.g. Tesla, Honda"
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Model Name *</label>
              <input
                type="text"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. Model 3, Civic"
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Year *</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">License Plate *</label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="e.g. MH-12-AB-1234"
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">VIN (Vehicle Identification Number)</label>
              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Linked Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full rounded-lg border border-slate-900 bg-slate-950 px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
              >
                <option value="">-- No Linked Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName || ''} ({c.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-indigo-500 hover:bg-indigo-400 text-slate-950 px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
          >
            Register Vehicle
          </button>
        </form>
      )}

      {/* Vehicles List */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search make, model, license plate, customer..."
            className="w-full rounded-lg border border-slate-900 bg-slate-950 pl-9 pr-4 py-2 text-xs text-slate-200 focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="rounded-xl border border-slate-900 bg-slate-950/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-900 bg-slate-950/50 text-slate-400">
                  <th className="py-4 px-6 font-semibold">Vehicle</th>
                  <th className="py-4 px-6 font-semibold">License Plate</th>
                  <th className="py-4 px-6 font-semibold">VIN</th>
                  <th className="py-4 px-6 font-semibold">Owner</th>
                  <th className="py-4 px-6 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No vehicles found.
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-950/10 transition-colors">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                          <Car className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-200">
                            {v.make} {v.modelName}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">Year: {v.year}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="rounded-md bg-slate-900 px-2 py-1 text-[10px] font-bold text-indigo-300 font-mono">
                          {v.licensePlate}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-mono">{v.vin || 'N/A'}</td>
                      <td className="py-4 px-6">
                        {v.customer ? (
                          <div className="flex items-center gap-1.5 text-slate-300">
                            <User className="h-3.5 w-3.5 text-indigo-400" />
                            <span>
                              {v.customer.firstName} {v.customer.lastName || ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic">None</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleDelete(v.id)}
                          className="rounded-lg p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
