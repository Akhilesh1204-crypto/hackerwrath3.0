'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Coins, Info, ShieldCheck } from 'lucide-react';
import type { PropertyDetail } from '@/lib/types';
import { createBooking, getWallet } from '@/lib/api';
import { errorMessage } from '@/lib/api/client';
import { CANCELLATION_POLICY, CREDIT_PER_NIGHT } from '@/lib/constants';
import { formatRange, nightsBetween, nightsLabel, todayISO } from '@/lib/dates';
import { uuid } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

export function BookingRequestModal({
  open,
  onClose,
  property,
  checkIn,
  checkOut,
}: {
  open: boolean;
  onClose: () => void;
  property: PropertyDetail;
  checkIn: string;
  checkOut: string;
}) {
  const { success, error: toastError } = useToast();
  const [wallet, setWallet] = useState<{ available_balance: number } | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationId, setConfirmationId] = useState<string | null>(null);
  const idempotencyKey = useRef(uuid());

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const cost = nights * CREDIT_PER_NIGHT;
  const insufficient = wallet !== null && wallet.available_balance < cost;

  useEffect(() => {
    if (!open) return;
    setAccepted(false);
    setError(null);
    setConfirmationId(null);
    idempotencyKey.current = uuid();
    let alive = true;
    getWallet()
      .then((next) => {
        if (alive) setWallet(next);
      })
      .catch(() => {
        if (alive) setWallet(null);
      });
    return () => {
      alive = false;
    };
  }, [open]);

  async function submit() {
    if (!accepted) {
      setError('Please confirm you understand how credits and cancellation work.');
      return;
    }
    if (checkIn < todayISO()) {
      setError('Check-in cannot be in the past.');
      return;
    }
    if (nights <= 0) {
      setError('Choose valid dates before requesting.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const result = await createBooking({
        property_id: property.id,
        check_in: checkIn,
        check_out: checkOut,
        idempotency_key: idempotencyKey.current,
      });
      setConfirmationId(result.booking.id);
      success('Stay requested', `${nightsLabel(nights)} at ${property.title}. The host will review it shortly.`);
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('swapstay:wallet'));
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toastError('Request not sent', message);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationId) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="Request sent"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={onClose}>
              Keep browsing
            </Button>
            <Link href="/bookings">
              <Button>View my trips</Button>
            </Link>
          </>
        }
      >
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage-100 text-moss">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-xl">{property.title}</h3>
          <p className="mt-1.5 text-[13px] leading-6 text-ink-500">
            {formatRange(checkIn, checkOut)} · {nightsLabel(nights)} · {cost}{' '}
            {cost === 1 ? 'credit' : 'credits'} held in reserve.
          </p>
          <p className="mx-auto mt-3 max-w-sm rounded-xl bg-sand-100/80 px-3 py-2 text-[11.5px] leading-5 text-ink-600">
            The host has been notified. Your credits stay reserved while the request is pending and are
            released if it is declined or cancelled under policy.
          </p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request this stay"
      description="Review the dates, credit cost and cancellation terms before sending a request."
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={submit} loading={submitting} disabled={insufficient}>
            Send request · {cost} {cost === 1 ? 'credit' : 'credits'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-sand-200 bg-white/80 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">Home</p>
              <p className="mt-1 text-[14px] font-medium text-ink-900">{property.title}</p>
              <p className="text-[12px] text-ink-500">
                {property.neighbourhood}, {property.city} · hosted by{' '}
                {property.owner?.display_name ?? 'a SwapStay member'}
              </p>
            </div>
            <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-pine">
              {cost} credits
            </span>
          </div>
          <dl className="mt-3 grid gap-2 border-t border-sand-200/70 pt-3 text-[12px] sm:grid-cols-2">
            <div>
              <dt className="text-ink-500">Dates</dt>
              <dd className="font-medium text-ink-800">{formatRange(checkIn, checkOut)}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Duration</dt>
              <dd className="font-medium text-ink-800">{nightsLabel(nights)}</dd>
            </div>
            <div>
              <dt className="text-ink-500">Credit cost</dt>
              <dd className="font-medium text-ink-800">
                {cost} {cost === 1 ? 'credit' : 'credits'} (1 per night)
              </dd>
            </div>
            <div>
              <dt className="text-ink-500">Your available balance</dt>
              <dd className="font-medium text-ink-800">
                {wallet === null ? 'Checking…' : `${wallet.available_balance} credits`}
              </dd>
            </div>
          </dl>
        </div>

        {insufficient && (
          <div className="rounded-2xl border border-[#e6cf9d] bg-[#fbf3df] p-4">
            <p className="flex items-center gap-2 text-[12.5px] font-semibold text-[#7a5a1c]">
              <Coins className="h-4 w-4" /> You need {cost - (wallet?.available_balance ?? 0)} more credits
            </p>
            <p className="mt-1 text-[11.5px] leading-5 text-[#8a6a2a]">
              Host an eligible night to earn credits, or choose a shorter stay. The server will not allow
              a request above your available balance.
            </p>
            <Link href="/wallet" className="mt-2 inline-block text-[11.5px] font-semibold text-[#7a5a1c] link-underline">
              Open my wallet
            </Link>
          </div>
        )}

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Cancellation & credits
          </p>
          <ul className="mt-2 space-y-1.5">
            {CANCELLATION_POLICY.map((line) => (
              <li key={line} className="flex gap-2 text-[11.5px] leading-5 text-ink-600">
                <Info className="mt-0.5 h-3 w-3 shrink-0 text-ink-500" />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-sand-200 bg-sand-50/70 p-3.5">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-sand-300 text-pine focus:ring-moss"
          />
          <span className="text-[11.5px] leading-5 text-ink-600">
            I understand that {cost} {cost === 1 ? 'credit' : 'credits'} will be reserved now, that the host
            must approve the stay, and that cancellation follows the policy above. Credits have no cash
            value.
          </span>
        </label>

        {error && (
          <p className="rounded-xl border border-[#e3bdb4] bg-[#fdf4f2] px-3 py-2 text-[12px] leading-5 text-[#8d3527]" role="alert">
            {error}
          </p>
        )}

        <p className="flex items-center gap-1.5 text-[10.5px] text-ink-500">
          <ShieldCheck className="h-3.5 w-3.5 text-moss" />
          Availability and balance are rechecked by the server before anything is confirmed.
        </p>
      </div>
    </Modal>
  );
}
