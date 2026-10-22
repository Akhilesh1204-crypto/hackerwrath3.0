'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  Flag,
  Home,
  MapPin,
  Repeat2,
  ShieldCheck,
  X,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/components/auth/AuthProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { ReportModal } from '@/components/modals/ReportModal';
import { Badge, SwapStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Input';
import { EmptyState, ErrorState, InfoRow, LoadingBlock, Tabs } from '@/components/ui/Primitives';
import { useToast } from '@/components/ui/Toast';
import { acceptSwap, declineSwap, getSwaps, respondToCreditTerms } from '@/lib/api';
import { errorMessage } from '@/lib/api/client';
import { formatRange, formatDate, nightsBetween, relativeTime } from '@/lib/dates';
import { useApiQuery } from '@/lib/hooks';
import type { SwapRequest } from '@/lib/types';

function SwapsContent() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const query = useApiQuery(() => getSwaps(), []);
  const swaps = query.data ?? [];

  const [tab, setTab] = useState('incoming');
  const [acceptTarget, setAcceptTarget] = useState<SwapRequest | null>(null);
  const [declineTarget, setDeclineTarget] = useState<SwapRequest | null>(null);
  const [agreementTarget, setAgreementTarget] = useState<SwapRequest | null>(null);
  const [reportTarget, setReportTarget] = useState<{ id: string; name: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [creditNote, setCreditNote] = useState('');

  const groups = useMemo(() => {
    const active = swaps.filter(
      (swap) =>
        swap.request_status === 'pending' ||
        swap.request_status === 'requester_accepted' ||
        swap.request_status === 'recipient_accepted',
    );
    const incoming = active.filter((swap) => swap.recipient_id === user?.id);
    const outgoing = active.filter((swap) => swap.requester_id === user?.id);
    const confirmed = swaps.filter((swap) => swap.request_status === 'confirmed');
    const closed = swaps.filter(
      (swap) => swap.request_status === 'declined' || swap.request_status === 'cancelled',
    );
    return { incoming, outgoing, confirmed, closed };
  }, [swaps, user?.id]);

  const visible =
    tab === 'incoming'
      ? groups.incoming
      : tab === 'outgoing'
        ? groups.outgoing
        : tab === 'confirmed'
          ? groups.confirmed
          : groups.closed;

  async function accept() {
    if (!acceptTarget) return;
    setBusy(`${acceptTarget.id}:accept`);
    try {
      const result = await acceptSwap(acceptTarget.id);
      success(
        'Swap confirmed',
        'Both homes are now reserved for the agreed dates. The agreement is stored with the swap.',
      );
      setAcceptTarget(null);
      query.refresh();
      if (result?.swap) {
        window.dispatchEvent(new Event('swapstay:wallet'));
      }
    } catch (error) {
      toastError('Swap not confirmed', errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function respondCreditTerms(action: 'counter' | 'decline' | 'return_stay') {
    if (!acceptTarget) return;
    if ((action === 'counter' || action === 'return_stay') && !creditNote.trim()) {
      toastError('Add a note', 'Explain the counter-offer or return-stay request first.');
      return;
    }
    setBusy(`${acceptTarget.id}:credit-terms`);
    try {
      await respondToCreditTerms(acceptTarget.id, { action, note: creditNote.trim() || undefined });
      success(
        action === 'decline' ? 'Credit terms declined' : action === 'counter' ? 'Counter-offer sent' : 'Return stay requested',
        'The other member has been notified. No credits or dates were reserved.',
      );
      setAcceptTarget(null);
      setCreditNote('');
      query.refresh();
    } catch (error) {
      toastError('Credit terms not updated', errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  async function decline() {
    if (!declineTarget) return;
    setBusy(`${declineTarget.id}:decline`);
    try {
      await declineSwap(declineTarget.id);
      success('Swap declined', 'The other member has been told. No dates or credits were reserved.');
      setDeclineTarget(null);
      query.refresh();
    } catch (error) {
      toastError('Swap not declined', errorMessage(error));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Direct swaps"
        title={
          <>
            Trade homes, <span className="italic text-moss">on your terms</span>
          </>
        }
        description="A direct swap reserves both homes for agreed dates and costs no credits. Both members must accept the same terms before anything is confirmed."
        actions={
          <Link href="/search">
            <Button variant="secondary" leading={<Repeat2 className="h-4 w-4" />}>
              Find a swap
            </Button>
          </Link>
        }
      />

      <Tabs
        className="mt-6"
        active={tab}
        onChange={setTab}
        ariaLabel="Filter swaps"
        tabs={[
          { id: 'incoming', label: 'Incoming', count: groups.incoming.length },
          { id: 'outgoing', label: 'Outgoing', count: groups.outgoing.length },
          { id: 'confirmed', label: 'Confirmed', count: groups.confirmed.length },
          { id: 'closed', label: 'Closed', count: groups.closed.length },
        ]}
      />

      {query.loading && <LoadingBlock label="Loading swap proposals" className="py-20" />}

      {!query.loading && query.error && (
        <ErrorState
          className="mt-6"
          title="Swaps could not load"
          message={query.error}
          code={query.errorCode}
          onRetry={query.refresh}
        />
      )}

      {!query.loading && !query.error && visible.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<Repeat2 className="h-5 w-5" />}
            title={
              tab === 'incoming'
                ? 'No incoming proposals'
                : tab === 'outgoing'
                  ? 'No proposals sent yet'
                  : tab === 'confirmed'
                    ? 'No confirmed swaps'
                    : 'Nothing closed yet'
            }
            description={
              tab === 'outgoing'
                ? 'Open a home you like and choose “Propose a direct swap”. You will pick one of your active listings and the dates for both sides.'
                : 'Direct swaps appear here when a member proposes dates across both homes. You can accept or decline without moving credits.'
            }
            action={
              <Link href="/search">
                <Button>Browse homes</Button>
              </Link>
            }
          />
        </div>
      )}

      {!query.loading && !query.error && visible.length > 0 && (
        <div className="mt-6 space-y-4">
          {visible.map((swap) => (
            <SwapCard
              key={swap.id}
              swap={swap}
              userId={user?.id}
              busy={busy}
              onAccept={() => setAcceptTarget(swap)}
              onDecline={() => setDeclineTarget(swap)}
              onAgreement={() => setAgreementTarget(swap)}
              onReport={() => {
                const other =
                  swap.requester_id === user?.id ? swap.recipient : swap.requester;
                if (other) setReportTarget({ id: other.id, name: other.display_name });
              }}
            />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-start gap-2.5 rounded-2xl border border-sand-200 bg-white/60 px-4 py-3 text-[11px] leading-5 text-ink-500">
        <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
        Availability, ownership and date conflicts are rechecked by the server when the second member accepts.
        A swap is not a booking until that check passes.
      </div>

      {/* accept modal */}
      <Modal
        open={Boolean(acceptTarget)}
        onClose={() => setAcceptTarget(null)}
        title="Confirm this swap"
        description="Accepting reserves both homes for the dates below. Please check them carefully."
        footer={
          <>
            <Button variant="secondary" onClick={() => setAcceptTarget(null)}>
              Not yet
            </Button>
            {acceptTarget && (acceptTarget.credit_difference ?? 0) > 0 && acceptTarget.credit_recipient_id === user?.id && (
              <>
                <Button variant="ghost" onClick={() => void respondCreditTerms('decline')} loading={busy?.endsWith(':credit-terms')}>
                  Decline credits
                </Button>
                <Button variant="secondary" onClick={() => void respondCreditTerms('return_stay')} loading={busy?.endsWith(':credit-terms')}>
                  Ask for return stay
                </Button>
                <Button variant="secondary" onClick={() => void respondCreditTerms('counter')} loading={busy?.endsWith(':credit-terms')}>
                  Counter
                </Button>
              </>
            )}
            <Button
              onClick={accept}
              loading={Boolean(busy?.endsWith(':accept'))}
              leading={<Check className="h-4 w-4" />}
            >
              Accept swap
            </Button>
          </>
        }
      >
        {acceptTarget && (
          <>
            <SwapTerms swap={acceptTarget} userId={user?.id} />
            {(acceptTarget.credit_difference ?? 0) > 0 && acceptTarget.credit_recipient_id === user?.id && (
              <Textarea
                label="Counter or return-stay note"
                value={creditNote}
                onChange={(event) => setCreditNote(event.target.value)}
                placeholder="Explain what would make the exchange work for you."
                maxLength={500}
                rows={3}
              />
            )}
          </>
        )}
      </Modal>

      {/* decline modal */}
      <Modal
        open={Boolean(declineTarget)}
        onClose={() => setDeclineTarget(null)}
        title="Decline this proposal?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeclineTarget(null)}>
              Keep it open
            </Button>
            <Button
              variant="danger"
              onClick={decline}
              loading={Boolean(busy?.endsWith(':decline'))}
              leading={<X className="h-4 w-4" />}
            >
              Decline
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-6 text-ink-600">
          The proposal will close and neither home will be reserved. You can always send a new proposal
          with different dates. Declining does not affect your verification or credits.
        </p>
      </Modal>

      {/* agreement modal */}
      <Modal
        open={Boolean(agreementTarget)}
        onClose={() => setAgreementTarget(null)}
        title="Swap agreement"
        description="The stored terms snapshot both members accepted."
        size="md"
      >
        {agreementTarget && <AgreementDetails swap={agreementTarget} userId={user?.id} />}
      </Modal>

      {reportTarget && (
        <ReportModal
          open={Boolean(reportTarget)}
          onClose={() => setReportTarget(null)}
          targetType="user"
          targetId={reportTarget.id}
          targetLabel={reportTarget.name}
        />
      )}
    </div>
  );
}

function SwapCard({
  swap,
  userId,
  busy,
  onAccept,
  onDecline,
  onAgreement,
  onReport,
}: {
  swap: SwapRequest;
  userId?: string;
  busy: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onAgreement: () => void;
  onReport: () => void;
}) {
  const isRecipient = swap.recipient_id === userId;
  const isRequester = swap.requester_id === userId;
  const incoming = isRecipient;
  const canRespond =
    isRecipient &&
    (swap.request_status === 'pending' || swap.request_status === 'requester_accepted');
  const canWithdraw =
    isRequester && (swap.request_status === 'pending' || swap.request_status === 'requester_accepted');
  const confirmed = swap.request_status === 'confirmed';

  const myHome = isRecipient ? swap.recipient_property : swap.requester_property;
  const theirHome = isRecipient ? swap.requester_property : swap.recipient_property;
  const myStay = isRecipient
    ? { checkIn: swap.recipient_check_in, checkOut: swap.recipient_check_out }
    : { checkIn: swap.requester_check_in, checkOut: swap.requester_check_out };
  const theirStay = isRecipient
    ? { checkIn: swap.requester_check_in, checkOut: swap.requester_check_out }
    : { checkIn: swap.recipient_check_in, checkOut: swap.recipient_check_out };

  return (
    <div className="overflow-hidden rounded-3xl border border-sand-200/90 bg-white/90 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand-200/70 px-5 py-3.5">
        <div className="flex flex-wrap items-center gap-2">
          <SwapStatusBadge status={swap.request_status} />
          <Badge tone="outline">
            {confirmed ? 'Confirmed swap' : incoming ? 'Incoming proposal' : 'Your proposal'}
          </Badge>
          <span className="text-[10.5px] text-ink-500">Sent {relativeTime(swap.created_at)}</span>
        </div>
        <span className="text-[10.5px] text-ink-500">
          With {incoming ? swap.requester?.display_name : swap.recipient?.display_name}
        </span>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
        <SwapLeg
          label="You stay at their home"
          title={theirHome?.title ?? 'Their home'}
          city={theirHome?.city}
          checkIn={myStay.checkIn}
          checkOut={myStay.checkOut}
        />

        <div className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-sand-100 text-ink-500">
          <ArrowLeftRight className="h-4 w-4" />
        </div>

        <SwapLeg
          label="They stay at your home"
          title={myHome?.title ?? 'Your home'}
          city={myHome?.city}
          checkIn={theirStay.checkIn}
          checkOut={theirStay.checkOut}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sand-200/70 bg-sand-50/60 px-5 py-3">
        <p className="text-[10.5px] text-ink-500">
          {(swap.credit_difference ?? 0) > 0
            ? `${swap.credit_difference} credit${swap.credit_difference === 1 ? '' : 's'} reserved after both members opt in; paid after the longer stay.`
            : 'Equal-night swap · no credits move'}
        </p>
        <div className="flex flex-wrap gap-2">
          {confirmed && (
            <Button size="sm" variant="secondary" onClick={onAgreement} leading={<FileText className="h-3.5 w-3.5" />}>
              View agreement
            </Button>
          )}
          {canRespond && (
            <>
              <Button size="sm" variant="ghost" onClick={onDecline}>
                Decline
              </Button>
              <Button size="sm" onClick={onAccept} loading={busy === `${swap.id}:accept`} leading={<Check className="h-3.5 w-3.5" />}>
                Accept swap
              </Button>
            </>
          )}
          {canWithdraw && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onDecline}
              loading={busy === `${swap.id}:decline`}
              leading={<X className="h-3.5 w-3.5" />}
            >
              Withdraw
            </Button>
          )}
          {!confirmed && (
            <Button size="sm" variant="ghost" onClick={onReport} leading={<Flag className="h-3.5 w-3.5" />}>
              Report
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function SwapLeg({
  label,
  title,
  city,
  checkIn,
  checkOut,
}: {
  label: string;
  title: string;
  city?: string;
  checkIn: string;
  checkOut: string;
}) {
  const nights = nightsBetween(checkIn, checkOut);
  return (
    <div className="rounded-2xl bg-sand-50/80 p-4 ring-1 ring-inset ring-sand-200/70">
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">{label}</p>
      <p className="mt-1 text-[14px] font-medium leading-snug text-ink-900">{title}</p>
      <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-500">
        <MapPin className="h-3 w-3" /> {city ?? 'India'}
      </p>
      <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-ink-700">
        <CalendarDays className="h-3.5 w-3.5 text-ink-500" /> {formatRange(checkIn, checkOut)}
      </p>
      <p className="mt-0.5 text-[10.5px] text-ink-500">
        {nights} {nights === 1 ? 'night' : 'nights'}
      </p>
    </div>
  );
}

function SwapTerms({ swap, userId }: { swap: SwapRequest; userId?: string }) {
  const isRecipient = swap.recipient_id === userId;
  const myStay = isRecipient
    ? {
        property: swap.requester_property,
        checkIn: swap.recipient_check_in,
        checkOut: swap.recipient_check_out,
      }
    : {
        property: swap.recipient_property,
        checkIn: swap.requester_check_in,
        checkOut: swap.requester_check_out,
      };
  const theirStay = isRecipient
    ? {
        property: swap.recipient_property,
        checkIn: swap.requester_check_in,
        checkOut: swap.requester_check_out,
      }
    : {
        property: swap.requester_property,
        checkIn: swap.recipient_check_in,
        checkOut: swap.recipient_check_out,
      };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-sand-200 bg-white/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          You stay at their home
        </p>
        <p className="mt-1 text-[15px] font-medium text-ink-900">
          {myStay.property?.title ?? 'Their home'}
        </p>
        <p className="mt-1 text-[12px] text-ink-600">
          {formatRange(myStay.checkIn, myStay.checkOut)}
        </p>
      </div>
      <div className="rounded-2xl border border-sand-200 bg-white/80 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          They stay at your home
        </p>
        <p className="mt-1 text-[15px] font-medium text-ink-900">
          {theirStay.property?.title ?? 'Your home'}
        </p>
        <p className="mt-1 text-[12px] text-ink-600">
          {formatRange(theirStay.checkIn, theirStay.checkOut)}
        </p>
      </div>
      {(swap.credit_difference ?? 0) > 0 ? (
        <p className="rounded-xl border border-[#e6cf9d] bg-[#fbf3df] px-3 py-2.5 text-[11px] leading-5 text-[#7a5a1c]">
          Unequal swap: {swap.credit_difference} credit{swap.credit_difference === 1 ? '' : 's'} move from the
          longer-stay member to the host of the longer stay. Credits are reserved on confirmation and paid after
          checkout. Terms status: {swap.credit_terms_status ?? 'pending'}.
        </p>
      ) : (
        <p className="rounded-xl bg-sage-50 px-3 py-2.5 text-[11px] leading-5 text-pine">
          No credits change hands. Confirming creates two linked direct-swap bookings and stores the exact
          terms both members accepted.
        </p>
      )}
    </div>
  );
}

function AgreementDetails({ swap, userId }: { swap: SwapRequest; userId?: string }) {
  const agreement = swap.swap_agreements?.[0];
  const snapshot = agreement?.terms_snapshot;
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-sage-200 bg-sage-50 p-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-moss shadow-sm">
          <FileText className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[13px] font-semibold text-pine">Mutual agreement recorded</p>
          <p className="mt-0.5 text-[11px] leading-5 text-pine/80">
            Version {agreement?.agreement_version ?? snapshot?.version ?? '1.0'} · confirmed{' '}
            {agreement?.confirmed_at ? formatDate(agreement.confirmed_at.slice(0, 10)) : '—'}
          </p>
        </div>
      </div>

      <dl className="divide-hairline rounded-2xl border border-sand-200 bg-white/80 px-4 py-1">
        <InfoRow
          label={swap.requester_id === userId ? 'Your stay' : 'Requester stay'}
          value={
            snapshot
              ? `${formatRange(snapshot.requester_stay.check_in, snapshot.requester_stay.check_out)}`
              : formatRange(swap.requester_check_in, swap.requester_check_out)
          }
        />
        <InfoRow
          label={swap.recipient_id === userId ? 'Your stay' : 'Recipient stay'}
          value={
            snapshot
              ? `${formatRange(snapshot.recipient_stay.check_in, snapshot.recipient_stay.check_out)}`
              : formatRange(swap.recipient_check_in, swap.recipient_check_out)
          }
        />
        <InfoRow
          label="Requester accepted"
          value={
            agreement?.requester_accepted_at
              ? formatDate(agreement.requester_accepted_at.slice(0, 10))
              : swap.requester_accepted_at
                ? formatDate(swap.requester_accepted_at.slice(0, 10))
                : '—'
          }
        />
        <InfoRow
          label="Recipient accepted"
          value={
            agreement?.recipient_accepted_at
              ? formatDate(agreement.recipient_accepted_at.slice(0, 10))
              : swap.recipient_accepted_at
                ? formatDate(swap.recipient_accepted_at.slice(0, 10))
                : '—'
          }
        />
      </dl>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-sand-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            {swap.requester_property?.title}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-600">
            <Home className="h-3.5 w-3.5" /> {swap.requester_property?.city}
          </p>
          <p className="mt-2 text-[11px] text-ink-500">
            Hosted by {swap.requester?.display_name}
          </p>
        </div>
        <div className="rounded-2xl bg-sand-50 p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
            {swap.recipient_property?.title}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-600">
            <Home className="h-3.5 w-3.5" /> {swap.recipient_property?.city}
          </p>
          <p className="mt-2 text-[11px] text-ink-500">
            Hosted by {swap.recipient?.display_name}
          </p>
        </div>
      </div>

      <p className="text-[10.5px] leading-5 text-ink-500">
        Dates and terms are locked in this snapshot. Any later change requires a new proposal and fresh
        mutual consent. Exact addresses are released separately on confirmation.
      </p>

      <div className="flex items-center gap-1.5 text-[10.5px] text-ink-500">
        <ArrowRight className="h-3 w-3" /> Review the linked booking in Trips for address and arrival details.
      </div>
    </div>
  );
}

export default function SwapsPage() {
  return (
    <RequireAuth>
      <SwapsContent />
    </RequireAuth>
  );
}
