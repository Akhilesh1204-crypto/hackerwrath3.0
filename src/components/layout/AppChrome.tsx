'use client';

import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { resetDemoDB } from '@/lib/demo/store';
import { FlaskConical, RotateCcw, X } from 'lucide-react';

const authRoutes = new Set(['/login', '/signup', '/forgot-password']);

export function AppChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAuthRoute = authRoutes.has(pathname);

  if (isAuthRoute) {
    return <main className="flex min-h-screen flex-1 flex-col">{children}</main>;
  }

  return (
    <>
      <DemoBanner />
      {header}
      <main className="flex-1">{children}</main>
      {footer}
    </>
  );
}

function DemoBanner() {
  const { isDemo, leaveDemo } = useAuth();
  const [resetOpen, setResetOpen] = useState(false);
  if (!isDemo) return null;

  function resetDemo() {
    resetDemoDB();
    setResetOpen(false);
    window.location.reload();
  }

  return (
    <>
      <div className="border-b border-[#e6cf9d] bg-[#fbf3df]">
        <div className="container-page flex flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-2 text-[11px] font-medium text-[#7a5a1c]">
            <FlaskConical className="h-3.5 w-3.5" />
            <span className="rounded-full bg-[#f1e0b7] px-2 py-0.5 font-semibold uppercase tracking-[0.12em]">
              Demo mode
            </span>
            <span className="text-[#8a6a2a]">
              Sample homes and members. Changes stay in this browser until you reset the demo.
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-[#7a5a1c] transition hover:bg-[#f1e0b7]"
            >
              Reset demo <RotateCcw className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={leaveDemo}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium text-[#7a5a1c] transition hover:bg-[#f1e0b7]"
            >
              Exit demo <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset the demo?"
        description="This restores the seeded homes, swaps, bookings and wallet. Anything you changed in this browser will be lost."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Keep my changes
            </Button>
            <Button variant="danger" onClick={resetDemo} leading={<RotateCcw className="h-4 w-4" />}>
              Reset demo
            </Button>
          </>
        }
      >
        <p className="text-[12.5px] leading-6 text-ink-600">
          The demo is local to this browser. Resetting does not affect the real backend or any live
          account.
        </p>
      </Modal>
    </>
  );
}
