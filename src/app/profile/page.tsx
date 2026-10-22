'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck,
  Check,
  CircleUserRound,
  FileCheck2,
  Info,
  Loader2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  ShieldQuestion,
  Upload,
  UserRound,
} from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/components/auth/AuthProvider';
import { PageHeader } from '@/components/layout/PageHeader';
import { VerificationBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Input, Textarea } from '@/components/ui/Input';
import { Avatar, ErrorState, LoadingBlock } from '@/components/ui/Primitives';
import { useToast } from '@/components/ui/Toast';
import { getProfile, submitVerification, updateProfile, uploadVerificationDocument } from '@/lib/api';
import { ApiError, errorMessage } from '@/lib/api/client';
import { formatDate } from '@/lib/dates';
import { useApiQuery } from '@/lib/hooks';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

function ProfileContent() {
  const { user, profile: authProfile, refreshProfile } = useAuth();
  const query = useApiQuery(() => getProfile(), []);
  const profile = query.data ?? authProfile;

  if (query.loading && !profile) return <LoadingBlock label="Loading your profile" className="py-24" />;

  if (!profile) {
    return (
      <div className="container-page py-16">
        <ErrorState
          title="Profile unavailable"
          message={query.error ?? 'Your member profile could not be loaded. It may still be provisioning.'}
          code={query.errorCode}
          onRetry={query.refresh}
        />
      </div>
    );
  }

  const completeness = [
    Boolean(profile.display_name),
    Boolean(profile.bio && profile.bio.length > 20),
    Boolean(profile.phone),
    profile.verification_status === 'verified',
  ].filter(Boolean).length;
  const completenessPct = completeness * 25;

  return (
    <div className="container-page py-8 sm:py-12">
      <PageHeader
        eyebrow="Account"
        title={
          <>
            Your <span className="italic text-moss">profile</span>
          </>
        }
        description="How other members see you before a swap or stay. Your address and documents are never shown here."
      />

      {/* identity header */}
      <section className="mt-6 overflow-hidden rounded-3xl border border-sand-200/90 bg-white/90 shadow-soft">
        <div className="h-20 bg-gradient-to-r from-pine via-moss to-sage-300 sm:h-24" aria-hidden />
        <div className="flex flex-col gap-5 px-5 pb-5 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:pb-6">
          <div className="flex items-end gap-4">
            <div className="-mt-9 rounded-full bg-white p-1 shadow-sm sm:-mt-11">
              <Avatar name={profile.display_name} size="lg" className="h-16 w-16 text-lg sm:h-20 sm:w-20 sm:text-xl" />
            </div>
            <div className="pb-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[22px] leading-tight">{profile.display_name}</h2>
                <VerificationBadge status={profile.verification_status} />
              </div>
              <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {user?.email ?? 'Member account'}
                </span>
                <span>Member since {formatDate(profile.created_at.slice(0, 10))}</span>
              </p>
            </div>
          </div>
          <div className="w-full max-w-[220px]">
            <div className="flex items-baseline justify-between gap-2 text-[10.5px]">
              <span className="font-semibold uppercase tracking-[0.12em] text-ink-500">Profile strength</span>
              <span className="font-semibold text-ink-800">{completenessPct}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-moss to-pine transition-all"
                style={{ width: `${completenessPct}%` }}
              />
            </div>
            <p className="mt-1 text-[10px] leading-4 text-ink-500">
              Complete profiles get more accepted requests.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-6">
          <DetailsForm
            profile={profile}
            onSaved={() => {
              query.refresh();
              void refreshProfile();
            }}
          />

          <VerificationPanel
            profile={profile}
            userId={user?.id ?? profile.id}
            onSubmitted={() => {
              query.refresh();
              void refreshProfile();
            }}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-[92px] lg:self-start">
          <div className="card p-5">
            <p className="eyebrow">Account</p>
            <dl className="mt-3 space-y-3 text-[12px]">
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-ink-500">
                  <Mail className="h-3.5 w-3.5" /> Email
                </dt>
                <dd className="max-w-[190px] truncate text-right font-medium text-ink-800">
                  {user?.email ?? '—'}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-ink-500">
                  <ShieldCheck className="h-3.5 w-3.5" /> Role
                </dt>
                <dd className="font-medium capitalize text-ink-800">{profile.role}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-ink-500">
                  <CircleUserRound className="h-3.5 w-3.5" /> Member since
                </dt>
                <dd className="font-medium text-ink-800">{formatDate(profile.created_at.slice(0, 10))}</dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="flex items-center gap-1.5 text-ink-500">
                  <UserRound className="h-3.5 w-3.5" /> Display name
                </dt>
                <dd className="max-w-[190px] truncate text-right font-medium text-ink-800">
                  {profile.display_name}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-[#e6cf9d] bg-[#fbf3df] p-5">
            <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-[#7a5a1c]">
              <ShieldQuestion className="h-4 w-4" /> What verification unlocks
            </p>
            <ul className="mt-2 space-y-2 text-[11px] leading-5 text-[#8a6a2a]">
              <li>Hosting and requesting credit stays.</li>
              <li>Participation in direct swaps.</li>
              <li>A verified badge next to your name.</li>
            </ul>
            <p className="mt-2.5 text-[10.5px] leading-5 text-[#8a6a2a]/85">
              Verification is decided by the platform, never by the client. Submitting a document does not
              grant the badge automatically.
            </p>
          </div>

          <div className="card p-5">
            <p className="eyebrow">Privacy</p>
            <ul className="mt-2.5 space-y-2 text-[11px] leading-5 text-ink-600">
              <li className="flex gap-2">
                <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                Documents go to a private bucket, not to your public profile.
              </li>
              <li className="flex gap-2">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-500" />
                Your phone number is used for stay coordination and is never shown in search.
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
                You can edit your bio and phone at any time. Verification status is read-only.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl bg-sage-50 p-4 text-[10.5px] leading-5 text-pine">
            Swapping is reciprocal. A clear, honest bio with your travel style makes a proposal far more
            likely to be accepted.
          </div>
        </aside>
      </div>
    </div>
  );
}

function DetailsForm({ profile, onSaved }: { profile: Profile; onSaved: () => void }) {
  const { success, error: toastError } = useToast();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [bio, setBio] = useState(profile.bio ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = useMemo(
    () =>
      displayName !== profile.display_name ||
      bio !== (profile.bio ?? '') ||
      phone !== (profile.phone ?? ''),
    [displayName, bio, phone, profile],
  );

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    const name = displayName.trim();
    if (name.length < 2) next.display_name = 'Use at least 2 characters.';
    if (name.length > 60) next.display_name = 'Keep your name under 60 characters.';
    if (bio.trim().length > 500) next.bio = 'Keep your bio under 500 characters.';
    if (phone.trim() && !/^[+0-9()\-\s]{7,20}$/.test(phone.trim())) {
      next.phone = 'Use digits, spaces, brackets or a leading +.';
    }
    return next;
  }

  async function save() {
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setSaving(true);
    setServerError(null);
    setErrors({});
    try {
      const updated = await updateProfile({
        display_name: displayName.trim(),
        bio: bio.trim() ? bio.trim() : null,
        phone: phone.trim() ? phone.trim() : null,
      });
      success('Profile updated', `Your profile now shows “${updated.display_name}”.`);
      onSaved();
    } catch (error) {
      const message = errorMessage(error);
      setServerError(message);
      if (error instanceof ApiError) setErrors(error.fieldErrors);
      toastError('Profile not saved', message);
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setDisplayName(profile.display_name);
    setBio(profile.bio ?? '');
    setPhone(profile.phone ?? '');
    setErrors({});
    setServerError(null);
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-sage-100 text-pine">
          <UserRound className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-[18px] leading-tight">Profile details</h2>
          <p className="text-[11.5px] text-ink-500">
            These are shown on swap requests and after a stay is confirmed.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Display name"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            error={errors.display_name}
            maxLength={60}
            required
          />
          <Input
            label="Phone"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            error={errors.phone}
            placeholder="+91 98200 11223"
            hint="Include the country code. Never shown publicly."
          />
        </div>

        <Textarea
          label="Bio"
          value={bio}
          onChange={(event) => setBio(event.target.value)}
          error={errors.bio}
          hint="Travel style, work, what you look for in a home. Keep it human."
          maxLength={500}
          showCount
          rows={5}
        />

        {serverError && (
          <p
            className="rounded-xl border border-[#e3bdb4] bg-[#fdf4f2] px-3.5 py-3 text-[12px] leading-5 text-[#8d3527]"
            role="alert"
          >
            {serverError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-sand-200/70 pt-4">
          <p className="text-[10.5px] text-ink-500">
            {dirty ? 'You have unsaved changes.' : 'Everything is up to date.'}
          </p>
          <div className="flex gap-2">
            {dirty && (
              <Button variant="ghost" size="sm" onClick={reset} disabled={saving}>
                Reset
              </Button>
            )}
            <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function VerificationPanel({
  profile,
  userId,
  onSubmitted,
}: {
  profile: Profile;
  userId: string;
  onSubmitted: () => void;
}) {
  const { success, error: toastError } = useToast();
  const [idPath, setIdPath] = useState('');
  const [proofPath, setProofPath] = useState('');
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const status = profile.verification_status;

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const path = await uploadVerificationDocument(file, userId);
      setIdPath(path);
      success('Document uploaded', 'Now confirm and submit it for review.');
    } catch (uploadError) {
      const message = errorMessage(uploadError);
      setError(message);
      toastError('Upload failed', message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function submit() {
    if (idPath.trim().length < 3) {
      setError('Add an ID document path or upload a file first.');
      return;
    }
    if (!confirmed) {
      setError('Please confirm the document belongs to you and may be reviewed.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitVerification({
        id_document_path: idPath.trim(),
        property_proof_path: proofPath.trim() || undefined,
      });
      success('Verification submitted', 'The team will review your document and update your badge.');
      setIdPath('');
      setProofPath('');
      setConfirmed(false);
      onSubmitted();
    } catch (submitError) {
      const message = errorMessage(submitError);
      setError(message);
      toastError('Verification not submitted', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sage-100 text-pine">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[18px] leading-tight">Verification</h2>
            <p className="text-[11.5px] text-ink-500">A manual check of identity and home ownership.</p>
          </div>
        </div>
        <VerificationBadge status={status} />
      </div>

      {status === 'verified' && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-sage-200 bg-sage-50 p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-moss shadow-sm">
            <BadgeCheck className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-pine">You are a verified member</p>
            <p className="mt-0.5 text-[11px] leading-5 text-pine/80">
              You can host, request credit stays and propose direct swaps. The platform may re-check
              verification if account details change materially.
            </p>
          </div>
        </div>
      )}

      {status === 'pending' && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#e6cf9d] bg-[#fbf3df] p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-[#8a6420] shadow-sm">
            <FileCheck2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-semibold text-[#7a5a1c]">Documents are under review</p>
            <p className="mt-0.5 text-[11px] leading-5 text-[#8a6a2a]">
              No action is needed right now. You will see the badge update on this page once a decision is
              recorded.
            </p>
          </div>
        </div>
      )}

      {(status === 'unverified' || status === 'rejected') && (
        <div className="mt-5 space-y-4">
          {status === 'rejected' && (
            <p className="rounded-xl border border-[#e3bdb4] bg-[#fdf4f2] px-3.5 py-3 text-[11.5px] leading-5 text-[#8d3527]">
              Your last submission was declined. Check that the document is legible, current and matches
              your profile name, then submit again.
            </p>
          )}

          <div className="rounded-2xl bg-sand-50/80 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              What to submit
            </p>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-ink-600">
              <li>• A government photo ID (mask any number you do not need to share).</li>
              <li>• Optional: a utility bill or ownership document for your listed home.</li>
              <li>• Images or PDF, clear and uncropped. Never send a password or OTP.</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <Input
              label="ID document path"
              placeholder="Upload a file or paste a private storage path"
              value={idPath}
              onChange={(event) => setIdPath(event.target.value)}
              wrapperClassName="flex-1"
              required
            />
            <label
              className={cn(
                'inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-sand-300 bg-white/70 px-3.5 text-[12px] font-medium text-ink-700 transition hover:border-moss/40 hover:text-pine',
                uploading && 'cursor-wait opacity-70',
              )}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
              {uploading ? 'Uploading…' : 'Upload ID'}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,.pdf"
                className="sr-only"
                disabled={uploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void upload(file);
                }}
              />
            </label>
          </div>

          <Input
            label="Property proof (optional)"
            placeholder="Ownership deed, lease or utility bill path"
            value={proofPath}
            onChange={(event) => setProofPath(event.target.value)}
            hint="Speeds up review for hosts. Stored privately and never shown to guests."
          />

          <Field>
            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-sand-50/70 px-3.5 py-3 text-[11px] leading-5 text-ink-600">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(event) => setConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-sand-300 text-pine focus:ring-moss/30"
              />
              I confirm this document belongs to me and may be reviewed by authorised SwapStay staff. I
              understand the client cannot approve verification.
            </label>
          </Field>

          {error && (
            <p className="rounded-xl border border-[#e3bdb4] bg-[#fdf4f2] px-3.5 py-3 text-[11.5px] leading-5 text-[#8d3527]" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end">
            <Button
              onClick={submit}
              loading={submitting}
              disabled={!confirmed || uploading}
              leading={<ShieldCheck className="h-4 w-4" />}
            >
              Submit for verification
            </Button>
          </div>

          <p className="text-[10.5px] leading-5 text-ink-500">
            Uploads require Supabase Storage with a private bucket named{' '}
            <code className="rounded bg-sand-100 px-1">verification</code> (configurable with{' '}
            <code className="rounded bg-sand-100 px-1">NEXT_PUBLIC_SUPABASE_VERIFICATION_BUCKET</code>). If
            storage is not configured, paste a path provided by the platform.
          </p>
        </div>
      )}

      <p className="mt-4 border-t border-sand-200/70 pt-3 text-[10.5px] leading-5 text-ink-500">
        Need to correct something? Report the issue from the relevant booking in{' '}
        <Link href="/bookings" className="font-medium text-pine underline decoration-moss/40">
          Trips & stays
        </Link>{' '}
        so the team has the right context. Avoid submitting duplicate documents.
      </p>
    </section>
  );
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <ProfileContent />
    </RequireAuth>
  );
}
