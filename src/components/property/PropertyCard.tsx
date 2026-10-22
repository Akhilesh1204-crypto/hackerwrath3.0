'use client';

import Link from 'next/link';
import { ArrowUpRight, BedDouble, MapPin, Users } from 'lucide-react';
import type { SearchProperty } from '@/lib/types';
import { PROPERTY_TYPE_LABELS } from '@/lib/constants';
import { ScoreRing } from '@/components/ui/Primitives';
import { PropertyImage } from '@/components/property/PropertyImage';
import { cn } from '@/lib/utils';

export function PropertyCard({
  property,
  className,
}: {
  property: SearchProperty;
  className?: string;
}) {
  const breakdown = property.score?.breakdown;
  return (
    <Link
      href={`/properties/${property.id}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-3xl border border-sand-200/90 bg-white/90 shadow-soft transition duration-300 hover:-translate-y-0.5 hover:border-sand-300 hover:shadow-lift',
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <PropertyImage
          photos={property.photos}
          city={property.city}
          title={property.title}
          className="transition duration-700 group-hover:scale-[1.035]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-900/55 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-700 backdrop-blur">
            {PROPERTY_TYPE_LABELS[property.property_type] ?? property.property_type}
          </span>
        </div>
        {property.score && (
          <div className="absolute bottom-3 right-3 rounded-2xl bg-white/95 p-1.5 shadow-sm">
            <ScoreRing
              score={property.score.total_score}
              grade={property.score.grade}
              size={48}
              showGrade
            />
          </div>
        )}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-[11px] font-medium text-white/95">
          <MapPin className="h-3.5 w-3.5" />
          {property.neighbourhood}, {property.city}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-[17px] leading-snug tracking-[-0.01em] text-ink-900 transition group-hover:text-pine">
          {property.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-5 text-ink-500">
          {property.description}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
          <span className="inline-flex items-center gap-1">
            <BedDouble className="h-3.5 w-3.5" /> {property.bedrooms} bed
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> up to {property.guest_capacity}
          </span>
          {breakdown && (
            <span className="ml-auto hidden text-ink-500/80 sm:inline">
              Score {property.score?.total_score.toFixed(1)}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {property.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="rounded-full border border-sand-200 bg-sand-50 px-2 py-0.5 text-[10.5px] text-ink-600"
            >
              {amenity}
            </span>
          ))}
          {property.amenities.length > 3 && (
            <span className="rounded-full px-2 py-0.5 text-[10.5px] text-ink-500">
              +{property.amenities.length - 3}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-sand-200/70 pt-3.5">
          <p className="text-[12px] text-ink-500">
            <span className="font-semibold text-ink-800">1 credit</span> / night
          </p>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-pine">
            View home
            <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
