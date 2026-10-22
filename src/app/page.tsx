'use client';

import Link from 'next/link';
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  Coins,
  KeyRound,
  LockKeyhole,
  Repeat2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wallet,
} from 'lucide-react';
import { SearchBar } from '@/components/property/SearchBar';
import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyImage } from '@/components/property/PropertyImage';
import { ScorePanel } from '@/components/property/ScorePanel';
import { ScoreRing } from '@/components/ui/Primitives';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LAUNCH_CITIES } from '@/lib/constants';
import { searchProperties } from '@/lib/api';
import { useApiQuery } from '@/lib/hooks';
import { useAuth } from '@/components/auth/AuthProvider';

const steps = [
  {
    icon: KeyRound,
    title: 'List the home you already have',
    body: 'Add photos, capacity, amenities and house rules. Choose the nights you are happy to host — exact addresses stay private until a stay is confirmed.',
    note: 'Listing review before it goes live',
  },
  {
    icon: Repeat2,
    title: 'Find a home that fits your dates',
    body: 'Search by city, dates and guests. Compare verified homes by SwapScore, capacity and the rules that matter to you. No hidden algorithm decides for you.',
    note: 'Deterministic matching, real availability',
  },
  {
    icon: Coins,
    title: 'Swap directly or stay with credits',
    body: 'Propose a two-way swap with mutual consent, or spend credits earned by hosting. Dates, costs and cancellation terms are shown before anything is confirmed.',
    note: 'One credit per eligible night in the pilot',
  },
];

const trustPoints = [
  {
    icon: BadgeCheck,
    title: 'Verification is explicit',
    body: 'Identity and hosting authority are checked before a listing can be booked. We show what has been verified — and what has not.',
  },
  {
    icon: LockKeyhole,
    title: 'Your address stays private',
    body: 'Search results show the neighbourhood, not your door. Exact addresses and access notes are revealed only when a stay is confirmed.',
  },
  {
    icon: ShieldCheck,
    title: 'Consent before confirmation',
    body: 'Swaps need both members to accept the same terms. The server rechecks availability, permissions and conflicts before anything is reserved.',
  },
  {
    icon: Wallet,
    title: 'A ledger you can audit',
    body: 'Every credit movement is an append-only entry. Balances separate available from reserved, with corrections recorded — never silently deleted.',
  },
];

export default function LandingPage() {
  const { status } = useAuth();
  const featured = useApiQuery(() => searchProperties({ limit: 3 }), [], {
    enabled: true,
  });
  const homes = featured.data?.items ?? [];

  return (
    <div className="overflow-hidden">
      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative">
        <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-sage-200/40 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-40 h-[28rem] w-[28rem] rounded-full bg-clay-100/60 blur-3xl" />

        <div className="container-page relative grid items-center gap-14 pb-16 pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-16">
          <div className="animate-fade-up">
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Badge tone="moss" dot>
                Live pilot · 4 Indian cities
              </Badge>
              <span className="text-[11px] text-ink-500">Mumbai · Bengaluru · Delhi NCR · Hyderabad</span>
            </div>

            <h1 className="text-balance text-[2.85rem] leading-[1.02] tracking-[-0.03em] sm:text-[3.6rem] lg:text-[4.15rem]">
              Travel by{' '}
              <span className="relative italic text-pine">
                swapping homes
                <svg
                  viewBox="0 0 320 12"
                  className="absolute -bottom-2 left-0 w-full text-clay-300/80"
                  fill="none"
                  aria-hidden
                >
                  <path d="M2 8.5c70-5 130 2 200-3 40-3 70-1 116 1" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </span>
              ,<br className="hidden sm:block" /> not by paying for them.
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-7 text-ink-600">
              SwapStay is a trusted network of members who exchange their homes. Stay in someone&apos;s
              place directly, or host first and spend the credits later. Transparent scores, clear terms,
              and no surprise charges.
            </p>

            <div className="mt-8">
              <SearchBar />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11.5px] text-ink-500">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-moss" /> Verified members
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-moss" /> Mutual consent on every swap
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-moss" /> Credits, not cash
              </span>
            </div>
          </div>

          {/* collage */}
          <div className="relative mx-auto w-full max-w-[520px] animate-fade-up [animation-delay:120ms]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2.2rem] border border-white/70 bg-sand-200 shadow-lift">
              <PropertyImage
                photos={['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80']}
                city="Bengaluru"
                title="A light-filled home exchanged through SwapStay"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/55 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 pb-16 text-white">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                  Indiranagar · Bengaluru
                </p>
                <p className="mt-1 font-display text-[22px] leading-tight">Garden cottage, three bedrooms</p>
                <p className="mt-1.5 text-[12px] text-white/80">Up to 5 guests · Wi-Fi · Kitchen · Parking</p>
              </div>
            </div>

            <div className="absolute -left-4 top-8 w-[190px] rounded-2xl border border-sand-200 bg-white/95 p-3.5 shadow-lift backdrop-blur sm:-left-8">
              <div className="flex items-center gap-2.5">
                <ScoreRing score={85.7} grade="A" size={50} />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-500">SwapScore</p>
                  <p className="mt-0.5 text-[12px] font-medium text-ink-800">Evidence verified</p>
                  <p className="text-[10.5px] text-ink-500">Condition 88 · Location 86</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-6 -right-2 w-[210px] rounded-2xl border border-sand-200 bg-white/95 p-4 shadow-lift backdrop-blur sm:-right-6">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-sage-100 text-pine">
                  <Repeat2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-[11.5px] font-semibold text-ink-900">Swap confirmed</p>
                  <p className="text-[10.5px] text-ink-500">Both members accepted · 3 nights each</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1.5 border-t border-sand-200/80 pt-2.5 text-[10.5px] text-ink-500">
                <ShieldCheck className="h-3.5 w-3.5 text-moss" />
                Availability rechecked by the server
              </div>
            </div>

            <div className="absolute -right-2 top-1/2 hidden -translate-y-1/2 rotate-2 rounded-full border border-sand-200 bg-white/90 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-600 shadow-sm sm:block">
              1 credit = 1 night
            </div>
          </div>
        </div>
      </section>

      {/* ----------------------------- city strip ---------------------------- */}
      <section className="border-y border-sand-200/70 bg-[#f4efe4]/60">
        <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink-500">
            Launching neighbourhood by neighbourhood
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {LAUNCH_CITIES.map((city) => (
              <Link
                key={city.name}
                href={`/search?city=${encodeURIComponent(city.name)}`}
                className="group inline-flex items-center gap-1.5 rounded-full border border-sand-300/80 bg-white/70 px-3 py-1.5 text-[12px] text-ink-700 transition hover:border-moss/40 hover:text-pine"
              >
                {city.name}
                <ArrowUpRight className="h-3 w-3 text-ink-500/50 transition group-hover:text-pine" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------- featured homes ------------------------- */}
      <section className="container-page py-16 sm:py-20">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">A first look</p>
            <h2 className="mt-2 text-[2rem] leading-tight sm:text-[2.4rem]">
              Homes with a story, <span className="italic text-moss">not a price tag</span>
            </h2>
            <p className="mt-2 max-w-xl text-[13.5px] leading-6 text-ink-500">
              Every listing shows its SwapScore breakdown, verification status and house rules before you
              commit to anything.
            </p>
          </div>
          <Link
            href="/search"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-pine link-underline"
          >
            Explore all homes <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8">
          {featured.loading && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((index) => (
                <div key={index} className="overflow-hidden rounded-3xl border border-sand-200 bg-white/60">
                  <div className="skeleton aspect-[4/3] rounded-none" />
                  <div className="space-y-3 p-5">
                    <div className="skeleton h-4 w-3/4" />
                    <div className="skeleton h-3 w-1/2" />
                    <div className="skeleton h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!featured.loading && homes.length > 0 && (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {homes.map((home) => (
                <PropertyCard key={home.id} property={home} />
              ))}
            </div>
          )}

          {!featured.loading && homes.length === 0 && (
            <div className="rounded-3xl border border-dashed border-sand-300 bg-white/50 px-6 py-12 text-center">
              <Sparkles className="mx-auto h-6 w-6 text-clay-400" />
              <h3 className="mt-3 text-lg">Inventory is being verified city by city</h3>
              <p className="mx-auto mt-1.5 max-w-md text-sm leading-6 text-ink-500">
                We only call a market live when there are enough verified, available homes to offer real
                choices. Sign in to preview the pilot with sample homes.
              </p>
              {status !== 'authenticated' && (
                <Link href="/login" className="mt-4 inline-block text-sm font-semibold text-pine link-underline">
                  Open the demo
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------- how it works -------------------------- */}
      <section id="how-it-works" className="scroll-mt-24 border-y border-sand-200/70 bg-white/45">
        <div className="container-page py-16 sm:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-2 text-[2.1rem] leading-tight sm:text-[2.6rem]">
              Three steps. <span className="italic text-moss">One fair exchange.</span>
            </h2>
            <p className="mt-3 text-[14px] leading-6 text-ink-500">
              SwapStay coordinates homes, dates, trust and credits so both sides know exactly what they
              are agreeing to.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-3xl border border-sand-200/90 bg-white/80 p-6 shadow-soft">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-pine text-sand-50">
                    <step.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-4xl text-sand-300">0{index + 1}</span>
                </div>
                <h3 className="mt-5 text-[19px] leading-snug">{step.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-ink-500">{step.body}</p>
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1 text-[10.5px] font-medium text-pine">
                  <Check className="h-3 w-3" /> {step.note}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href={status === 'authenticated' ? '/search' : '/signup'}
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-pine px-6 text-[14px] font-semibold text-sand-50 shadow-[0_16px_34px_-18px_rgba(15,61,54,0.9)] transition hover:bg-ink-700"
            >
              {status === 'authenticated' ? 'Find your next stay' : 'Join the pilot'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------ swapscore --------------------------- */}
      <section id="swapscore" className="container-page scroll-mt-24 py-16 sm:py-24">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <p className="eyebrow">SwapScore</p>
            <h2 className="mt-2 text-[2.1rem] leading-tight sm:text-[2.6rem]">
              A number you can <span className="italic text-moss">take apart</span>
            </h2>
            <p className="mt-4 max-w-xl text-[14px] leading-7 text-ink-600">
              A high score is not a promise, and a low score is not a rejection. SwapScore explains how a
              home was assessed across five factors, with the evidence and method version attached.
            </p>

            <ul className="mt-6 space-y-3">
              {[
                'Factor breakdown with weights, so you know what drives the score.',
                'Verification shown separately — a missing document never hides the home.',
                'Host reliability kept apart from property quality.',
                'Scores are server-controlled; members cannot edit their own.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[13px] leading-6 text-ink-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-clay-400" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap items-center gap-3 text-[11.5px] text-ink-500">
              <Badge tone="gold">A · 85–100</Badge>
              <Badge tone="moss">B · 70–84.9</Badge>
              <Badge tone="neutral">C · 55–69.9</Badge>
              <Badge tone="clay">D · 40–54.9</Badge>
              <Badge tone="red">E · below 40</Badge>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2.4rem] bg-sage-100/60 blur-2xl" aria-hidden />
            <ScorePanel
              className="relative"
              breakdown={{ condition: 82, location: 88, amenities: 80, space: 72, listing_quality: 86 }}
              total={82.2}
              grade="B"
              evidenceStatus="verified"
              methodVersion="1.0"
              assessedAt={new Date().toISOString()}
            />
            <p className="relative mt-3 text-center text-[10.5px] text-ink-500">
              Example assessment · weights are provisional and validated in the pilot
            </p>
          </div>
        </div>
      </section>

      {/* -------------------------------- trust ----------------------------- */}
      <section id="trust" className="scroll-mt-24 border-y border-sand-200/70 bg-[#f4efe4]/60">
        <div className="container-page py-16 sm:py-24">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Trust by design</p>
              <h2 className="mt-2 text-[2.1rem] leading-tight sm:text-[2.6rem]">
                Built for the awkward questions
              </h2>
            </div>
            <p className="max-w-md text-[13px] leading-6 text-ink-500">
              Who is this person? Is the home really available? What happens if plans change? The product
              answers these before a commitment, not after.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustPoints.map((point) => (
              <div key={point.title} className="rounded-3xl border border-sand-200/90 bg-white/80 p-5 shadow-soft">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-sage-100 text-pine">
                  <point.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[17px] leading-snug">{point.title}</h3>
                <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">{point.body}</p>
              </div>
            ))}
          </div>

          <div id="policy" className="mt-10 grid gap-5 rounded-3xl border border-sand-200/90 bg-white/70 p-6 sm:grid-cols-3 sm:p-8">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-500">Credits</p>
              <p className="mt-2 font-display text-[20px] leading-snug text-ink-900">No cash redemption in the MVP</p>
              <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">
                Credits are internal units for eligible stays. Host once, stay later.
              </p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-500">Cancellation</p>
              <p className="mt-2 font-display text-[20px] leading-snug text-ink-900">Terms shown before you commit</p>
              <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">
                Reserved credits are released under the disclosed policy — never silently.
              </p>
            </div>
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink-500">What we don&apos;t promise</p>
              <p className="mt-2 font-display text-[20px] leading-snug text-ink-900">Savings or availability</p>
              <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">
                Transport, cleaning and deposits may still apply. We show the real state, not a slogan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------- cities ---------------------------- */}
      <section className="container-page py-16 sm:py-24">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">Where we are</p>
            <h2 className="mt-2 text-[2.1rem] leading-tight sm:text-[2.6rem]">
              Four cities, <span className="italic text-moss">selected neighbourhoods</span>
            </h2>
          </div>
          <p className="max-w-sm text-[12.5px] leading-6 text-ink-500">
            Delhi NCR is stored as the actual city and state — Delhi, Gurugram or Noida — not one legal
            jurisdiction.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {LAUNCH_CITIES.slice(0, 4).map((city) => (
            <Link
              key={city.name}
              href={`/search?city=${encodeURIComponent(city.name)}`}
              className="group relative overflow-hidden rounded-3xl border border-sand-200/80 shadow-soft"
            >
              <div className="aspect-[5/6]">
                <PropertyImage
                  photos={[]}
                  city={city.name}
                  title={`${city.name} homes`}
                  className="transition duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900/75 via-ink-900/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="font-display text-[24px] leading-tight">{city.name}</p>
                <p className="mt-1 text-[11px] leading-5 text-white/75">{city.tagline}</p>
                <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white">
                  Explore homes <ArrowUpRight className="h-3.5 w-3.5" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ------------------------------ credit band ------------------------- */}
      <section className="container-page pb-16 sm:pb-24">
        <div className="relative overflow-hidden rounded-[2.4rem] bg-pine px-6 py-12 text-sand-50 sm:px-12">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sage-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-clay-400/20 blur-3xl" />
          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-sage-300">
                The credit wallet
              </p>
              <h2 className="mt-3 text-[2.1rem] leading-tight text-sand-50 sm:text-[2.7rem]">
                Host once. <span className="italic text-sage-300">Stay later.</span>
              </h2>
              <p className="mt-4 max-w-xl text-[13.5px] leading-7 text-sand-100/75">
                Earn one credit per eligible hosted night, spend one per booked night. Available and
                reserved balances are kept apart, and every movement is logged. Rates stay configurable
                until the pilot proves what is fair.
              </p>
              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  href={status === 'authenticated' ? '/wallet' : '/signup'}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-sand-50 px-5 text-[13px] font-semibold text-pine transition hover:bg-white"
                >
                  {status === 'authenticated' ? 'Open my wallet' : 'Start hosting'}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#how-it-works"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/20 px-5 text-[13px] font-medium text-sand-100 transition hover:bg-white/10"
                >
                  See the full flow
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex items-center justify-between text-[11px] text-sand-100/70">
                <span>Your wallet</span>
                <span className="inline-flex items-center gap-1">
                  <LockKeyhole className="h-3 w-3" /> ledger-backed
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-sand-100/60">Available</p>
                  <p className="mt-1 font-display text-3xl">6</p>
                  <p className="text-[10.5px] text-sand-100/60">credits ready to spend</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[10px] uppercase tracking-[0.14em] text-sand-100/60">Reserved</p>
                  <p className="mt-1 font-display text-3xl">2</p>
                  <p className="text-[10.5px] text-sand-100/60">held for a pending stay</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { icon: CalendarCheck, label: 'Host reward · 2 nights', value: '+2' },
                  { icon: Users, label: 'Stay hold · Koramangala', value: '−3' },
                  { icon: Wallet, label: 'Starter allocation', value: '+5' },
                ].map((row) => (
                  <div key={row.label} className="flex items-center gap-3 rounded-xl bg-white/5 px-3 py-2.5">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">
                      <row.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="flex-1 text-[11.5px] text-sand-100/80">{row.label}</span>
                    <span className="text-[12px] font-semibold tabular-nums">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --------------------------------- CTA ------------------------------ */}
      <section className="container-page pb-20">
        <div className="flex flex-col items-center rounded-[2.2rem] border border-sand-200 bg-white/70 px-6 py-12 text-center shadow-soft sm:px-12">
          <div className="mb-4 flex items-center gap-1 text-gold-500">
            {[0, 1, 2, 3, 4].map((index) => (
              <Star key={index} className="h-3.5 w-3.5 fill-current" />
            ))}
          </div>
          <h2 className="max-w-2xl text-balance text-[2rem] leading-tight sm:text-[2.5rem]">
            Your home is already the ticket.
          </h2>
          <p className="mt-3 max-w-xl text-[13.5px] leading-6 text-ink-500">
            Join the four-city pilot, list the nights you are happy to share, and see who wants to swap.
            No listing fee, no cash balance, no obligation until you accept the terms.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2.5">
            <Link href={status === 'authenticated' ? '/properties/new' : '/signup'}>
              <Button size="lg" trailing={<ArrowRight className="h-4 w-4" />}>
                {status === 'authenticated' ? 'List your home' : 'Create your account'}
              </Button>
            </Link>
            <Link href="/search">
              <Button size="lg" variant="outline">
                Browse homes first
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-[10.5px] text-ink-500">
            Pilot release · Credits have no cash value · Verified hosts only
          </p>
        </div>
      </section>
    </div>
  );
}
