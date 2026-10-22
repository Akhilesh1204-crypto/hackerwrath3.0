'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Flag, ShieldAlert } from 'lucide-react';
import type { ReportCategory, ReportTarget } from '@/lib/types';
import { createReport } from '@/lib/api';
import { errorMessage } from '@/lib/api/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Field, Select, Textarea, Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

const categories: { value: ReportCategory; label: string }[] = [
  { value: 'safety', label: 'Safety concern' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'fraud', label: 'Fraud or scam' },
  { value: 'misrepresentation', label: 'Listing is misleading' },
  { value: 'other', label: 'Something else' },
];

export function ReportModal({
  open,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: {
  open: boolean;
  onClose: () => void;
  targetType: ReportTarget;
  targetId: string;
  targetLabel: string;
}) {
  const { status } = useAuth();
  const { success, error: toastError } = useToast();
  const [category, setCategory] = useState<ReportCategory>('safety');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCategory('safety');
    setDescription('');
    setEvidenceUrl('');
    setError(null);
    setDone(false);
  }, [open]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (description.trim().length < 20) {
      setError('Please describe what happened in at least 20 characters.');
      return;
    }
    if (evidenceUrl && !/^https?:\/\/\S+$/i.test(evidenceUrl.trim())) {
      setError('Evidence links must start with http:// or https://.');
      return;
    }

    setSubmitting(true);
    try {
      await createReport({
        target_type: targetType,
        target_id: targetId,
        category,
        description: description.trim(),
        evidence_urls: evidenceUrl ? [evidenceUrl.trim()] : [],
      });
      setDone(true);
      success('Report filed', 'The trust and safety team will review it and track the outcome.');
    } catch (err) {
      const message = errorMessage(err);
      setError(message);
      toastError('Report not filed', message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={done ? 'Report received' : 'Report an issue'}
      description={done ? undefined : `Tell us what happened with ${targetLabel}. Reports are reviewed by authorised staff.`}
      size="md"
    >
      {done ? (
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-sage-100 text-moss">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg">Thank you for flagging this</h3>
          <p className="mx-auto mt-2 max-w-sm text-[12.5px] leading-6 text-ink-500">
            Your report is marked open and linked to {targetLabel}. You will see status changes in your
            reports list, and we will contact you if we need more detail.
          </p>
          <Button className="mt-5" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : status !== 'authenticated' ? (
        <div className="rounded-2xl border border-[#e6cf9d] bg-[#fbf3df] p-4 text-center">
          <ShieldAlert className="mx-auto h-6 w-6 text-[#7a5a1c]" />
          <p className="mt-2 text-[13px] font-semibold text-[#7a5a1c]">Sign in to file a report</p>
          <p className="mt-1 text-[11.5px] leading-5 text-[#8a6a2a]">
            We link reports to a member account so the team can follow up safely and privately.
          </p>
          <Link href="/login" className="mt-3 inline-block text-[12px] font-semibold text-[#7a5a1c] link-underline">
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-sand-200 bg-white/70 p-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#f8e6e1] text-[#8d3527]">
              <Flag className="h-4 w-4" />
            </span>
            <div>
              <p className="text-[12.5px] font-medium text-ink-900">{targetLabel}</p>
              <p className="text-[11px] text-ink-500">
                Reports never change a booking or balance by themselves. Any credit adjustment is recorded
                separately with an audit trail.
              </p>
            </div>
          </div>

          <Select
            label="Category"
            value={category}
            onChange={(event) => setCategory(event.target.value as ReportCategory)}
            options={categories}
            required
          />

          <Textarea
            label="What happened?"
            placeholder="Include dates, what you expected, and anything the team should check. Please avoid sharing private addresses or documents."
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            maxLength={2000}
            showCount
            required
            error={error ?? undefined}
          />

          <Input
            label="Evidence link (optional)"
            type="url"
            placeholder="https://…"
            value={evidenceUrl}
            onChange={(event) => setEvidenceUrl(event.target.value)}
            hint="A private link to a photo or document. Do not paste sensitive identity numbers."
          />

          <Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting} leading={<Flag className="h-4 w-4" />}>
                Submit report
              </Button>
            </div>
          </Field>
        </form>
      )}
    </Modal>
  );
}
