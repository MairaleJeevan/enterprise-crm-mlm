'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store';
import { ShieldCheck, FileCheck, AlertCircle, Clock, Upload, ArrowRight, Eye, Check, X } from 'lucide-react';

export default function KycPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';

  // Advisor States
  const [kycRecord, setKycRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // KYC Form fields
  const [aadharNumber, setAadharNumber] = useState('');
  const [aadharFront, setAadharFront] = useState('');
  const [aadharBack, setAadharBack] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [panFile, setPanFile] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [ref1Name, setRef1Name] = useState('');
  const [ref1Phone, setRef1Phone] = useState('');
  const [ref1Rel, setRef1Rel] = useState('');
  const [ref2Name, setRef2Name] = useState('');
  const [ref2Phone, setRef2Phone] = useState('');
  const [ref2Rel, setRef2Rel] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRel, setNomineeRel] = useState('');
  const [nomineeAge, setNomineeAge] = useState('');
  const [nomineePhone, setNomineePhone] = useState('');
  const [nomineeAddr, setNomineeAddr] = useState('');

  // Admin Review States
  const [pendingKycs, setPendingKycs] = useState<any[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const fetchKycStatus = async () => {
    try {
      const res = await api.get('/api/kyc/status');
      setKycRecord(res.data);
      if (res.data && res.data.status !== 'PENDING') {
        setAadharNumber(res.data.aadharNumber || '');
        setPanNumber(res.data.panNumber || '');
        setAccountNumber(res.data.accountNumber || '');
        setIfscCode(res.data.ifscCode || '');
        setBankName(res.data.bankName || '');
        setBranchName(res.data.branchName || '');
        setAccountHolder(res.data.accountHolder || '');
        setRef1Name(res.data.ref1Name || '');
        setRef1Phone(res.data.ref1Phone || '');
        setRef1Rel(res.data.ref1Relationship || '');
        setRef2Name(res.data.ref2Name || '');
        setRef2Phone(res.data.ref2Phone || '');
        setRef2Rel(res.data.ref2Relationship || '');
        setNomineeName(res.data.nomineeName || '');
        setNomineeRel(res.data.nomineeRelationship || '');
        setNomineeAge(res.data.nomineeAge?.toString() || '');
        setNomineePhone(res.data.nomineePhone || '');
        setNomineeAddr(res.data.nomineeAddress || '');
      }
    } catch {
      toast.error('Failed to retrieve KYC registration records');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingKycs = async () => {
    try {
      const res = await api.get('/api/kyc/pending');
      setPendingKycs(res.data);
    } catch {
      toast.error('Failed to load pending KYC stack');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchPendingKycs();
    } else {
      fetchKycStatus();
    }
  }, [isAdmin]);

  const handleFileUpload = (e: any, setBase64: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
      toast.success(`${file.name} uploaded successfully!`);
    }
  };

  const handleSubmitKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aadharFront || !aadharBack || !panFile) {
      toast.error('Please upload Aadhar Front/Back and PAN files');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/kyc/submit', {
        aadharNumber,
        aadharFrontFile: aadharFront,
        aadharBackFile: aadharBack,
        panNumber,
        panFile,
        accountNumber,
        ifscCode,
        bankName,
        branchName,
        accountHolder,
        ref1Name,
        ref1Phone,
        ref1Relationship: ref1Rel,
        ref2Name,
        ref2Phone,
        ref2Relationship: ref2Rel,
        nomineeName,
        nomineeRelationship: nomineeRel,
        nomineeAge,
        nomineePhone,
        nomineeAddress: nomineeAddr,
      });

      toast.success('KYC documents submitted successfully!');
      fetchKycStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit KYC registration form');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyKyc = async (kycId: string, action: 'APPROVE' | 'REJECT') => {
    if (action === 'REJECT' && !rejectionReason.trim()) {
      toast.error('Please enter a rejection reason');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/api/kyc/verify/${kycId}`, {
        action,
        rejectionReason: action === 'REJECT' ? rejectionReason : undefined,
      });

      toast.success(`KYC registration ${action === 'APPROVE' ? 'Approved' : 'Rejected'} successfully!`);
      setSelectedKyc(null);
      setShowRejectModal(false);
      setRejectionReason('');
      fetchPendingKycs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Verification update failed');
      setLoading(false);
    }
  };

  const inputCls = 'mt-1 block w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-slate-200 outline-hidden text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors';
  const labelCls = 'text-xs font-semibold text-slate-400 block';

  if (loading && !selectedKyc) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // ────────────────── SUPER ADMIN / BACK OFFICE REVIEW UI ──────────────────
  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">KYC Document Review</h1>
          <p className="text-sm text-slate-400">Evaluate submitted verification packages, verify bank info, and issue welcome calls (24-hour SLA)</p>
        </div>

        {selectedKyc ? (
          /* Detailed KYC review portal */
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-900 pb-4">
              <h2 className="text-lg font-bold">Reviewing: {selectedKyc.user?.firstName} {selectedKyc.user?.lastName}</h2>
              <button
                onClick={() => setSelectedKyc(null)}
                className="rounded-lg border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              >
                Back to Stack
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Document details */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-300 border-l-2 border-indigo-500 pl-2 text-sm uppercase tracking-wider">Aadhar Details</h3>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <p>Number: <strong className="font-mono text-slate-200">{selectedKyc.aadharNumber}</strong></p>
                    <div className="flex gap-4 mt-2">
                      {selectedKyc.aadharFrontFile && (
                        <a href={selectedKyc.aadharFrontFile} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 font-semibold hover:underline">
                          <Eye className="h-4 w-4" /> View Aadhar Front
                        </a>
                      )}
                      {selectedKyc.aadharBackFile && (
                        <a href={selectedKyc.aadharBackFile} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 font-semibold hover:underline">
                          <Eye className="h-4 w-4" /> View Aadhar Back
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-300 border-l-2 border-indigo-500 pl-2 text-sm uppercase tracking-wider">PAN Details</h3>
                  <div className="mt-3 space-y-1.5 text-sm">
                    <p>Number: <strong className="font-mono text-slate-200">{selectedKyc.panNumber}</strong></p>
                    {selectedKyc.panFile && (
                      <a href={selectedKyc.panFile} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-indigo-400 font-semibold hover:underline mt-2 inline-block">
                        <Eye className="h-4 w-4" /> View PAN Doc
                      </a>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-300 border-l-2 border-indigo-500 pl-2 text-sm uppercase tracking-wider">Bank Details</h3>
                  <div className="mt-3 space-y-1.5 text-xs font-mono grid grid-cols-2 gap-2 text-slate-400">
                    <p>Holder: <strong className="text-slate-200 font-sans">{selectedKyc.accountHolder}</strong></p>
                    <p>Bank: <strong className="text-slate-200 font-sans">{selectedKyc.bankName}</strong></p>
                    <p>Branch: <strong className="text-slate-200 font-sans">{selectedKyc.branchName}</strong></p>
                    <p>Account: <strong className="text-slate-200 font-bold">{selectedKyc.accountNumber}</strong></p>
                    <p>IFSC Code: <strong className="text-slate-200 font-bold">{selectedKyc.ifscCode}</strong></p>
                  </div>
                </div>
              </div>

              {/* References & Nominees */}
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-300 border-l-2 border-indigo-500 pl-2 text-sm uppercase tracking-wider">References</h3>
                  <div className="mt-3 space-y-2 text-xs text-slate-400">
                    <p>Ref 1: <strong className="text-slate-200">{selectedKyc.ref1Name}</strong> ({selectedKyc.ref1Relationship}) — {selectedKyc.ref1Phone}</p>
                    <p>Ref 2: <strong className="text-slate-200">{selectedKyc.ref2Name}</strong> ({selectedKyc.ref2Relationship}) — {selectedKyc.ref2Phone}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-slate-300 border-l-2 border-indigo-500 pl-2 text-sm uppercase tracking-wider">Nominee</h3>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-400">
                    <p>Name: <strong className="text-slate-200">{selectedKyc.nomineeName}</strong> ({selectedKyc.nomineeRelationship})</p>
                    <p>Age: <strong className="text-slate-200">{selectedKyc.nomineeAge} years</strong></p>
                    <p>Phone: <strong className="text-slate-200">{selectedKyc.nomineePhone}</strong></p>
                    <p>Address: <strong className="text-slate-200">{selectedKyc.nomineeAddress}</strong></p>
                  </div>
                </div>
              </div>

            </div>

            {/* Verification Actions */}
            <div className="border-t border-slate-900 pt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/25 active:scale-95 transition-all"
              >
                <X className="h-4 w-4" /> Reject KYC
              </button>
              <button
                onClick={() => handleVerifyKyc(selectedKyc.id, 'APPROVE')}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Check className="h-4 w-4" /> Approve & Verify
              </button>
            </div>

            {/* Rejection Modal overlay */}
            {showRejectModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-900 bg-slate-950 p-6 space-y-4 shadow-2xl">
                  <h3 className="text-base font-bold text-red-400">Specify Rejection Reason</h3>
                  <textarea
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Aadhar scan is blurry, or IFSC code doesn't match bank details"
                    className="w-full h-24 rounded-xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-200 outline-hidden"
                  />
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="rounded-xl border border-slate-800 px-4 py-2 text-xs text-slate-400 hover:text-slate-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleVerifyKyc(selectedKyc.id, 'REJECT')}
                      className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        ) : (
          /* Main pending stack table */
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead>
                  <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 text-xs uppercase font-mono">
                    <th className="py-4 px-6">Member ID</th>
                    <th className="py-4 px-6">Name</th>
                    <th className="py-4 px-6">Email</th>
                    <th className="py-4 px-6">Submitted At</th>
                    <th className="py-4 px-6 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {pendingKycs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No pending KYC documentation in the back-office queue.</td>
                    </tr>
                  ) : (
                    pendingKycs.map((kyc) => (
                      <tr key={kyc.id} className="hover:bg-slate-900/10 transition-colors">
                        <td className="py-4 px-6 font-mono text-xs text-slate-500">{kyc.userId.slice(-8)}</td>
                        <td className="py-4 px-6 font-semibold text-slate-200">
                          {kyc.user?.firstName} {kyc.user?.lastName || ''}
                        </td>
                        <td className="py-4 px-6 font-mono text-xs">{kyc.user?.email}</td>
                        <td className="py-4 px-6 text-xs text-slate-500">
                          {new Date(kyc.submittedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <button
                            onClick={() => setSelectedKyc(kyc)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 hover:border-indigo-500 px-3.5 py-1.5 text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 transition-all font-semibold"
                          >
                            <Eye className="h-3.5 w-3.5" /> Review Form
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ────────────────── ADVISOR KYC DOCUMENT SUBMISSION UI ──────────────────
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Onboarding KYC Portal</h1>
        <p className="text-sm text-slate-400">Complete verification to schedule your welcome call and assign your policy credentials</p>
      </div>

      {/* KYC Status banner */}
      {kycRecord?.status === 'VERIFIED' && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-emerald-300">KYC Status: VERIFIED ✅</h2>
            <p className="text-xs text-slate-400">Your documents are approved. Welcome call has been scheduled and your policy has been underwritten.</p>
          </div>
        </div>
      )}

      {kycRecord?.status === 'SUBMITTED' && (
        <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5 flex items-start gap-4 animate-pulse">
          <Clock className="h-6 w-6 text-indigo-400 shrink-0" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-indigo-300">KYC Status: SUBMITTED (Reviewing) ⏳</h2>
            <p className="text-xs text-slate-400">Your documents are in the back-office verification queue. Review finishes within 24 hours.</p>
          </div>
        </div>
      )}

      {kycRecord?.status === 'REJECTED' && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-5 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-red-400 shrink-0" />
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-red-300">KYC Status: REJECTED ❌</h2>
            <p className="text-xs text-red-400 font-semibold">Reason: {kycRecord.rejectionReason}</p>
            <p className="text-xs text-slate-400 mt-1">Please correct your inputs, re-upload documents, and resubmit.</p>
          </div>
        </div>
      )}

      {(!kycRecord || kycRecord.status === 'PENDING' || kycRecord.status === 'REJECTED') && (
        <form onSubmit={handleSubmitKyc} className="space-y-6">
          
          {/* Aadhar / PAN section */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">1. Government Identifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Aadhar Card Number</label>
                <input
                  type="text" required pattern="\d{12}" title="12 digit aadhar number"
                  value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)}
                  className={inputCls} placeholder="123456789012"
                />
              </div>
              <div>
                <label className={labelCls}>PAN Card Number</label>
                <input
                  type="text" required pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}" title="Standard PAN format: ABCDE1234F"
                  value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                  className={inputCls} placeholder="ABCDE1234F"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-900 pt-4">
              <div>
                <label className={labelCls}>Aadhar Card Front Image</label>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl p-4 hover:border-indigo-500 transition-colors relative cursor-pointer">
                  <input type="file" required accept="image/*" onChange={(e) => handleFileUpload(e, setAadharFront)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="text-center space-y-1 text-slate-400 text-xs">
                    <Upload className="mx-auto h-5 w-5 text-slate-500" />
                    <span>{aadharFront ? 'AadharFront.jpg Loaded' : 'Click to Upload'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>Aadhar Card Back Image</label>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl p-4 hover:border-indigo-500 transition-colors relative cursor-pointer">
                  <input type="file" required accept="image/*" onChange={(e) => handleFileUpload(e, setAadharBack)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="text-center space-y-1 text-slate-400 text-xs">
                    <Upload className="mx-auto h-5 w-5 text-slate-500" />
                    <span>{aadharBack ? 'AadharBack.jpg Loaded' : 'Click to Upload'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className={labelCls}>PAN Card Document</label>
                <div className="mt-1 flex items-center justify-center border-2 border-dashed border-slate-800 rounded-xl p-4 hover:border-indigo-500 transition-colors relative cursor-pointer">
                  <input type="file" required accept="image/*" onChange={(e) => handleFileUpload(e, setPanFile)} className="absolute inset-0 opacity-0 cursor-pointer" />
                  <div className="text-center space-y-1 text-slate-400 text-xs">
                    <Upload className="mx-auto h-5 w-5 text-slate-500" />
                    <span>{panFile ? 'PANCard.jpg Loaded' : 'Click to Upload'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bank Accounts Section */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">2. Bank Details (Payout Account)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Account Holder Name</label>
                <input
                  type="text" required value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)}
                  className={inputCls} placeholder="John Doe"
                />
              </div>
              <div>
                <label className={labelCls}>Account Number</label>
                <input
                  type="password" required value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                  className={inputCls} placeholder="••••••••••••"
                />
              </div>
              <div>
                <label className={labelCls}>IFSC Code</label>
                <input
                  type="text" required pattern="^[A-Z]{4}0[A-Z0-9]{6}$" title="e.g. SBIN0001234"
                  value={ifscCode} onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className={inputCls} placeholder="SBIN0001234"
                />
              </div>
              <div>
                <label className={labelCls}>Bank Name</label>
                <input
                  type="text" required value={bankName} onChange={(e) => setBankName(e.target.value)}
                  className={inputCls} placeholder="State Bank of India"
                />
              </div>
              <div>
                <label className={labelCls}>Branch Name</label>
                <input
                  type="text" required value={branchName} onChange={(e) => setBranchName(e.target.value)}
                  className={inputCls} placeholder="Main Branch, Mumbai"
                />
              </div>
            </div>
          </div>

          {/* Nominee Details Section */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">3. Policy Nominee Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Nominee Full Name</label>
                <input
                  type="text" required value={nomineeName} onChange={(e) => setNomineeName(e.target.value)}
                  className={inputCls} placeholder="Mary Doe"
                />
              </div>
              <div>
                <label className={labelCls}>Relationship</label>
                <input
                  type="text" required value={nomineeRel} onChange={(e) => setNomineeRel(e.target.value)}
                  className={inputCls} placeholder="Spouse"
                />
              </div>
              <div>
                <label className={labelCls}>Nominee Age</label>
                <input
                  type="number" required value={nomineeAge} onChange={(e) => setNomineeAge(e.target.value)}
                  className={inputCls} placeholder="32"
                />
              </div>
              <div>
                <label className={labelCls}>Nominee Phone</label>
                <input
                  type="text" required value={nomineePhone} onChange={(e) => setNomineePhone(e.target.value)}
                  className={inputCls} placeholder="9876543210"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Address</label>
                <input
                  type="text" required value={nomineeAddr} onChange={(e) => setNomineeAddr(e.target.value)}
                  className={inputCls} placeholder="House 4, Sector 12, Mumbai"
                />
              </div>
            </div>
          </div>

          {/* References */}
          <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">4. Personal References</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400">Reference 1</h3>
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input type="text" required value={ref1Name} onChange={(e) => setRef1Name(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="text" required value={ref1Phone} onChange={(e) => setRef1Phone(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Relationship</label>
                  <input type="text" required value={ref1Rel} onChange={(e) => setRef1Rel(e.target.value)} className={inputCls} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-400">Reference 2</h3>
                <div>
                  <label className={labelCls}>Full Name</label>
                  <input type="text" required value={ref2Name} onChange={(e) => setRef2Name(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input type="text" required value={ref2Phone} onChange={(e) => setRef2Phone(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Relationship</label>
                  <input type="text" required value={ref2Rel} onChange={(e) => setRef2Rel(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
          >
            Submit KYC Documents <ArrowRight className="h-4 w-4" />
          </button>

        </form>
      )}
    </div>
  );
}
