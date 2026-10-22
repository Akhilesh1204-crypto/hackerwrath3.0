'use client';

import { useEffect, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LockKeyhole, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { LoadingBlock } from '@/components/ui/Primitives';
import { Button } from '@/components/ui/Button';

export function RequireAuth({
  children,
  adminOnly = false,
}: {
  children: ReactNode;
  adminOnly?: boolean;
}) {
  const { status, isAdmin } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return <LoadingBlock label="Checking your session" className="py-24" />;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container-page py-24">
        <div className="mx-auto max-w-md rounded-3xl border border-sand-200 bg-white/80 p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-sage-100 text-pine">
            <LockKeyhole className="h-5 w-5" />
          </div>
          <h2 className="text-xl">Sign in to continue</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            This page shows your homes, trips and credits. Sign in or explore the demo to preview it.
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={() => router.push(`/login?next=${encodeURIComponent(pathname)}`)}>
              Sign in
            </Button>
            <Button variant="secondary" onClick={() => router.push('/login')}>
              Demo mode
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="container-page py-24">
        <div className="mx-auto max-w-md rounded-3xl border border-sand-200 bg-white/80 p-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-[#f8e6e1] text-[#8d3527]">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <h2 className="text-xl">Admin access required</h2>
          <p className="mt-2 text-sm leading-6 text-ink-500">
            Moderation and verification decisions are limited to authorised staff accounts.
          </p>
          <Link href="/" className="mt-5 inline-block text-sm font-medium text-pine link-underline">
            Back to SwapStay
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
