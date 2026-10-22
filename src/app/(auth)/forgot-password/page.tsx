'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send the reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title={sent ? 'Reset link sent' : 'Reset your password'}
      description={
        sent
          ? 'If an account exists for that address, a secure reset link is on its way.'
          : 'Enter the email you used to join SwapStay and we will send a secure link to choose a new password.'
      }
    >
      {sent ? (
        <div className="rounded-2xl border border-sage-200 bg-sage-50 p-5 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-moss shadow-sm">
            <MailCheck className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-ink-900">{email}</p>
          <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">
            The link expires shortly for security. If nothing arrives, check spam or contact the pilot
            team.
          </p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4" noValidate>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            leading={<Mail className="h-4 w-4" />}
            error={error ?? undefined}
            required
          />
          <Button type="submit" size="lg" className="w-full" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}

      <Link
        href="/login"
        className="mt-5 inline-flex items-center gap-1.5 text-[12px] font-medium text-pine link-underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
      </Link>
    </AuthShell>
  );
}
