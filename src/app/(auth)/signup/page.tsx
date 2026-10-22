'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, KeyRound, Mail, UserRound, MailCheck } from 'lucide-react';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingBlock } from '@/components/ui/Primitives';
import { useToast } from '@/components/ui/Toast';

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { signUp, enterDemo, status } = useAuth();
  const { error: toastError } = useToast();

  const next = params.get('next') || '/profile';
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    if (status === 'authenticated' && !needsConfirmation) router.replace(next);
  }, [status, router, next, needsConfirmation]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (displayName.trim().length < 2) {
      setError('Tell us your name (at least 2 characters).');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setError('Use at least 8 characters for your password.');
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(displayName.trim(), email.trim(), password);
      if (result.needsConfirmation) {
        setNeedsConfirmation(true);
      } else {
        router.replace(next);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not create your account.';
      setError(message);
      toastError('Sign up failed', message);
    } finally {
      setLoading(false);
    }
  }

  if (needsConfirmation) {
    return (
      <AuthShell
        eyebrow="One more step"
        title="Check your inbox"
        description="We sent a confirmation link to finish creating your SwapStay account."
      >
        <div className="rounded-2xl border border-sage-200 bg-sage-50 p-5 text-center">
          <span className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-moss shadow-sm">
            <MailCheck className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-medium text-ink-900">{email}</p>
          <p className="mt-1.5 text-[12.5px] leading-6 text-ink-500">
            Open the link in that email, then come back and sign in. If it does not arrive in a few
            minutes, check spam or try a different address.
          </p>
        </div>
        <Link href="/login" className="mt-5 block">
          <Button variant="secondary" className="w-full">
            Back to sign in
          </Button>
        </Link>
        <button
          type="button"
          onClick={() => {
            enterDemo();
            router.replace('/search');
          }}
          className="mt-4 w-full text-center text-[12px] font-medium text-pine link-underline"
        >
          Or explore the demo while you wait
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Join the pilot"
      title="Create your SwapStay account"
      description="List the nights you can host, discover verified homes, and arrange a swap or a credit stay."
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Input
          label="Full name"
          autoComplete="name"
          placeholder="Aarav Sharma"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          leading={<UserRound className="h-4 w-4" />}
          hint="This is the name other members will see."
          required
        />
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          leading={<Mail className="h-4 w-4" />}
          required
        />
        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          leading={<KeyRound className="h-4 w-4" />}
          trailing={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="rounded p-0.5 text-ink-500/70 transition hover:text-ink-800"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          }
          required
        />
        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />

        {error && (
          <p className="rounded-xl border border-[#e3bdb4] bg-[#fdf4f2] px-3 py-2 text-[12px] leading-5 text-[#8d3527]" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Create account
        </Button>

        <p className="text-[10.5px] leading-5 text-ink-500">
          By joining you agree to the pilot terms: credits have no cash value, exact addresses stay
          private until a stay is confirmed, and both members must consent to a swap.
        </p>
      </form>

      <p className="mt-5 text-center text-[12px] text-ink-500">
        Already a member?{' '}
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-pine link-underline">
          Sign in
        </Link>
      </p>

      <button
        type="button"
        onClick={() => {
          enterDemo();
          router.replace('/search');
        }}
        className="mt-6 w-full rounded-xl border border-dashed border-sand-300 bg-sand-100/50 px-4 py-3 text-[12px] font-medium text-ink-700 transition hover:border-moss/40 hover:text-pine"
      >
        Prefer to look around first? Open demo mode
      </button>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<LoadingBlock label="Loading sign up" className="min-h-screen" />}>
      <SignupForm />
    </Suspense>
  );
}
