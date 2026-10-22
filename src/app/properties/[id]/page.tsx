'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Property, PropertyScore } from '@/types/database';
import {
  MapPin,
  Bed,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  ArrowRight,
  Info,
  ChevronLeft,
} from 'lucide-react';

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const { currentUser, refreshWallet } = useAuth();

  const [property, setProperty] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Booking / Swap state
  const [bookingMode, setBookingMode] = useState<'credit' | 'swap'>('credit');
  const [checkIn, setCheckIn] = useState('2026-11-01');
  const [checkOut, setCheckOut] = useState('2026-11-04');
  const [userProperties, setUserProperties] = useState<Property[]>([]);
  const [selectedUserPropId, setSelectedUserPropId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/properties/${propertyId}`, {
          headers: currentUser ? { 'x-user-id': currentUser.id } : {},
        });
        const json = await res.json();
        if (json.success) {
          setProperty(json.data);
        } else {
          setErrorMsg(json.error?.message || 'Failed to load property');
        }

        // Fetch current user's listings for swap proposals
        if (currentUser) {
          const userPropsRes = await fetch('/api/properties', {
            headers: { 'x-user-id': currentUser.id },
          });
          const userPropsJson = await userPropsRes.json();
          if (userPropsJson.success && userPropsJson.data.length > 0) {
            setUserProperties(userPropsJson.data);
            setSelectedUserPropId(userPropsJson.data[0].id);
          }
        }
      } catch (err: any) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [propertyId, currentUser]);

  // Calculate nights
  const calculateNights = () => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const nights = calculateNights();
  const creditCost = nights * 1; // 1 credit / night pilot hypothesis

  // Submit Credit Booking Request
  const handleCreditBooking = async () => {
    setActionFeedback(null);
    if (!currentUser) {
      setActionFeedback({ type: 'error', text: 'Please sign in or select an actor from the top bar to book.' });
      return;
    }
    if (nights <= 0) {
      setActionFeedback({ type: 'error', text: 'Check-out date must be after check-in date.' });
      return;
    }
    if (currentUser.available_balance < creditCost) {
      setActionFeedback({
        type: 'error',
        text: `Insufficient credits. This ${nights}-night stay requires ${creditCost} credits, but you have ${currentUser.available_balance} available.`,
      });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          property_id: propertyId,
          check_in: checkIn,
          check_out: checkOut,
        }),
      });

      const data = await res.json();
      if (data.success) {
        await refreshWallet();
        setActionFeedback({
          type: 'success',
          text: `Booking requested! ${creditCost} credits held in reserve. Awaiting host confirmation.`,
        });
      } else {
        setActionFeedback({ type: 'error', text: data.error?.message || 'Failed to request booking.' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Direct Swap Proposal
  const handleSwapProposal = async () => {
    setActionFeedback(null);
    if (!currentUser) {
      setActionFeedback({ type: 'error', text: 'Please sign in or select an actor from the top bar.' });
      return;
    }
    if (!selectedUserPropId) {
      setActionFeedback({ type: 'error', text: 'You need an active property listing of your own to propose a direct swap.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/swaps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
        },
        body: JSON.stringify({
          requester_property_id: selectedUserPropId,
          recipient_property_id: propertyId,
          requester_check_in: checkIn,
          requester_check_out: checkOut,
          recipient_check_in: checkIn,
          recipient_check_out: checkOut,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActionFeedback({
          type: 'success',
          text: 'Mutual swap proposed! Once the host accepts your dates and terms, both stays confirm atomically.',
        });
      } else {
        setActionFeedback({ type: 'error', text: data.error?.message || 'Failed to propose swap.' });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-500">
        Loading property details from Supabase...
      </div>
    );
  }

  if (errorMsg || !property) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Property Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">{errorMsg || 'Could not locate listing.'}</p>
        <Link href="/" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm">
          Return to Explore
        </Link>
      </div>
    );
  }

  const scoreData = Array.isArray(property.property_scores)
    ? property.property_scores[0]
    : property.property_scores;

  const photos = Array.isArray(property.property_photos) && property.property_photos.length > 0
    ? property.property_photos.map((p: any) => p.storage_path)
    : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* BACK NAVIGATION */}
      <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4" /> Back to Explore
      </Link>

      {/* TITLE & HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
            <span>{property.city}, {property.state}</span>
            <span>&bull;</span>
            <span>{property.neighbourhood}</span>
            <span>&bull;</span>
            <span className="capitalize">{property.property_type}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {property.title}
          </h1>
        </div>

        {/* SWAPSCORE BADGE */}
        {scoreData && (
          <div className="flex items-center gap-3 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-sm self-start">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl ${
              scoreData.grade === 'A' ? 'bg-emerald-500' : scoreData.grade === 'B' ? 'bg-blue-500' : 'bg-amber-500'
            }`}>
              {scoreData.grade}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                SwapScore Verified
              </div>
              <div className="text-lg font-black tracking-tight">
                {scoreData.total_score} <span className="text-xs text-slate-400 font-normal">/ 100</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PHOTO HERO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-2xl overflow-hidden mb-10 h-[380px] sm:h-[450px]">
        <div className="md:col-span-2 h-full">
          <img
            src={photos[0]}
            alt={property.title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="hidden md:flex flex-col gap-3 h-full">
          <img
            src={photos[1] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80'}
            alt="Interior"
            className="w-full h-1/2 object-cover"
          />
          <img
            src={photos[2] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'}
            alt="Interior detail"
            className="w-full h-1/2 object-cover"
          />
        </div>
      </div>

      {/* MAIN TWO-COLUMN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* LEFT COLUMN: DETAILS & SWAPSCORE BREAKDOWN */}
        <div className="lg:col-span-2 space-y-8">
          {/* CAPACITY & STATS */}
          <div className="flex items-center gap-6 py-4 border-y border-slate-200 text-sm font-semibold text-slate-700">
            <div className="flex items-center gap-2">
              <Bed className="w-5 h-5 text-blue-600" />
              <span>{property.bedrooms} {property.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>Up to {property.guest_capacity} Guests</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Verified Authority</span>
            </div>
          </div>

          {/* DESCRIPTION */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">About this Home</h2>
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {property.description}
            </p>
          </div>

          {/* EXPLAINABLE SWAPSCORE BREAKDOWN CARD */}
          {scoreData && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Explainable SwapScore Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Algorithm Version {scoreData.method_version || '1.0'} &bull; Evidence: <strong>{scoreData.evidence_status || 'Verified'}</strong>
                  </p>
                </div>
                <div className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
                  Grade {scoreData.grade} ({scoreData.total_score}/100)
                </div>
              </div>

              {/* 5-FACTOR PROGRESS BARS */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Condition &amp; Cleanliness (Weight: 25%)</span>
                    <span>{scoreData.condition_score} / 100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${scoreData.condition_score}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Location &amp; Accessibility (Weight: 25%)</span>
                    <span>{scoreData.location_score} / 100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${scoreData.location_score}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Amenities &amp; Comfort (Weight: 20%)</span>
                    <span>{scoreData.amenities_score} / 100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${scoreData.amenities_score}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Space &amp; Capacity (Weight: 15%)</span>
                    <span>{scoreData.space_score} / 100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${scoreData.space_score}%` }} />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>Listing Completeness &amp; Verification (Weight: 15%)</span>
                    <span>{scoreData.listing_quality_score} / 100</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${scoreData.listing_quality_score}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AMENITIES */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">Amenities Included</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(property.amenities || []).map((amenity: string) => (
                <div key={amenity} className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{amenity}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HOUSE RULES */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3">House Rules</h2>
            <div className="space-y-2">
              {(property.house_rules || []).map((rule: string) => (
                <div key={rule} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* PRIVACY NOTICE FOR EXACT ADDRESS */}
          <div className="p-4 rounded-xl bg-slate-100 border border-slate-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 leading-relaxed">
              <strong>Location Privacy Protocol:</strong> {property.exact_address ? (
                <span className="text-emerald-800 font-bold">Exact Address: {property.exact_address}</span>
              ) : (
                'Exact house/apartment numbers remain hidden until mutual exchange agreements are confirmed.'
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: BOOKING & DIRECT SWAP ACTION PANEL */}
        <div>
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-lg sticky top-24 space-y-6">
            {/* TABS FOR CREDIT STAY VS DIRECT SWAP */}
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setBookingMode('credit')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  bookingMode === 'credit'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Credit Stay
              </button>
              <button
                type="button"
                onClick={() => setBookingMode('swap')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  bookingMode === 'swap'
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Direct Swap
              </button>
            </div>

            {/* FEEDBACK NOTICE */}
            {actionFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  actionFeedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {actionFeedback.text}
              </div>
            )}

            {/* DATES PICKER */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Check-in Date (inclusive)
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Check-out Date (exclusive)
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* CREDIT STAY DETAILS */}
            {bookingMode === 'credit' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Pilot rate:</span>
                    <span className="font-bold">1 credit / night</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Calculated nights:</span>
                    <span className="font-bold">{nights} nights</span>
                  </div>
                  <div className="flex justify-between text-slate-900 text-sm font-black pt-2 border-t border-slate-200">
                    <span>Total Credits:</span>
                    <span className="text-blue-600">{creditCost} Credits</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs text-slate-500 px-1">
                  <span>Your Available Balance:</span>
                  <span className="font-bold text-slate-800">{currentUser?.available_balance ?? 0} Credits</span>
                </div>

                <button
                  type="button"
                  onClick={handleCreditBooking}
                  disabled={submitting}
                  className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {submitting ? 'Holding Credits...' : `Request Stay (${creditCost} Credits)`}
                </button>
              </div>
            )}

            {/* DIRECT SWAP DETAILS */}
            {bookingMode === 'swap' && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Home to Offer
                  </label>
                  {userProperties.length > 0 ? (
                    <select
                      value={selectedUserPropId}
                      onChange={(e) => setSelectedUserPropId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                    >
                      {userProperties.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.city})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200">
                      You haven't listed a home yet. List a property first to propose direct swaps!
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Both hosts must accept the exact same terms. Once consented, dates for both homes are atomically reserved without risk of double-booking.
                </p>

                <button
                  type="button"
                  onClick={handleSwapProposal}
                  disabled={submitting || userProperties.length === 0}
                  className="w-full py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  {submitting ? 'Proposing...' : 'Propose Direct Swap'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
