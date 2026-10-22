'use client';

import Link from 'next/link';
import {
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  Home,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { PropertyImage } from '@/components/property/PropertyImage';
import { ListingStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingBlock, ScoreRing } from '@/components/ui/Primitives';
import { getMyProperties } from '@/lib/api';
import { PROPERTY_TYPE_LABELS } from '@/lib/constants';
import { formatDateShort } from '@/lib/dates';
import { useApiQuery } from '@/lib/hooks';
import type { PropertyDetail } from '@/lib/types';

function MyHomesContent() {
  const query = useApiQuery(() => getMyProperties(), []);
  const properties = query.data ?? [];

  const active = properties.filter((property) => property.listing_status === 'active').length;
  const inReview = properties.filter((property) => property.listing_status === 'pending_review').length;
  const scores = properties
    .map((property) => property.property_scores?.[0]?.total_score)
    .filter((score): score is number => typeof score === 'number');
  const average = scores.length
    ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1)
    : null;

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Hosting"
        title={
          <>
            My <span className="italic text-moss">homes</span>
          </>
        }
        description="Manage listings, publish availability and keep the details guests rely on up to date."
        actions={
          <Link href="/properties/new">
            <Button leading={<Plus className="h-4 w-4" />}>List a new home</Button>
          </Link>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          { label: 'Live listings', value: active, hint: 'Accepting requests' },
          { label: 'In review', value: inReview, hint: 'Awaiting approval' },
          { label: 'Average SwapScore', value: average ?? '—', hint: 'Across your homes' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-sand-200/90 bg-white/70 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              {stat.label}
            </p>
            <p className="mt-1 font-display text-[26px] leading-none text-ink-900">{stat.value}</p>
            <p className="mt-1 text-[10.5px] text-ink-500">{stat.hint}</p>
          </div>
        ))}
      </div>

      {query.loading && <LoadingBlock label="Loading your homes" className="py-20" />}

      {!query.loading && query.error && (
        <ErrorState
          className="mt-6"
          title="Your listings could not load"
          message={query.error}
          code={query.errorCode}
          onRetry={query.refresh}
        />
      )}

      {!query.loading && !query.error && properties.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon={<Home className="h-5 w-5" />}
            title="Your home is the ticket"
            description="List the nights you can host, set your house rules, and start receiving credit-stay requests or direct swap proposals."
            action={
              <Link href="/properties/new">
                <Button leading={<Plus className="h-4 w-4" />}>Create your first listing</Button>
              </Link>
            }
          />
        </div>
      )}

      {!query.loading && !query.error && properties.length > 0 && (
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {properties.map((property) => (
            <ListingCard key={property.id} property={property} />
          ))}
        </div>
      )}

      <div className="mt-8 flex items-start gap-2.5 rounded-2xl border border-sand-200 bg-white/60 px-4 py-3 text-[11px] leading-5 text-ink-500">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-clay-400" />
        Listing status and SwapScore are server-controlled. You can edit content and availability, but
        verification and moderation decisions stay with the platform.
      </div>
    </div>
  );
}

function ListingCard({ property }: { property: PropertyDetail }) {
  const photos = [...(property.property_photos ?? [])]
    .sort((a, b) => a.display_order - b.display_order)
    .map((photo) => photo.storage_path);
  const score = property.property_scores?.[0];

  return (
    <div className="overflow-hidden rounded-3xl border border-sand-200/90 bg-white/90 shadow-soft">
      <div className="relative aspect-[16/9]">
        <PropertyImage photos={photos} city={property.city} title={property.title} />
        <div className="absolute left-3 top-3">
          <ListingStatusBadge status={property.listing_status} />
        </div>
        {score && (
          <div className="absolute bottom-3 right-3 rounded-2xl bg-white/95 p-1.5 shadow-sm">
            <ScoreRing score={score.total_score} grade={score.grade} size={46} />
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-ink-500">
          {property.neighbourhood}, {property.city}
        </p>
        <h3 className="mt-1 text-[18px] leading-snug text-ink-900">{property.title}</h3>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-ink-500">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} bed
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> up to {property.guest_capacity}
          </span>
          <span className="inline-flex items-center gap-1">
            {PROPERTY_TYPE_LABELS[property.property_type] ?? property.property_type}
          </span>
        </div>

        {property.listing_status === 'pending_review' && (
          <p className="mt-3 rounded-xl bg-[#fbf3df] px-3 py-2 text-[11px] leading-5 text-[#7a5a1c]">
            In review. You can add photos and availability now; bookings unlock once it is live.
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-sand-200/70 pt-3.5">
          <span className="text-[10.5px] text-ink-500">
            Updated {formatDateShort(property.updated_at.slice(0, 10))}
          </span>
          <div className="flex flex-wrap gap-2">
            <Link href={`/properties/${property.id}`}>
              <Button variant="ghost" size="sm" trailing={<ArrowUpRight className="h-3.5 w-3.5" />}>
                View
              </Button>
            </Link>
            <Link href={`/listings/${property.id}`}>
              <Button variant="secondary" size="sm" leading={<CalendarDays className="h-3.5 w-3.5" />}>
                Manage
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyHomesPage() {
  return (
    <RequireAuth>
      <MyHomesContent />
    </RequireAuth>
  );
}
