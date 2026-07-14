'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Award, Trophy, Calendar, CheckCircle2, Circle, ShieldCheck } from 'lucide-react';

export default function MyAwardsPage() {
  const [myAwards, setMyAwards] = useState<any[]>([]);
  const [allAwards, setAllAwards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [myRes, allRes] = await Promise.all([
        api.get('/api/awards/my'),
        api.get('/api/awards/all'),
      ]);
      setMyAwards(myRes.data);
      setAllAwards(allRes.data);
    } catch {
      toast.error('Failed to load performance milestone credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadCertificate = (awardName: string, certNum: string) => {
    // Simulate certificate download
    toast.success(`Downloading certificate for ${awardName}...`);
    const docText = `
=========================================
      JEEVAN ENTERPRISE EXCELLENCE
=========================================
This is to certify that the MLM Member
has successfully achieved the milestone:
       ${awardName.toUpperCase()}
       
Certificate No: ${certNum}
Date Issued: ${new Date().toLocaleDateString()}
=========================================
    `;
    const element = document.createElement('a');
    const file = new Blob([docText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${awardName.replace(/\s+/g, '_')}_Certificate.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  // Map user achieved awards by award ID
  const achievedMap = new Map(myAwards.map((ma) => [ma.awardId, ma]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Awards & Recognition</h1>
        <p className="text-sm text-slate-400">Track monthly performance metrics and retrieve physical certificates for milestone advancements</p>
      </div>

      {/* Dynamic Badge Display Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allAwards.map((award) => {
          const achievement = achievedMap.get(award.id);
          const isAchieved = !!achievement;

          return (
            <div
              key={award.id}
              className={`rounded-2xl border p-6 flex flex-col justify-between space-y-6 transition-all relative overflow-hidden ${
                isAchieved
                  ? 'border-indigo-500/30 bg-indigo-950/5 shadow-lg shadow-indigo-500/5'
                  : 'border-slate-900 bg-slate-950/10 opacity-70'
              }`}
            >
              {/* Achievement status flag */}
              {isAchieved && (
                <div className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase">
                  <CheckCircle2 className="h-3 w-3" /> Earned
                </div>
              )}

              <div className="space-y-4">
                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                  isAchieved ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800/40 text-slate-500'
                }`}>
                  {award.type === 'Trophy' || award.type === 'Trip' ? (
                    <Trophy className="h-6 w-6" />
                  ) : (
                    <Award className="h-6 w-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-bold text-slate-200 text-base leading-snug">{award.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{award.description}</p>
                </div>
              </div>

              <div className="border-t border-slate-900 pt-4 flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Type: <strong className="text-slate-400 font-semibold">{award.type}</strong></span>
                  {award.value > 0 && <span>Value: <strong className="text-amber-400 font-bold">₹{award.value.toLocaleString()}</strong></span>}
                </div>

                {isAchieved ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Achieved: {new Date(achievement.achievedDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    </div>
                    {achievement.certificateNumber && (
                      <button
                        onClick={() => handleDownloadCertificate(award.name, achievement.certificateNumber)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/20 bg-indigo-500/10 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/25 active:scale-95 transition-all"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> Download Certificate
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Circle className="h-3.5 w-3.5 text-slate-800" />
                    <span>Locked — Meet recruitment triggers to open</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
