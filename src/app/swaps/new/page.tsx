'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowLeftRight,
  BedDouble,
  CalendarDays,
  Check,
  Coins,
  Home,
  Info,
  MapPin,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { PropertyImage } from '@/components/property/PropertyImage';
import { Badge, VerificationBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { EmptyState, ErrorState, LoadingBlock, ScoreRing } from '@/components/ui/Primitives';
import { useToast } from '@/components/ui/Toast';
import { createSwap, getMyProperties, getProperty } from '@/lib/api';
import { errorMessage } from '@/lib/api/client';
import { PROPERTY_TYPE_LABELS } from '@/lib/constants';
import { addDaysISO, formatRange, nightsBetween, todayISO } from '@/lib/dates';
import { useApiQuery } from '@/lib/hooks';

function NewSwapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipientId = searchParams.get('recipient') ?? '';
  const { success, error: toastError } = useToast();

  const today = todayISO();
  const mine = useApiQuery(() => getMyProperties(), []);
  const recipientQuery = useApiQuery(() => getProperty(recipientId), [recipientId], {
    enabled: Boolean(recipientId),
  });

  const [selectedId, setSelectedId] = useState('');
  const [yourCheckIn, setYourCheckIn] = useState(addDaysISO(today, 14));
  const [yourCheckOut, setYourCheckOut] = useState(addDaysISO(today, 16));
  const [theirCheckIn, setTheirCheckIn] = useState(addDaysISO(today, 18));
  const [theirCheckOut, setTheirCheckOut] = useState(addDaysISO(today, 20));
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const activeMine = useMemo(
    () => (mine.data ?? []).filter((property) => property.listing_status === 'active'),
    [mine.data],
  );
  const pendingMine = useMemo(
    () => (mine.data ?? []).filter((property) => property.listing_status !== 'active'),
    [mine.data],
  );
  const selected =
    activeMine.find((property) => property.id === selectedId) ?? activeMine[0] ?? null;
  const recipient = recipientQuery.data;

  const yourNights = nightsBetween(yourCheckIn, yourCheckOut);
  const theirNights = nightsBetween(theirCheckIn, theirCheckOut);

  function validate(): string | null {
    if (!selected) return 'Choose one of your active homes to offer.';
    if (!recipient) return 'The home you want to swap into could not be loaded.';
    if (!yourCheckIn || !yourCheckOut || yourCheckOut <= yourCheckIn)
      return 'Choose a valid stay at their home. Check-out must be after check-in.';
    if (!theirCheckIn || !theirCheckOut || theirCheckOut <= theirCheckIn)
      return 'Choose a valid stay at your home. Check-out must be after check-in.';
    if (yourCheckIn < today || theirCheckIn < today) return 'Dates cannot be in the past.';
    if (!agreed) return 'Please confirm that you understand how a direct swap works.';
    return null;
  }

  async function submit() {
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    if (!selected || !recipient) return;
    setSubmitting(true);
    setFormError(null);
    try {
      await createSwap({
        requester_property_id: selected.id,
        recipient_property_id: recipient.id,
        requester_check_in: yourCheckIn,
        requester_check_out: yourCheckOut,
        recipient_check_in: theirCheckIn,
        recipient_check_out: theirCheckOut,
      });
      success(
        'Proposal sent',
        `${recipient.owner?.display_name ?? 'The host'} can now accept or decline. No dates are held until they accept.`,
      );
      router.push('/swaps');
    } catch (error) {
      const message = errorMessage(error);
      setFormError(message);
      toastError('Proposal not sent', message);
    } finally {
      setSubmitting(false);
    }
  }

  if (!recipientId) {
    return (
      <div className="container-page py-10 sm:py-14">
        <PageHeader
          eyebrow="Direct swaps"
          title={
            <>
              Start with a home you <span className="italic text-moss">love</span>
            </>
          }
          description="A direct swap is proposed from the home you want to stay in. Browse verified homes, open one, and choose “Propose a direct swap”."
        />
        <div className="mt-8">
          <EmptyState
            icon={<Repeat2 className="h-5 w-5" />}
            title="Pick the home you want to swap into"
            description="You will then choose one of your active listings and set a stay for each side. Both members must accept the same dates."
            action={
              <Link href="/search">
                <Button leading={<Home className="h-4 w-4" />}>Browse homes</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  if (mine.loading || recipientQuery.loading) {
    return <LoadingBlock label="Preparing your swap" className="py-24" />;
  }

  if (recipientQuery.error || !recipient) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="That home is not available"
          message={recipientQuery.error ?? 'This listing could not be found or is no longer active.'}
          code={recipientQuery.errorCode}
          onRetry={recipientQuery.refresh}
        />
        <div className="mt-6 text-center">
          <Link href="/search" className="text-sm font-medium text-pine link-underline">
            Browse other homes
          </Link>
        </div>
      </div>
    );
  }

  if (recipient.listing_status !== 'active') {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="This home is not accepting swaps"
          message="Only active listings can be part of a direct swap. The host may still be in review or may have paused the listing."
        />
        <div className="mt-6 text-center">
          <Link href="/search" className="text-sm font-medium text-pine link-underline">
            Browse active homes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <Link
        href={`/properties/${recipient.id}`}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to the home
      </Link>

      <PageHeader
        className="mt-3"
        eyebrow="Direct swap"
        title={
          <>
            Propose a swap with <span className="italic text-moss">{recipient.owner?.display_name ?? 'this host'}</span>
          </>
        }
        description="Set the two stays, check the comparison, then send one proposal. No credits change hands and nothing is reserved until the other member accepts."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.55fr_1fr]">
        <div className="space-y-6">
          {/* recipient */}
          <section className="overflow-hidden rounded-3xl border border-sand-200/90 bg-white/90 shadow-soft">
            <div className="relative aspect-[16/9] sm:aspect-[21/9]">
              <PropertyImage
                photos={(recipient.property_photos ?? [])
                  .slice()
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((photo) => photo.storage_path)}
                city={recipient.city}
                title={recipient.title}
              />
              <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                <Badge tone="ink" dot>
                  Their home
                </Badge>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-500">
                    {recipient.neighbourhood}, {recipient.city}
                  </p>
                  <h2 className="mt-1 text-[20px] leading-snug">{recipient.title}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-500">
                    <span className="inline-flex items-center gap-1">
                      <BedDouble className="h-3.5 w-3.5" /> {recipient.bedrooms} bed
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" /> up to {recipient.guest_capacity}
                    </span>
                    <span>{PROPERTY_TYPE_LABELS[recipient.property_type] ?? recipient.property_type}</span>
                  </div>
                  {recipient.owner && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="text-[12px] font-medium text-ink-800">
                        {recipient.owner.display_name}
                      </span>
                      <VerificationBadge status={recipient.owner.verification_status} />
                    </div>
                  )}
                </div>
                <ScoreRing
                  score={recipient.property_scores?.[0]?.total_score}
                  grade={recipient.property_scores?.[0]?.grade}
                  size={58}
                />
              </div>
            </div>
          </section>

          {/* choose own property */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sage-100 text-pine">
                <Home className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[18px] leading-tight">Choose your home</h2>
                <p className="text-[11.5px] text-ink-500">
                  Only active listings can be offered. Pending or inactive homes stay hidden.
                </p>
              </div>
            </div>

            {activeMine.length === 0 ? (
              <div className="mt-4">
                <EmptyState
                  icon={<Home className="h-5 w-5" />}
                  title="No active listing to swap"
                  description={
                    pendingMine.length > 0
                      ? 'Your listing is still in review. Once it is active you can use it in a direct swap.'
                      : 'Add and activate a home so another member has somewhere to stay in return.'
                  }
                  action={
                    <Link href={pendingMine.length > 0 ? '/listings' : '/properties/new'}>
                      <Button>{pendingMine.length > 0 ? 'Manage my listings' : 'List my home'}</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {activeMine.map((property) => {
                  const isSelected = selected?.id === property.id;
                  const score = property.property_scores?.[0];
                  return (
                    <button
                      key={property.id}
                      type="button"
                      onClick={() => setSelectedId(property.id)}
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        isSelected
                          ? 'border-pine bg-sage-50/70 shadow-[0_0_0_1px_rgba(31,111,92,0.25)]'
                          : 'border-sand-200 bg-white hover:border-moss/40'
                      }`}
                    >
                      <div className="flex items-start gap-3 p-3">
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                          <PropertyImage
                            photos={(property.property_photos ?? [])
                              .slice()
                              .sort((a, b) => a.display_order - b.display_order)
                              .map((photo) => photo.storage_path)}
                            city={property.city}
                            title={property.title}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-[10px] uppercase tracking-[0.1em] text-ink-500">
                              {property.neighbourhood}
                            </p>
                            <span
                              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                                isSelected
                                  ? 'border-pine bg-pine text-sand-50'
                                  : 'border-sand-300 bg-white text-transparent'
                              }`}
                              aria-hidden
                            >
                              <Check className="h-3 w-3" />
                            </span>
                          </div>
                          <p className="mt-0.5 line-clamp-2 text-[12.5px] font-medium leading-snug text-ink-900">
                            {property.title}
                          </p>
                          <p className="mt-1 text-[10.5px] text-ink-500">
                            {property.bedrooms} bed · up to {property.guest_capacity}
                            {score ? ` · ${score.grade}` : ''}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {pendingMine.length > 0 && (
              <p className="mt-3 flex items-start gap-1.5 text-[10.5px] leading-5 text-ink-500">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                {pendingMine.length} {pendingMine.length === 1 ? 'listing is' : 'listings are'} not active yet
                {pendingMine.every((property) => property.listing_status === 'pending_review')
                  ? ' — they are in review.'
                  : '.'}{' '}
                <Link href="/listings" className="font-medium text-pine underline decoration-moss/40">
                  Manage listings
                </Link>
              </p>
            )}
          </section>

          {/* dates */}
          <section className="card p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-sage-100 text-pine">
                <CalendarDays className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-[18px] leading-tight">Set both stays</h2>
                <p className="text-[11.5px] text-ink-500">
                  The stays can be different lengths. Both members accept exactly these dates.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    You stay at theirs
                  </p>
                  <Badge tone="moss">{yourNights ? `${yourNights}n` : '—'}</Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-[12px] font-medium text-ink-800">{recipient.title}</p>
                <div className="mt-3 space-y-3">
                  <Input
                    label="Check-in"
                    type="date"
                    min={today}
                    value={yourCheckIn}
                    onChange={(event) => {
                      const value = event.target.value;
                      setYourCheckIn(value);
                      if (yourCheckOut && yourCheckOut <= value) {
                        setYourCheckOut(addDaysISO(value, 1));
                      }
                    }}
                  />
                  <Input
                    label="Check-out"
                    type="date"
                    min={yourCheckIn ? addDaysISO(yourCheckIn, 1) : addDaysISO(today, 1)}
                    value={yourCheckOut}
                    onChange={(event) => setYourCheckOut(event.target.value)}
                  />
                </div>
                <p className="mt-2 text-[10.5px] text-ink-500">{formatRange(yourCheckIn, yourCheckOut)}</p>
              </div>

              <div className="rounded-2xl border border-sand-200 bg-sand-50/60 p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                    They stay at yours
                  </p>
                  <Badge tone="sky">{theirNights ? `${theirNights}n` : '—'}</Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-[12px] font-medium text-ink-800">
                  {selected?.title ?? 'Choose your home above'}
                </p>
                <div className="mt-3 space-y-3">
                  <Input
                    label="Check-in"
                    type="date"
                    min={today}
                    value={theirCheckIn}
                    onChange={(event) => {
                      const value = event.target.value;
                      setTheirCheckIn(value);
                      if (theirCheckOut && theirCheckOut <= value) {
                        setTheirCheckOut(addDaysISO(value, 1));
                      }
                    }}
                  />
                  <Input
                    label="Check-out"
                    type="date"
                    min={theirCheckIn ? addDaysISO(theirCheckIn, 1) : addDaysISO(today, 1)}
                    value={theirCheckOut}
                    onChange={(event) => setTheirCheckOut(event.target.value)}
                  />
                </div>
                <p className="mt-2 text-[10.5px] text-ink-500">{formatRange(theirCheckIn, theirCheckOut)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leading={<ArrowLeftRight className="h-3.5 w-3.5" />}
                onClick={() => {
                  setYourCheckIn(theirCheckIn);
                  setYourCheckOut(theirCheckOut);
                  setTheirCheckIn(yourCheckIn);
                  setTheirCheckOut(yourCheckOut);
                }}
              >
                Match the dates
              </Button>
              <span className="text-[10.5px] text-ink-500">
                Copies the other leg's dates so both stays line up exactly.
              </span>
            </div>
          </section>

          {/* comparison */}
          <section className="card p-5 sm:p-6">
            <h2 className="text-[18px] leading-tight">Compare the two homes</h2>
            <p className="mt-1 text-[11.5px] text-ink-500">
              A useful check before you send. SwapScore is the server-computed quality signal.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[440px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-sand-200">
                    <th className="w-1/3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                      Detail
                    </th>
                    <th className="py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                      Their home
                    </th>
                    <th className="py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                      Your home
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-200/70 text-[12px]">
                  <CompareRow
                    label="City"
                    theirs={recipient.city}
                    yours={selected ? selected.city : '—'}
                  />
                  <CompareRow
                    label="Neighbourhood"
                    theirs={recipient.neighbourhood}
                    yours={selected?.neighbourhood ?? '—'}
                  />
                  <CompareRow
                    label="Type"
                    theirs={PROPERTY_TYPE_LABELS[recipient.property_type] ?? recipient.property_type}
                    yours={
                      selected
                        ? PROPERTY_TYPE_LABELS[selected.property_type] ?? selected.property_type
                        : '—'
                    }
                  />
                  <CompareRow
                    label="Bedrooms"
                    theirs={String(recipient.bedrooms)}
                    yours={selected ? String(selected.bedrooms) : '—'}
                  />
                  <CompareRow
                    label="Guest capacity"
                    theirs={String(recipient.guest_capacity)}
                    yours={selected ? String(selected.guest_capacity) : '—'}
                  />
                  <CompareRow
                    label="Amenities"
                    theirs={`${recipient.amenities.length} listed`}
                    yours={selected ? `${selected.amenities.length} listed` : '—'}
                  />
                  <CompareRow
                    label="SwapScore"
                    theirs={
                      recipient.property_scores?.[0]
                        ? `${recipient.property_scores[0].total_score.toFixed(1)} · ${recipient.property_scores[0].grade}`
                        : 'Not assessed'
                    }
                    yours={
                      selected?.property_scores?.[0]
                        ? `${selected.property_scores[0].total_score.toFixed(1)} · ${selected.property_scores[0].grade}`
                        : 'Not assessed'
                    }
                  />
                  <CompareRow label="Stay length" theirs={`${yourNights} nights`} yours={`${theirNights} nights`} />
                </tbody>
              </table>
            </div>
            {yourNights !== theirNights && yourNights > 0 && theirNights > 0 && (
              <p className="mt-3 rounded-xl bg-[#fbf3df] px-3 py-2 text-[11px] leading-5 text-[#7a5a1c]">
                The stays are different lengths ({yourNights} vs {theirNights} nights). That is allowed, but
                both members must be comfortable with the imbalance before accepting.
              </p>
            )}
          </section>
        </div>

        {/* summary sidebar */}
        <aside className="space-y-4 lg:sticky lg:top-[92px] lg:self-start">
          <div className="card overflow-hidden p-0">
            <div className="flex items-center gap-2 border-b border-sand-200/70 bg-sage-50/70 px-5 py-3.5">
              <Repeat2 className="h-4 w-4 text-moss" />
              <p className="text-[12px] font-semibold text-pine">Your proposal</p>
            </div>
            <div className="space-y-3 p-5">
              <div className="rounded-2xl bg-sand-50/80 p-3.5">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                  You visit
                </p>
                <p className="mt-1 text-[13px] font-medium text-ink-900">{recipient.title}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-500">
                  <MapPin className="h-3 w-3" /> {recipient.neighbourhood}, {recipient.city}
                </p>
                <p className="mt-2 text-[11.5px] font-medium text-ink-700">
                  {formatRange(yourCheckIn, yourCheckOut)}
                </p>
                <p className="text-[10.5px] text-ink-500">
                  {yourNights} {yourNights === 1 ? 'night' : 'nights'}
                </p>
              </div>
              <div className="flex justify-center text-ink-500">
                <ArrowLeftRight className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-sand-50/80 p-3.5">
                <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                  They visit
                </p>
                <p className="mt-1 text-[13px] font-medium text-ink-900">
                  {selected?.title ?? 'Choose your home'}
                </p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-ink-500">
                  <MapPin className="h-3 w-3" /> {selected?.neighbourhood ?? '—'}, {selected?.city ?? '—'}
                </p>
                <p className="mt-2 text-[11.5px] font-medium text-ink-700">
                  {formatRange(theirCheckIn, theirCheckOut)}
                </p>
                <p className="text-[10.5px] text-ink-500">
                  {theirNights} {theirNights === 1 ? 'night' : 'nights'}
                </p>
              </div>

              <div className="flex items-center justify-between border-t border-sand-200/70 pt-3 text-[12px]">
                <span className="flex items-center gap-1.5 text-ink-500">
                  <Coins className="h-3.5 w-3.5 text-gold-500" /> Credits
                </span>
                <span className="font-semibold text-ink-800">0 — direct swap</span>
              </div>

              <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-sand-50/70 px-3 py-2.5 text-[10.5px] leading-5 text-ink-600">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-sand-300 text-pine focus:ring-moss/30"
                />
                I understand both members must accept the same dates, no credits move, and a confirmed
                swap creates two linked bookings.
              </label>

              {formError && (
                <p className="rounded-xl border border-[#e3bdb4] bg-[#fdf4f2] px-3 py-2.5 text-[11px] leading-5 text-[#8d3527]" role="alert">
                  {formError}
                </p>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={submit}
                loading={submitting}
                disabled={!selected || !recipient || !agreed}
                leading={<Repeat2 className="h-4 w-4" />}
              >
                Send swap proposal
              </Button>
              <p className="text-center text-[10px] leading-4 text-ink-500">
                Nothing is reserved until the other member accepts.
              </p>
            </div>
          </div>

          <div className="card p-5">
            <p className="flex items-center gap-1.5 eyebrow">
              <ShieldCheck className="h-3.5 w-3.5 text-moss" /> How a swap works
            </p>
            <ol className="mt-2.5 space-y-2.5 text-[11px] leading-5 text-ink-600">
              <li className="flex gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sage-100 text-[9.5px] font-semibold text-pine">
                  1
                </span>
                You send both date ranges in one proposal.
              </li>
              <li className="flex gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sage-100 text-[9.5px] font-semibold text-pine">
                  2
                </span>
                The other host accepts or declines. Their dates must still be free.
              </li>
              <li className="flex gap-2">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sage-100 text-[9.5px] font-semibold text-pine">
                  3
                </span>
                On acceptance, both homes are reserved and the agreement is stored.
              </li>
            </ol>
          </div>

          <div className="rounded-2xl bg-[#f4efe4]/80 p-4 text-[10.5px] leading-5 text-ink-600">
            <p className="flex items-center gap-1.5 font-semibold text-ink-800">
              <Sparkles className="h-3.5 w-3.5 text-clay-400" /> Fairness without cash
            </p>
            <p className="mt-1">
              SwapStay does not value homes in rupees. A swap is worth exactly what both members agree it is.
              Keep the exchange roughly reciprocal and say so in your profile.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function CompareRow({ label, theirs, yours }: { label: string; theirs: string; yours: string }) {
  return (
    <tr>
      <td className="py-2.5 pr-3 text-[11px] text-ink-500">{label}</td>
      <td className="py-2.5 pr-3 text-[12px] font-medium text-ink-800">{theirs}</td>
      <td className="py-2.5 text-[12px] font-medium text-ink-800">{yours}</td>
    </tr>
  );
}

export default function NewSwapPage() {
  return (
    <RequireAuth>
      <Suspense fallback={<LoadingBlock label="Preparing your swap" className="py-24" />}>
        <NewSwapContent />
      </Suspense>
    </RequireAuth>
  );
}
