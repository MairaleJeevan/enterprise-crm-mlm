'use client';

import { useEffect, useState } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Shield,
  Search,
  Filter,
  ToggleLeft,
  ToggleRight,
  Edit2,
  X,
  Briefcase,
  Layers,
  Key,
} from 'lucide-react';

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Form fields
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'STORE_USER', // ADMIN, STORE_USER, MLM_DISTRIBUTOR
    franchiseId: '',
    storeRole: 'CASHIER', // MANAGER, CASHIER
    sponsorId: '', // Direct MLM recruiter
    position: 'LEFT', // LEFT or RIGHT
    isActive: true,
  });

  const fetchUsersAndFranchises = async () => {
    setLoading(true);
    try {
      const [usersRes, franchisesRes] = await Promise.all([
        api.get('/api/auth/users'),
        api.get('/api/franchises'),
      ]);
      setUsers(usersRes.data);
      setFranchises(franchisesRes.data);
    } catch {
      toast.error('Failed to load user and franchise directories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndFranchises();
  }, []);

  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setSelectedUserId(null);
    setForm({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'STORE_USER',
      franchiseId: franchises[0]?.id || '',
      storeRole: 'CASHIER',
      sponsorId: '',
      position: 'LEFT',
      isActive: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (user: any) => {
    setIsEditMode(true);
    setSelectedUserId(user.id);
    setForm({
      email: user.email,
      password: '', // blank by default on edit
      firstName: user.firstName,
      lastName: user.lastName || '',
      role: user.role,
      franchiseId: user.storeUsers?.[0]?.franchiseId || franchises[0]?.id || '',
      storeRole: user.storeUsers?.[0]?.role || 'CASHIER',
      sponsorId: user.mlmNode?.parentId || '',
      position: user.mlmNode?.position || 'LEFT',
      isActive: user.isActive,
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (user: any) => {
    const updatedStatus = !user.isActive;
    try {
      await api.patch(`/api/auth/users/${user.id}`, { isActive: updatedStatus });
      toast.success(`User ${user.firstName} is now ${updatedStatus ? 'Active' : 'Deactivated'}`);
      setUsers(users.map((u) => (u.id === user.id ? { ...u, isActive: updatedStatus } : u)));
    } catch {
      toast.error('Failed to update user status');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.firstName || (!isEditMode && !form.password)) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (isEditMode && selectedUserId) {
        // Prepare patch payload
        const payload: any = {
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
          isActive: form.isActive,
        };
        if (form.password) payload.password = form.password;
        if (form.role === 'STORE_USER') {
          payload.franchiseId = form.franchiseId;
          payload.storeRole = form.storeRole;
        }

        await api.patch(`/api/auth/users/${selectedUserId}`, payload);
        toast.success('User updated successfully');
      } else {
        // Create user
        const payload: any = { ...form };
        if (payload.role !== 'STORE_USER') {
          delete payload.franchiseId;
          delete payload.storeRole;
        }
        if (payload.role !== 'MLM_DISTRIBUTOR') {
          delete payload.sponsorId;
          delete payload.position;
        }
        await api.post('/api/auth/register', payload);
        toast.success('User registered successfully');
      }
      setShowModal(false);
      fetchUsersAndFranchises();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    }
  };

  const mlmDistributors = users.filter((u) => u.role === 'MLM_DISTRIBUTOR');

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const activeCount = users.filter((u) => u.isActive).length;
  const deactivatedCount = users.length - activeCount;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            User Directory & Access Control
          </h1>
          <p className="text-sm text-slate-400 mt-1">Manage global users, define system access, and configure roles.</p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
        >
          <UserPlus className="h-4.5 w-4.5" /> Register New User
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-xs text-slate-500 font-medium">Total Registered Users</p>
          <p className="text-2xl font-bold text-slate-100 mt-1">{users.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-xs text-slate-500 font-medium">Active Accounts</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1 flex items-center gap-1.5">
            <UserCheck className="h-5 w-5 shrink-0" /> {activeCount}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-5">
          <p className="text-xs text-slate-500 font-medium">Deactivated Accounts</p>
          <p className="text-2xl font-bold text-red-400 mt-1 flex items-center gap-1.5">
            <UserX className="h-5 w-5 shrink-0" /> {deactivatedCount}
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search users by name or email address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900/50 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-500" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Super Admin</option>
            <option value="STORE_USER">Franchise Staff</option>
            <option value="MLM_DISTRIBUTOR">MLM Distributor</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/40 text-left text-slate-500 font-semibold uppercase tracking-wider">
                <th className="px-5 py-3.5">User</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Scope / Assignment</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Joined Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/40">
                    <td colSpan={6} className="px-5 py-4"><div className="h-5 bg-slate-900 rounded animate-pulse w-full" /></td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-slate-500 py-12">No users match your criteria</td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isStoreUser = u.role === 'STORE_USER';
                  const isMlm = u.role === 'MLM_DISTRIBUTOR';
                  
                  return (
                    <tr key={u.id} className="border-b border-slate-800/30 hover:bg-slate-900/10 transition-colors">
                      <td className="px-5 py-4 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-200">
                          {u.firstName[0]}
                        </div>
                        <div>
                          <p className="text-slate-200 font-bold text-sm">{u.firstName} {u.lastName || ''}</p>
                          <p className="text-slate-500 text-[10px]">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 font-bold uppercase ${
                          u.role === 'ADMIN' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          isMlm ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          {u.role === 'ADMIN' ? 'Super Admin' : isMlm ? 'Distributor' : 'Store User'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-300">
                        {isStoreUser && (
                          <div className="space-y-0.5">
                            <p className="font-semibold flex items-center gap-1"><Briefcase className="h-3 w-3 text-emerald-500" /> {u.storeUsers?.[0]?.role}</p>
                            <p className="text-slate-500 text-[10px]">{u.storeUsers?.[0]?.franchise?.name || 'No Franchise'}</p>
                          </div>
                        )}
                        {isMlm && (
                          <div className="space-y-0.5">
                            <p className="font-semibold flex items-center gap-1"><Layers className="h-3 w-3 text-amber-500" /> {u.mlmNode?.rank || 'Sales Advisor'}</p>
                            <p className="text-slate-500 text-[10px]">PV: {u.mlmNode?.personalPv || 0} | GPV: {u.mlmNode?.groupPv || 0}</p>
                          </div>
                        )}
                        {u.role === 'ADMIN' && <span className="text-slate-500">— Global Control —</span>}
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleToggleStatus(u)}
                          className={`inline-flex items-center gap-1.5 font-bold uppercase rounded-full px-2.5 py-0.5 border ${
                            u.isActive
                              ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                              : 'bg-red-500/5 text-red-400 border-red-500/20'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${u.isActive ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          {u.isActive ? 'Active' : 'Deactivated'}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-medium">
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit User Details"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded transition-colors ${
                              u.isActive ? 'bg-red-950/20 text-red-400 hover:bg-red-900/20' : 'bg-emerald-950/20 text-emerald-400 hover:bg-emerald-900/20'
                            }`}
                            title={u.isActive ? 'Deactivate User' : 'Activate User'}
                          >
                            {u.isActive ? <ToggleRight className="h-4.5 w-4.5" /> : <ToggleLeft className="h-4.5 w-4.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-850 pb-3">
              <h2 className="font-bold text-lg text-slate-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-indigo-400" />
                {isEditMode ? 'Modify User Profile' : 'Register New User'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">First Name *</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                    placeholder="John"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1 block">Last Name</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    placeholder="Doe"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">Email Address *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  placeholder="john.doe@email.com"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">
                  {isEditMode ? 'Reset Password (leave empty to keep current)' : 'Password *'}
                </label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required={!isEditMode}
                    placeholder={isEditMode ? '••••••••' : 'Minimum 6 characters'}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-9 pr-4 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="text-xs text-slate-400 font-semibold mb-1 block">System Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  disabled={isEditMode} // Cannot easily switch roles due to schema relations
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                >
                  <option value="ADMIN">Super Admin (Global Control)</option>
                  <option value="STORE_USER">Store Staff / Cashier / Owner</option>
                  <option value="MLM_DISTRIBUTOR">MLM Network Partner / Distributor</option>
                </select>
              </div>

              {/* Role specific configs: STORE USER */}
              {form.role === 'STORE_USER' && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Franchise Configurations</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-medium mb-1 block">Select Location</label>
                      <select
                        value={form.franchiseId}
                        onChange={(e) => setForm({ ...form, franchiseId: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                      >
                        {franchises.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-medium mb-1 block">Assign Position</label>
                      <select
                        value={form.storeRole}
                        onChange={(e) => setForm({ ...form, storeRole: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="OWNER">Franchise Owner</option>
                        <option value="MANAGER">Store Manager</option>
                        <option value="CASHIER">Sales Executive</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Role specific configs: MLM DISTRIBUTOR */}
              {form.role === 'MLM_DISTRIBUTOR' && !isEditMode && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">MLM Tree Placement</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-400 font-medium mb-1 block">Recruiter Sponsor</label>
                      <select
                        value={form.sponsorId}
                        onChange={(e) => setForm({ ...form, sponsorId: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="">— Select Direct Recruiter —</option>
                        {mlmDistributors.map((d) => (
                          <option key={d.id} value={d.id}>{d.firstName} {d.lastName || ''} ({d.email})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 font-medium mb-1 block">Recruiter Placement Leg</label>
                      <select
                        value={form.position}
                        onChange={(e) => setForm({ ...form, position: e.target.value })}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 focus:border-indigo-500 focus:outline-none"
                      >
                        <option value="LEFT">LEFT Leg</option>
                        <option value="RIGHT">RIGHT Leg</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Save/Cancel Buttons */}
              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-sm font-bold text-white transition-colors"
                >
                  {isEditMode ? 'Update Profile' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
