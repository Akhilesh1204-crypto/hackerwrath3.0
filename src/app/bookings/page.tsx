'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Coins,
  Flag,
  Home,
  KeyRound,
  MessageSquareQuote,
  Repeat2,
  Star,
  UserRound,
  XCircle,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/components/auth/AuthProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { ReportModal } from '@/components/modals/ReportModal';
import { Badge, BookingStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { EmptyState, ErrorState, LoadingBlock, Tabs } from '@/components/ui/Primitives';
import { useToast } from '@/components/ui/Toast';
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  createReview,
  getBookings,
} from '@/lib/api';
import { errorMessage } from '@/lib/api/client';
import { formatDate, formatRange, nightsBetween, todayISO } from '@/lib/dates';
import { useApiQuery } from '@/lib/hooks';
import type { Booking } from '@/lib/types';
import { cn } from '@/lib/utils';

const REVIEW_MIN = 10;

function BookingsContent() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const query = useApiQuery(() => getBookings(), []);
  const bookings = query.data ?? [];

  const [tab, setTab] = useState('upcoming');
  const [busy, setBusy] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<Booking | null>(null);

  const today = todayISO();

  const groups = useMemo(() => {
    const upcoming = bookings.filter(
      (booking) =>
        (booking.booking_status === 'requested' || booking.booking_status === 'confirmed') &&
        booking.check_out >= today,
    );
    const guest = bookings.filter((booking) => booking.guest_id === user?.id);
    const host = bookings.filter((booking) => booking.host_id === user?.id);
    const past = bookings.filter(
      (booking) =>
        booking.booking_status === 'completed' ||
        booking.booking_status === 'cancelled' ||
        booking.check_out < today,
    );
    return { upcoming, guest, host, past };
  }, [bookings, today, user?.id]);

  const visible =
    tab === 'upcoming'
      ? groups.upcoming
      : tab === 'guest'
        ? groups.guest
        : tab === 'host'
          ? groups.host
          : groups.past;

  function refreshWallet() {
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('swapstay:wallet'));
  }

  async function act(booking: Booking, action: 'confirm' | 'complete') {
    setBusy(`${booking.id}:${action}`);
    try {
      if (action === 'confirm') {
        await confirmBooking(booking.id);
        success('Booking confirmed', 'The guest has been notified and the dates are now held.');
      } else {
        const result = await completeBooking(booking.id);
        success(
          'Stay completed',
          result.settled
            ? `${result.creditsTransferred ?? booking.credit_price} credits settled. The guest can now leave a review.`
            : 'The direct swap is marked complete.',
        );
      }
      refreshWallet();
      query.refresh();
    } catch (error) {
      toastError('Action failed', errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function submitCancel() {
    if (!cancelTarget) return;
    if (cancelReason.trim().length < 5) {
      setCancelError('Please give a reason of at least 5 characters.');
      return;
    }
    setBusy(`${cancelTarget.id}:cancel`);
    setCancelError(null);
    try {
      await cancelBooking(cancelTarget.id, cancelReason.trim());
      success('Booking cancelled', 'Reserved credits are released under the pilot cancellation policy.');
      setCancelTarget(null);
      setCancelReason('');
      refreshWallet();
      query.refresh();
    } catch (error) {
      setCancelError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function submitReview() {
    if (!reviewTarget) return;
    if (comment.trim().length < REVIEW_MIN) {
      setReviewError(`Please write at least ${REVIEW_MIN} characters.`);
      return;
    }
    setBusy(`${reviewTarget.id}:review`);
    setReviewError(null);
    try {
      await createReview({
        booking_id: reviewTarget.id,
        rating,
        comment: comment.trim(),
      });
      success('Review submitted', 'Thanks for helping the next member decide.');
      setReviewTarget(null);
      setComment('');
      setRating(5);
    } catch (error) {
      setReviewError(errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Trips & stays"
        title={
          <>
            Every stay, <span className="italic text-moss">clearly tracked</span>
          </>
        }
        description="Approve requests as a host, manage your own stays as a guest, and review completed trips. Credits move only when the server confirms an allowed transition."
        actions={
          <Link href="/search">
            <Button variant="secondary" leading={<Home className="h-4 w-4" />}>
              Find a stay
            </Button>
          </Link>
        }
      />

      <Tabs
        className="mt-6"
        active={tab}
        onChange={setTab}
        ariaLabel="Filter bookings"
        tabs={[
          { id: 'upcoming', label: 'Upcoming', count: groups.upcoming.length },
          { id: 'guest', label: 'As guest', count: groups.guest.length },
          { id: 'host', label: 'As host', count: groups.host.length },
          { id: 'past', label: 'Past & cancelled', count: groups.past.length },
        ]}
      />

      {query.loading && <LoadingBlock label="Loading your trips" className="py-20" />}

      {!query.loading && query.error && (
        <ErrorState
          className="mt-6"
          title="Trips could not load"
          message={query.error}
          code={query.errorCode}
          onRetry={query.refresh}
        />
      )}

      {!query.loading && !query.error && visible.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<CalendarDays className="h-5 w-5" />}
            title={
              tab === 'host'
                ? 'No hosting activity yet'
                : tab === 'past'
                  ? 'Nothing in the archive'
                  : tab === 'guest'
                    ? 'You have not booked a stay yet'
                    : 'No upcoming trips'
            }
            description={
              tab === 'host'
                ? 'Once your listing is live, credit-stay requests and swap stays will appear here for approval.'
                : 'Search verified homes in Mumbai, Bengaluru, Delhi NCR or Hyderabad, or propose a direct swap with another member.'
            }
            action={
              <Link href={tab === 'host' ? '/listings' : '/search'}>
                <Button>{tab === 'host' ? 'Manage my listings' : 'Explore homes'}</Button>
              </Link>
            }
          />
        </div>
      )}

      {!query.loading && !query.error && visible.length > 0 && (
        <div className="mt-6 space-y-4">
          {visible.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              isHost={booking.host_id === user?.id}
              busy={busy}
              onConfirm={() => void act(booking, 'confirm')}
              onComplete={() => void act(booking, 'complete')}
              onCancel={() => {
                setCancelTarget(booking);
                setCancelReason('');
                setCancelError(null);
              }}
              onReview={() => {
                setReviewTarget(booking);
                setComment('');
                setRating(5);
                setReviewError(null);
              }}
              onReport={() => setReportTarget(booking)}
            />
          ))}
        </div>
      )}

      {/* cancel modal */}
      <Modal
        open={Boolean(cancelTarget)}
        onClose={() => setCancelTarget(null)}
        title="Cancel this booking"
        description={
          cancelTarget
            ? `${formatRange(cancelTarget.check_in, cancelTarget.check_out)} at ${
                cancelTarget.property?.title ?? 'this home'
              }`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)}>
              Keep booking
            </Button>
            <Button
              variant="danger"
              onClick={submitCancel}
              loading={Boolean(busy?.endsWith(':cancel'))}
            >
              Cancel booking
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Textarea
            label="Reason for cancellation"
            placeholder="Tell the other member what changed. This is shared with them."
            value={cancelReason}
            onChange={(event) => setCancelReason(event.target.value)}
            maxLength={500}
            showCount
            error={cancelError ?? undefined}
            required
          />
          <div className="rounded-2xl bg-[#fbf3df] px-3.5 py-3 text-[11.5px] leading-5 text-[#7a5a1c]">
            <p className="font-semibold">What happens to credits?</p>
            <p className="mt-1">
              Reserved credits for a credit stay are released back to the guest under the cancellation
              policy. Direct swaps release both homes once the cancellation is accepted. The server
              records every movement.
            </p>
          </div>
        </div>
      </Modal>

      {/* review modal */}
      <Modal
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        title="Leave a review"
        description={
          reviewTarget
            ? `How was your stay at ${reviewTarget.property?.title ?? 'this home'}?`
            : undefined
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewTarget(null)}>
              Not now
            </Button>
            <Button
              onClick={submitReview}
              loading={Boolean(busy?.endsWith(':review'))}
              leading={<MessageSquareQuote className="h-4 w-4" />}
            >
              Submit review
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="field-label">Rating</p>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  aria-label={`${value} star${value === 1 ? '' : 's'}`}
                  className={cn(
                    'grid h-10 w-10 place-items-center rounded-xl border transition',
                    value <= rating
                      ? 'border-gold-400 bg-[#fbf2dc] text-gold-500'
                      : 'border-sand-300 bg-white text-ink-500/40 hover:text-gold-500',
                  )}
                >
                  <Star className={cn('h-4 w-4', value <= rating && 'fill-current')} />
                </button>
              ))}
            </div>
          </div>
          <Textarea
            label="Your review"
            placeholder="What should the next member know? Mention the home, communication and the neighbourhood."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={2000}
            showCount
            error={reviewError ?? undefined}
            hint={`Minimum ${REVIEW_MIN} characters. Reviews are only accepted for completed stays.`}
            required
          />
        </div>
      </Modal>

      {reportTarget && (
        <ReportModal
          open={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          targetType="booking"
          targetId={reportTarget.id}
          targetLabel={`Booking at ${reportTarget.property?.title ?? 'a SwapStay home'}`}
        />
      )}
    </div>
  );
}

function BookingCard({
  booking,
  isHost,
  busy,
  onConfirm,
  onComplete,
  onCancel,
  onReview,
  onReport,
}: {
  booking: Booking;
  isHost: boolean;
  busy: string | null;
  onConfirm: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onReview: () => void;
  onReport: () => void;
}) {
  const nights = nightsBetween(booking.check_in, booking.check_out);
  const isDirect = booking.booking_type === 'direct_swap';
  const today = todayISO();
  const canConfirm = isHost && booking.booking_status === 'requested';
  const canComplete =
    isHost && booking.booking_status === 'confirmed' && booking.check_out <= today;
  const canCancel =
    (booking.booking_status === 'requested' || booking.booking_status === 'confirmed') &&
    booking.check_out >= today;
  const canReview = !isHost && booking.booking_status === 'completed';

  return (
    <div className="overflow-hidden rounded-3xl border border-sand-200/90 bg-white/90 shadow-soft">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:gap-5">
        <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-sage-50 text-pine ring-1 ring-inset ring-sage-200">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-pine/70">
            {new Date(`${booking.check_in}T00:00:00`).toLocaleDateString('en-IN', { month: 'short' })}
          </span>
          <span className="font-display text-[24px] leading-none">{booking.check_in.slice(8)}</span>
          <span className="mt-0.5 text-[8.5px] uppercase tracking-[0.1em] text-pine/60">
            {nights} {nights === 1 ? 'night' : 'nights'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.booking_status} />
            {isDirect ? (
              <Badge tone="sky" dot>
                <Repeat2 className="h-3 w-3" /> Direct swap
              </Badge>
            ) : (
              <Badge tone="gold" dot>
                <Coins className="h-3 w-3" /> Credit stay
              </Badge>
            )}
            <span className="text-[10.5px] text-ink-500">
              {isHost ? 'Guest booking' : 'Your stay'}
            </span>
          </div>

          <h3 className="mt-2 text-[17px] leading-snug text-ink-900">
            {booking.property?.title ?? 'SwapStay home'}
          </h3>
          <p className="mt-0.5 text-[11.5px] text-ink-500">
            {booking.property?.neighbourhood ? `${booking.property.neighbourhood}, ` : ''}
            {booking.property?.city ?? 'India'}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11.5px] text-ink-600">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-ink-500" /> {formatRange(booking.check_in, booking.check_out)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              {isDirect ? (
                <>
                  <Repeat2 className="h-3.5 w-3.5 text-ink-500" /> No credits — mutual swap
                </>
              ) : (
                <>
                  <Coins className="h-3.5 w-3.5 text-ink-500" /> {booking.credit_price}{' '}
                  {booking.credit_price === 1 ? 'credit' : 'credits'}
                </>
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserRound className="h-3.5 w-3.5 text-ink-500" />
              {isHost
                ? `Guest: ${booking.guest?.display_name ?? 'member'}`
                : `Host: ${booking.host?.display_name ?? 'member'}`}
            </span>
          </div>

          {booking.booking_status === 'requested' && (
            <p className="mt-3 rounded-xl bg-[#fbf3df] px-3 py-2 text-[11px] leading-5 text-[#7a5a1c]">
              {isHost
                ? 'This guest is waiting for your approval. Check the dates and house rules before confirming.'
                : 'The host has been notified. Your credits are reserved while the request is pending.'}
            </p>
          )}
          {booking.booking_status === 'confirmed' && canComplete && (
            <p className="mt-3 rounded-xl bg-sage-50 px-3 py-2 text-[11px] leading-5 text-pine">
              Mark this stay complete after checkout to settle credits and unlock reviews.
            </p>
          )}
          {booking.booking_status === 'confirmed' && isHost && !canComplete && (
            <p className="mt-3 rounded-xl bg-sand-50 px-3 py-2 text-[11px] leading-5 text-ink-500">
              Completion unlocks after check-out on {formatDate(booking.check_out)}.
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:max-w-[190px] sm:justify-end">
          {canConfirm && (
            <Button size="sm" onClick={onConfirm} loading={busy === `${booking.id}:confirm`} leading={<Check className="h-3.5 w-3.5" />}>
              Confirm
            </Button>
          )}
          {canComplete && (
            <Button
              size="sm"
              onClick={onComplete}
              loading={busy === `${booking.id}:complete`}
              leading={<CheckCircle2 className="h-3.5 w-3.5" />}
            >
              Complete stay
            </Button>
          )}
          {canReview && (
            <Button size="sm" variant="secondary" onClick={onReview} leading={<Star className="h-3.5 w-3.5" />}>
              Review
            </Button>
          )}
          {canCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel} leading={<XCircle className="h-3.5 w-3.5" />}>
              Cancel
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onReport} leading={<Flag className="h-3.5 w-3.5" />}>
            Report
          </Button>
          {booking.property?.id && (
            <Link href={`/properties/${booking.property.id}`}>
              <Button size="sm" variant="ghost" leading={<KeyRound className="h-3.5 w-3.5" />}>
                Home
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BookingsPage() {
  return (
    <RequireAuth>
      <BookingsContent />
    </RequireAuth>
  );
}
