'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  Camera,
  ImagePlus,
  Info,
  Loader2,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/components/auth/AuthProvider';
import { PropertyForm } from '@/components/property/PropertyForm';
import { PropertyImage } from '@/components/property/PropertyImage';
import { AvailabilityCalendar } from '@/components/availability/AvailabilityCalendar';
import { ListingStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorState, LoadingBlock, ScoreRing, Tabs } from '@/components/ui/Primitives';
import { useToast } from '@/components/ui/Toast';
import {
  addPropertyPhoto,
  deletePropertyPhoto,
  getProperty,
  updateProperty,
  uploadPropertyPhoto,
} from '@/lib/api';
import { ApiError, errorMessage } from '@/lib/api/client';
import { useApiQuery } from '@/lib/hooks';
import type { CreatePropertyInput, PropertyPhotoRow } from '@/lib/types';

function ManageListingContent() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === 'string' ? params.id : '';
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const query = useApiQuery(() => getProperty(id), [id], { enabled: Boolean(id) });
  const property = query.data;

  const [tab, setTab] = useState('details');
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  if (query.loading) {
    return <LoadingBlock label="Loading your listing" className="py-24" />;
  }

  if (query.error || !property) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Listing not found"
          message={query.error ?? 'This listing could not be found.'}
          code={query.errorCode}
          onRetry={query.refresh}
        />
      </div>
    );
  }

  if (user && property.owner_id !== user.id) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="You do not manage this home"
          message="Only the host who owns this listing can edit its details or calendar."
          onRetry={query.refresh}
        />
        <div className="mt-6 text-center">
          <Link href="/listings" className="text-sm font-medium text-pine link-underline">
            Back to my homes
          </Link>
        </div>
      </div>
    );
  }

  const score = property.property_scores?.[0];

  async function save(input: CreatePropertyInput) {
    setSubmitting(true);
    setServerError(null);
    setFieldErrors({});
    try {
      await updateProperty(id, input);
      success('Listing updated', 'Your changes are saved. Some fields may require re-review.');
      query.refresh();
    } catch (error) {
      const message = errorMessage(error);
      setServerError(message);
      if (error instanceof ApiError) setFieldErrors(error.fieldErrors);
      toastError('Changes not saved', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container-page py-8 sm:py-12">
      <Link
        href="/listings"
        className="inline-flex items-center gap-1.5 text-[12px] font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> My homes
      </Link>

      <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <ListingStatusBadge status={property.listing_status} />
            <span className="text-[11px] text-ink-500">
              {property.neighbourhood}, {property.city}
            </span>
          </div>
          <h1 className="mt-2.5 text-[2rem] leading-[1.12] tracking-[-0.02em] sm:text-[2.4rem]">
            {property.title}
          </h1>
          <p className="mt-2 text-[12px] text-ink-500">
            Manage the content guests see, the nights you can host, and the photos on your listing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {score && <ScoreRing score={score.total_score} grade={score.grade} size={54} />}
          <Link href={`/properties/${property.id}`}>
            <Button variant="secondary" size="sm" trailing={<ArrowUpRight className="h-3.5 w-3.5" />}>
              View public page
            </Button>
          </Link>
        </div>
      </div>

      <Tabs
        className="mt-7"
        active={tab}
        onChange={setTab}
        ariaLabel="Manage listing"
        tabs={[
          { id: 'details', label: 'Details' },
          { id: 'availability', label: 'Availability' },
          { id: 'photos', label: 'Photos', count: property.property_photos?.length ?? 0 },
        ]}
      />

      <div className="mt-6">
        {tab === 'details' && (
          <div className="grid gap-8 lg:grid-cols-[1.65fr_0.9fr]">
            <PropertyForm
              initial={{
                title: property.title,
                description: property.description,
                city: property.city,
                state: property.state,
                neighbourhood: property.neighbourhood,
                property_type: property.property_type,
                bedrooms: property.bedrooms,
                guest_capacity: property.guest_capacity,
                amenities: property.amenities,
                house_rules: property.house_rules,
                exact_address: property.exact_address ?? '',
              }}
              submitLabel="Save changes"
              submitting={submitting}
              serverError={serverError}
              fieldErrors={fieldErrors}
              onSubmit={save}
            />

            <aside className="space-y-4 lg:sticky lg:top-[92px] lg:self-start">
              <div className="card p-5">
                <p className="eyebrow">Listing health</p>
                <dl className="mt-3 space-y-2.5 text-[12px]">
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-500">Status</dt>
                    <dd className="font-medium text-ink-800 capitalize">
                      {property.listing_status.replace('_', ' ')}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-500">SwapScore</dt>
                    <dd className="font-medium text-ink-800">
                      {score ? `${score.total_score.toFixed(1)} · ${score.grade}` : 'Not assessed'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-500">Evidence</dt>
                    <dd className="font-medium text-ink-800 capitalize">
                      {score?.evidence_status ?? 'pending'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-ink-500">Photos</dt>
                    <dd className="font-medium text-ink-800">{property.property_photos?.length ?? 0}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-3xl border border-[#e6cf9d] bg-[#fbf3df] p-5">
                <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#7a5a1c]">
                  <Info className="h-3.5 w-3.5" /> Moderation is separate
                </p>
                <p className="mt-1.5 text-[11px] leading-5 text-[#8a6a2a]">
                  Editing text does not change your verification or SwapScore. The server owns those
                  values, and material changes may trigger a fresh review.
                </p>
              </div>

              {property.listing_status === 'active' && (
                <Link href="/properties/new">
                  <Button variant="outline" className="w-full" leading={<Sparkles className="h-4 w-4" />}>
                    List another home
                  </Button>
                </Link>
              )}
            </aside>
          </div>
        )}

        {tab === 'availability' && (
          <div className="grid gap-6 lg:grid-cols-[1.65fr_0.9fr]">
            <AvailabilityCalendar propertyId={property.id} />
            <aside className="space-y-4">
              <div className="card p-5">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
                  <CalendarDays className="h-3.5 w-3.5" /> How dates work
                </p>
                <ul className="mt-2.5 space-y-2 text-[11.5px] leading-5 text-ink-600">
                  <li>Open nights appear available to members searching your city.</li>
                  <li>Confirmed bookings and reserved nights cannot be reopened here.</li>
                  <li>A request still needs your approval; availability is not a confirmation.</li>
                  <li>Direct swaps reserve both homes for the agreed legs.</li>
                </ul>
              </div>
              <div className="rounded-2xl bg-sage-50 p-4 text-[11px] leading-5 text-pine">
                Tip: keep the next 60–90 days current. Stale calendars reduce accepted requests and
                weaken the host reliability signal.
              </div>
            </aside>
          </div>
        )}

        {tab === 'photos' && <PhotosPanel propertyId={property.id} photos={property.property_photos ?? []} onChanged={query.refresh} />}
      </div>
    </div>
  );
}

function PhotosPanel({
  propertyId,
  photos,
  onChanged,
}: {
  propertyId: string;
  photos: PropertyPhotoRow[];
  onChanged: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const sorted = [...photos].sort((a, b) => a.display_order - b.display_order);

  async function addPath(path: string) {
    await addPropertyPhoto(propertyId, path, photos.length);
    success('Photo added', 'Photos may be moderated before they appear in public search.');
    setUrl('');
    onChanged();
  }

  async function addByUrl() {
    const value = url.trim();
    if (value.length < 5) {
      toastError('Add a photo', 'Paste an image URL or storage path of at least 5 characters.');
      return;
    }
    setAdding(true);
    try {
      await addPath(value);
    } catch (error) {
      toastError('Photo not added', errorMessage(error));
    } finally {
      setAdding(false);
    }
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const path = await uploadPropertyPhoto(file, propertyId);
      await addPath(path);
    } catch (error) {
      toastError('Upload failed', errorMessage(error));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function remove(photoId: string) {
    setDeletingId(photoId);
    try {
      await deletePropertyPhoto(propertyId, photoId);
      success('Photo removed');
      onChanged();
    } catch (error) {
      toastError('Photo not removed', errorMessage(error));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.65fr_0.9fr]">
      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sage-100 text-pine">
            <Camera className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[18px] leading-tight">Photos</h2>
            <p className="text-[11.5px] text-ink-500">
              The first photo is the cover. Add bright, honest images of the actual home.
            </p>
          </div>
        </div>

        {sorted.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-sand-300 bg-sand-50/60 px-5 py-10 text-center">
            <ImagePlus className="mx-auto h-6 w-6 text-ink-500/50" />
            <p className="mt-2 text-[13px] font-medium text-ink-800">No photos yet</p>
            <p className="mx-auto mt-1 max-w-sm text-[11.5px] leading-5 text-ink-500">
              Listings with a real cover photo receive more serious requests. Add a URL now, or upload to
              Supabase Storage when it is configured.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {sorted.map((photo, index) => (
              <div
                key={photo.id}
                className="group relative overflow-hidden rounded-2xl border border-sand-200"
              >
                <div className="aspect-[4/3]">
                  <PropertyImage photos={[photo.storage_path]} />
                </div>
                <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.1em] text-ink-600">
                  {index === 0 ? 'Cover' : `Photo ${index + 1}`}
                </div>
                <button
                  type="button"
                  onClick={() => void remove(photo.id)}
                  disabled={deletingId === photo.id}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-[#8d3527] shadow-sm transition hover:bg-white disabled:opacity-60"
                  aria-label={`Remove photo ${index + 1}`}
                >
                  {deletingId === photo.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 space-y-3 border-t border-sand-200/70 pt-5">
          <Input
            label="Add by URL or storage path"
            placeholder="https://images.example.com/home.jpg"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            leading={<ImagePlus className="h-4 w-4" />}
            hint="Useful in demo mode or when the storage bucket is public."
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" onClick={addByUrl} loading={adding} disabled={uploading}>
              Add photo
            </Button>
            <label className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-sand-300 bg-white/70 px-3 text-[12px] font-medium text-ink-700 transition hover:border-moss/40 hover:text-pine">
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Uploading…' : 'Upload from device'}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
            </label>
          </div>
          <p className="text-[10.5px] leading-5 text-ink-500">
            Device uploads require Supabase Storage and a public bucket named{' '}
            <code className="rounded bg-sand-100 px-1">property-photos</code>. You can change the bucket
            with <code className="rounded bg-sand-100 px-1">NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET</code>.
          </p>
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <p className="eyebrow">Photo guidance</p>
          <ul className="mt-2.5 space-y-2 text-[11.5px] leading-5 text-ink-600">
            <li>Use daylight and show the actual rooms, not a show-home.</li>
            <li>Include the workspace, bathroom and building entrance.</li>
            <li>Do not include people, documents or landmarks that reveal the address.</li>
            <li>Keep the cover photo horizontal; it is cropped to 4:3 in search.</li>
          </ul>
        </div>
        <div className="rounded-2xl bg-[#f4efe4]/80 p-4 text-[11px] leading-5 text-ink-600">
          Photos are moderated separately from the listing. A pending image may be visible to you before
          it appears publicly.
        </div>
      </aside>
    </div>
  );
}

export default function ManageListingPage() {
  return (
    <RequireAuth>
      <ManageListingContent />
    </RequireAuth>
  );
}
