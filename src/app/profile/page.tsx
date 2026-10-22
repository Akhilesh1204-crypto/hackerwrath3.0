'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ShieldCheck, User, Upload, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<any | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Verification document submission state
  const [idDocPath, setIdDocPath] = useState('');
  const [propertyDocPath, setPropertyDocPath] = useState('');
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [verifFeedback, setVerifFeedback] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      if (!currentUser) return;
      setLoading(true);
      try {
        const res = await fetch('/api/profile', {
          headers: { 'x-user-id': currentUser.id },
        });
        const data = await res.json();
        if (data.success && data.data) {
          setProfile(data.data);
          setDisplayName(data.data.display_name || '');
          setBio(data.data.bio || '');
          setPhone(data.data.phone || '');
        }
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [currentUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback('Profile updated successfully!');
      } else {
        setFeedback(`Error: ${data.error?.message}`);
      }
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleVerificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmittingVerification(true);
    setVerifFeedback(null);
    try {
      const res = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          id_document_path: idDocPath || 'documents/id_proof_mock.pdf',
          property_proof_path: propertyDocPath || 'documents/property_lease_mock.pdf',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setVerifFeedback('Verification documents submitted! Status is now Pending Review.');
        setProfile((prev: any) => ({ ...prev, verification_status: 'pending' }));
      } else {
        setVerifFeedback(`Error: ${data.error?.message}`);
      }
    } catch (err: any) {
      setVerifFeedback(`Error: ${err.message}`);
    } finally {
      setSubmittingVerification(false);
    }
  };

  const verifStatus = profile?.verification_status || currentUser?.verification_status || 'unverified';

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Member Profile &amp; Verification
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your public member details and complete identity/hosting authority checks.
        </p>
      </div>

      {/* VERIFICATION STATUS HERO */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            verifStatus === 'verified'
              ? 'bg-emerald-100 text-emerald-700'
              : verifStatus === 'pending'
              ? 'bg-amber-100 text-amber-700'
              : 'bg-slate-100 text-slate-600'
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Verification Status (Server-Controlled)
            </div>
            <div className="text-lg font-black text-slate-900 capitalize">
              {verifStatus}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {verifStatus === 'verified'
                ? 'Identity and property hosting authority confirmed by staff.'
                : verifStatus === 'pending'
                ? 'Your submitted documents are under operational review.'
                : 'Submit verification evidence below to unlock verified badges.'}
            </p>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider self-start sm:self-center ${
          verifStatus === 'verified'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            : verifStatus === 'pending'
            ? 'bg-amber-50 text-amber-800 border border-amber-200'
            : 'bg-slate-100 text-slate-700'
        }`}>
          {verifStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* EDIT PROFILE FORM */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
            Public Member Information
          </h2>

          {feedback && (
            <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs font-semibold">
              {feedback}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Bio &amp; Travel Background
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (Confidential)
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>

        {/* SUBMIT VERIFICATION EVIDENCE */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3">
            Submit Verification Documents
          </h2>

          <p className="text-xs text-slate-500 leading-relaxed">
            As required by the PRD trust model, members must verify identity and property authority before public listing activation.
          </p>

          {verifFeedback && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
              {verifFeedback}
            </div>
          )}

          <form onSubmit={handleVerificationSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Identity Document Reference *
              </label>
              <input
                type="text"
                value={idDocPath}
                onChange={(e) => setIdDocPath(e.target.value)}
                placeholder="Aadhaar / Passport / DL path in private storage"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Property Authority Proof
              </label>
              <input
                type="text"
                value={propertyDocPath}
                onChange={(e) => setPropertyDocPath(e.target.value)}
                placeholder="Electricity bill / Rent agreement / NOC"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600">
              Documents are stored in encrypted Supabase Storage buckets with short-lived signed URLs.
            </div>

            <button
              type="submit"
              disabled={submittingVerification}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-md disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {submittingVerification ? 'Submitting...' : 'Submit Evidence for Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
