'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Report } from '@/types/database';
import { ShieldAlert, CheckCircle, XCircle, AlertTriangle, UserCheck, Clock } from 'lucide-react';

export default function AdminDashboardPage() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Manual verification test box
  const [targetUserId, setTargetUserId] = useState('b2222222-2222-2222-2222-222222222222');
  const [decisionNotes, setDecisionNotes] = useState('Reviewed property lease documents and Aadhaar ID.');
  const [deciding, setDeciding] = useState(false);

  useEffect(() => {
    async function fetchReports() {
      if (!currentUser || currentUser.role !== 'admin') {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/admin/reports', {
          headers: { 'x-user-id': currentUser.id },
        });
        const data = await res.json();
        if (data.success) {
          setReports(data.data || []);
        }
      } catch (err) {
        console.error('Error fetching admin reports:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [currentUser]);

  const handleVerificationDecision = async (decision: 'verified' | 'rejected') => {
    if (!currentUser || currentUser.role !== 'admin') return;
    setDeciding(true);
    setActionFeedback(null);
    try {
      const res = await fetch(`/api/admin/verification/${targetUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          decision,
          notes: decisionNotes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionFeedback(`Member verification updated to "${decision.toUpperCase()}" with audit log entry.`);
      } else {
        setActionFeedback(`Error: ${data.error?.message}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    } finally {
      setDeciding(false);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Privilege Required</h2>
        <p className="text-sm text-slate-500 mb-6">
          This dashboard is restricted to authorized platform administrators. Switch actor to <strong>Rohan Mehta (Admin)</strong> in the top navigation bar to test this screen!
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            Privileged Operational Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Moderation, Trust &amp; Disputes
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review safety incidents, resolve property claims, and approve member verification authority.
          </p>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-semibold">
          {actionFeedback}
        </div>
      )}

      {/* QUICK VERIFICATION DECISION PANEL */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-blue-600" />
          Review &amp; Decide Member Verification Evidence
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Target Member ID
            </label>
            <input
              type="text"
              value={targetUserId}
              onChange={(e) => setTargetUserId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Audit Notes &amp; Findings
            </label>
            <input
              type="text"
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            disabled={deciding}
            onClick={() => handleVerificationDecision('verified')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <CheckCircle className="w-4 h-4" /> Approve &amp; Verify
          </button>
          <button
            type="button"
            disabled={deciding}
            onClick={() => handleVerificationDecision('rejected')}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <XCircle className="w-4 h-4" /> Reject Evidence
          </button>
        </div>
      </div>

      {/* INCIDENT & SAFETY REPORTS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900">
            Reported Safety, Property &amp; Fraud Cases
          </h2>
          <span className="text-xs text-slate-500">
            {reports.length} cases filed
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading admin reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No unresolved reports currently open. System status healthy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Target Type</th>
                  <th className="py-3 px-6">Description</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-6 font-bold text-slate-900 uppercase">
                      {r.category}
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 font-mono">
                      {r.target_type}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 max-w-sm truncate">
                      {r.description}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold uppercase text-[10px]">
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-400 font-mono">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
