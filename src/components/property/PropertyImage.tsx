'use client';

import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { CITY_IMAGE_FALLBACKS } from '@/lib/constants';
import { supabasePhotoUrl } from '@/lib/supabase';
import { cn, truncate } from '@/lib/utils';

export function PropertyImage({
  photos,
  city,
  title,
  className,
  sizes,
}: {
  photos?: string[] | null;
  city?: string;
  title?: string;
  className?: string;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const candidate = photos?.find((photo) => Boolean(photo));
  const url = candidate ? supabasePhotoUrl(candidate) : null;
  const gradient = CITY_IMAGE_FALLBACKS[city ?? ''] ?? 'from-[#1a3a34] via-[#2a5a4f] to-[#a9c6b1]';

  if (!url || failed) {
    return (
      <div
        className={cn(
          'relative flex h-full w-full items-end overflow-hidden bg-gradient-to-br',
          gradient,
          className,
        )}
        role="img"
        aria-label={title ? `Illustration for ${title}` : 'Property illustration'}
      >
        <div className="absolute inset-0 grain opacity-[0.18]" aria-hidden />
        <svg
          viewBox="0 0 400 260"
          className="absolute inset-0 h-full w-full text-white/15"
          fill="none"
          aria-hidden
        >
          <path d="M-20 220c80-40 130 10 210-20s140-70 240-30" stroke="currentColor" strokeWidth="1" />
          <path d="M0 190c90-30 150 20 230-8s120-60 200-20" stroke="currentColor" strokeWidth="1" />
          <path d="M60 175V120l46-34 46 34v55H60Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M88 175v-26h36v26" stroke="currentColor" strokeWidth="1.2" />
          <path d="M246 170v-48l40-30 40 30v48h-80Z" stroke="currentColor" strokeWidth="1.5" />
          <path d="M272 170v-22h28v22" stroke="currentColor" strokeWidth="1.2" />
        </svg>
        <div className="relative z-10 flex w-full items-end justify-between p-4">
          <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
            {city ?? 'SwapStay'}
          </span>
          <ImageOff className="h-4 w-4 text-white/40" aria-hidden />
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={title ? `Stay at ${title}` : 'Property photo'}
      loading="lazy"
      sizes={sizes}
      onError={() => setFailed(true)}
      className={cn('h-full w-full object-cover', className)}
    />
  );
}

export function ThumbStrip({
  photos,
  city,
  title,
  onSelect,
}: {
  photos?: string[] | null;
  city?: string;
  title?: string;
  onSelect?: (index: number) => void;
}) {
  const items = (photos ?? []).slice(0, 5);
  if (items.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {items.map((photo, index) => (
        <button
          key={`${photo}-${index}`}
          type="button"
          onClick={() => onSelect?.(index)}
          className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-white/20 ring-1 ring-inset ring-black/5 transition hover:opacity-90"
          aria-label={`Show photo ${index + 1}${title ? ` of ${truncate(title, 40)}` : ''}`}
        >
          {/* Individual thumbs use the same public resolver through the img element below. */}
          <PropertyImage photos={[photo]} city={city} title={title} />
        </button>
      ))}
    </div>
  );
}
