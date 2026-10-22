'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { SwapRequest, Booking } from '@/types/database';
import { RefreshCw, Calendar, Check, X, CheckCircle, Clock, AlertTriangle, Star } from 'lucide-react';

export default function SwapsAndStaysPage() {
  const { currentUser, refreshWallet } = useAuth();
  const [activeTab, setActiveTab] = useState<'swaps' | 'stays'>('swaps');

  const [swaps, setSwaps] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Review modal state
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // 1. Fetch Swaps
      const swapsRes = await fetch('/api/swaps', {
        headers: { 'x-user-id': currentUser.id },
      });
      const swapsData = await swapsRes.json();
      if (swapsData.success) {
        setSwaps(swapsData.data || []);
      }

      // 2. Fetch Bookings
      const bookingsRes = await fetch('/api/bookings', {
        headers: { 'x-user-id': currentUser.id },
      });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.data || []);
      }
    } catch (err) {
      console.error('Error fetching swaps/bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  // Accept a direct swap
  const handleAcceptSwap = async (swapId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/swaps/${swapId}/accept`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback('Swap accepted! Both bookings have been confirmed atomically and agreements saved.');
        loadData();
      } else {
        setActionFeedback(`Error: ${data.error?.message || 'Could not accept swap'}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Decline a direct swap
  const handleDeclineSwap = async (swapId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/swaps/${swapId}/decline`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback('Swap declined/cancelled.');
        loadData();
      } else {
        setActionFeedback(`Error: ${data.error?.message}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Host confirms booking
  const handleConfirmBooking = async (bookingId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback('Booking confirmed! Dates are locked.');
        loadData();
      } else {
        setActionFeedback(`Error: ${data.error?.message}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Host marks stay as completed & settles ledger
  const handleCompleteStay = async (bookingId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'POST',
        headers: { 'x-user-id': currentUser.id },
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback('Stay marked completed! Credits transferred to host wallet.');
        await refreshWallet();
        loadData();
      } else {
        setActionFeedback(`Error: ${data.error?.message}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Cancel stay
  const handleCancelBooking = async (bookingId: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({ reason: 'Member cancelled via dashboard' }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback('Booking cancelled. Reserved credits refunded to guest.');
        await refreshWallet();
        loadData();
      } else {
        setActionFeedback(`Error: ${data.error?.message}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Submit Review
  const handleSubmitReview = async () => {
    if (!currentUser || !reviewBookingId) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
        body: JSON.stringify({
          booking_id: reviewBookingId,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionFeedback('Thank you! Your verified stay review has been recorded.');
        setReviewBookingId(null);
        setReviewComment('');
      } else {
        setActionFeedback(`Review Error: ${data.error?.message}`);
      }
    } catch (err: any) {
      setActionFeedback(`Review Error: ${err.message}`);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            My Exchanges &amp; Stays
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your mutual direct swap requests, confirmed stays, and credit transactions.
          </p>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-200/80 p-1 rounded-xl self-start">
          <button
            onClick={() => setActiveTab('swaps')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'swaps'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Direct Swaps ({swaps.length})
          </button>
          <button
            onClick={() => setActiveTab('stays')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'stays'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Credit Stays ({bookings.length})
          </button>
        </div>
      </div>

      {actionFeedback && (
        <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-sm font-semibold flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-xs text-blue-600 font-bold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading your exchange records...</div>
      ) : activeTab === 'swaps' ? (
        /* DIRECT SWAPS LIST */
        swaps.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <RefreshCw className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Direct Swap Proposals Yet</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              When you propose a mutual swap with another member or receive an offer, they will appear here.
            </p>
            <Link href="/" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm">
              Discover Homes to Swap
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {swaps.map((swap) => {
              const isRequester = swap.requester_id === currentUser?.id;
              const isRecipient = swap.recipient_id === currentUser?.id;

              return (
                <div key={swap.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                        swap.request_status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : swap.request_status === 'pending'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {swap.request_status}
                      </span>
                      <span className="text-xs text-slate-500">
                        {isRequester ? 'Outgoing Swap Offer' : 'Incoming Swap Proposal'}
                      </span>
                    </div>

                    <span className="text-xs text-slate-400">
                      Created: {new Date(swap.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* PROPOSAL COMPARISON GRID */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs">
                    <div>
                      <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Requester Stay ({swap.requester?.display_name})
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        {swap.recipient_property?.title} ({swap.recipient_property?.city})
                      </div>
                      <div className="text-slate-600 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {swap.requester_check_in} to {swap.requester_check_out}
                      </div>
                    </div>

                    <div>
                      <div className="font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Recipient Stay ({swap.recipient?.display_name})
                      </div>
                      <div className="font-bold text-slate-900 text-sm">
                        {swap.requester_property?.title} ({swap.requester_property?.city})
                      </div>
                      <div className="text-slate-600 mt-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {swap.recipient_check_in} to {swap.recipient_check_out}
                      </div>
                    </div>
                  </div>

                  {/* ACTION CONTROLS */}
                  {swap.request_status === 'pending' && isRecipient && (
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        onClick={() => handleAcceptSwap(swap.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" /> Accept &amp; Confirm Swap
                      </button>
                      <button
                        onClick={() => handleDeclineSwap(swap.id)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <X className="w-3.5 h-3.5" /> Decline
                      </button>
                    </div>
                  )}

                  {swap.request_status === 'pending' && isRequester && (
                    <div className="flex justify-end pt-2">
                      <button
                        onClick={() => handleDeclineSwap(swap.id)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold"
                      >
                        Cancel Proposal
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* CREDIT STAYS LIST */
        bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-700">No Credit Stays Booked</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-6">
              When you book stays with earned credits or guests request to stay at your home, they will appear here.
            </p>
            <Link href="/" className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm">
              Explore Available Stays
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => {
              const isGuest = b.guest_id === currentUser?.id;
              const isHost = b.host_id === currentUser?.id;

              return (
                <div key={b.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase ${
                        b.booking_status === 'confirmed'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.booking_status === 'completed'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : b.booking_status === 'requested'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {b.booking_status}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {isGuest ? 'You are the Guest' : 'You are the Host'}
                      </span>
                    </div>

                    <div className="text-xs font-black text-blue-600">
                      {b.credit_price} Credits ({b.booking_type})
                    </div>
                  </div>

                  {/* BOOKING DETAILS */}
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{b.property?.title}</h3>
                      <p className="text-xs text-slate-500">{b.property?.neighbourhood}, {b.property?.city}</p>
                      <div className="text-xs text-slate-600 mt-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span>Dates: <strong>{b.check_in}</strong> to <strong>{b.check_out}</strong></span>
                      </div>
                    </div>

                    <div className="text-xs text-slate-500 sm:text-right">
                      <div>Guest: <strong>{b.guest?.display_name}</strong></div>
                      <div>Host: <strong>{b.host?.display_name}</strong></div>
                    </div>
                  </div>

                  {/* ACTION CONTROLS */}
                  <div className="flex flex-wrap gap-2 justify-end pt-2 border-t border-slate-100">
                    {/* Host confirms requested booking */}
                    {b.booking_status === 'requested' && isHost && (
                      <button
                        onClick={() => handleConfirmBooking(b.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        Confirm Booking
                      </button>
                    )}

                    {/* Host completes stay and settles credits */}
                    {b.booking_status === 'confirmed' && isHost && (
                      <button
                        onClick={() => handleCompleteStay(b.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
                      >
                        Mark Completed &amp; Collect Credits
                      </button>
                    )}

                    {/* Review submission if completed */}
                    {b.booking_status === 'completed' && (
                      <button
                        onClick={() => setReviewBookingId(b.id)}
                        className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        <Star className="w-3.5 h-3.5" /> Submit Review
                      </button>
                    )}

                    {/* Cancel booking if requested or confirmed */}
                    {(b.booking_status === 'requested' || b.booking_status === 'confirmed') && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="px-4 py-2 bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Cancel Stay
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* REVIEW MODAL */}
      {reviewBookingId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-slate-900">Review Your Stay Experience</h3>
            <p className="text-xs text-slate-500">
              Only verified completed stays are eligible to leave public member reviews.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Rating
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setReviewRating(star)}
                    className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center border transition-all ${
                      reviewRating >= star
                        ? 'bg-amber-400 text-white border-amber-500 shadow-sm'
                        : 'bg-slate-100 text-slate-400 border-slate-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Your Review *
              </label>
              <textarea
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="How was the home cleanliness, amenities, and host communication? (Min 10 chars)"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setReviewBookingId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reviewSubmitting || reviewComment.trim().length < 10}
                onClick={handleSubmitReview}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                {reviewSubmitting ? 'Submitting...' : 'Post Verified Review'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
