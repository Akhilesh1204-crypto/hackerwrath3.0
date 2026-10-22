'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Coins, Eye, ShieldCheck, Sparkles } from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PageHeader } from '@/components/layout/PageHeader';
import { PropertyForm } from '@/components/property/PropertyForm';
import { useToast } from '@/components/ui/Toast';
import { createProperty } from '@/lib/api';
import { ApiError, errorMessage } from '@/lib/api/client';
import type { CreatePropertyInput } from '@/lib/types';

function NewListingContent() {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function submit(input: CreatePropertyInput) {
    setSubmitting(true);
    setServerError(null);
    setFieldErrors({});
    try {
      const property = await createProperty(input);
      success('Listing submitted', 'It is now in review. You can add photos and availability next.');
      router.push(`/listings/${property.id}`);
    } catch (error) {
      const message = errorMessage(error);
      setServerError(message);
      if (error instanceof ApiError) setFieldErrors(error.fieldErrors);
      toastError('Listing not created', message);
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

      <PageHeader
        className="mt-3"
        eyebrow="Hosting"
        title={
          <>
            List the home you <span className="italic text-moss">already have</span>
          </>
        }
        description="Add the details guests need to decide. Exact addresses stay private until a stay is confirmed, and every listing is reviewed before it goes live."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.65fr_0.9fr]">
        <PropertyForm
          submitLabel="Submit for review"
          submitting={submitting}
          serverError={serverError}
          fieldErrors={fieldErrors}
          onSubmit={submit}
        />

        <aside className="space-y-4 lg:sticky lg:top-[92px] lg:self-start">
          <div className="card p-5">
            <p className="eyebrow">What happens next</p>
            <ol className="mt-3 space-y-3">
              {[
                {
                  title: 'Review',
                  body: 'The team checks the listing, ownership signal and presentation. Most reviews complete within two working days.',
                },
                {
                  title: 'Photos & calendar',
                  body: 'After submitting, add photos and publish the nights you can host. Confirmed bookings always override availability.',
                },
                {
                  title: 'Requests & swaps',
                  body: 'Guests request credit stays; members can also propose direct swaps. You approve every stay before it confirms.',
                },
              ].map((step, index) => (
                <li key={step.title} className="flex gap-3">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-100 text-[11px] font-semibold text-pine">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-[12.5px] font-semibold text-ink-900">{step.title}</p>
                    <p className="mt-0.5 text-[11.5px] leading-5 text-ink-500">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-3xl border border-sand-200/90 bg-[#f4efe4]/70 p-5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-500">
              <Coins className="h-3.5 w-3.5 text-gold-500" /> Earn while you host
            </p>
            <p className="mt-2 text-[12.5px] leading-6 text-ink-600">
              Each eligible hosted night earns one credit in the pilot. Spend credits on a later stay —
              there is no cash redemption.
            </p>
            <p className="mt-2 text-[10.5px] leading-5 text-ink-500">
              The rate is a hypothesis, not a valuation. It stays configurable while the pilot validates
              fairness.
            </p>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2 text-[12.5px] font-medium text-ink-800">
              <ShieldCheck className="h-4 w-4 text-moss" /> Privacy by default
            </div>
            <ul className="mt-2 space-y-1.5 text-[11px] leading-5 text-ink-500">
              <li className="flex gap-2">
                <Eye className="mt-0.5 h-3 w-3 shrink-0" /> Search shows the neighbourhood only.
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0" /> Your exact address is released on
                confirmation.
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function NewListingPage() {
  return (
    <RequireAuth>
      <NewListingContent />
    </RequireAuth>
  );
}
