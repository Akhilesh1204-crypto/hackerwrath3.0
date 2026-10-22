'use client';

import type { ScoreBreakdown, SwapScoreGrade } from '@/lib/types';
import { SCORE_FACTORS } from '@/lib/constants';
import { ScoreRing } from '@/components/ui/Primitives';
import { cn } from '@/lib/utils';

export function ScorePanel({
  breakdown,
  total,
  grade,
  evidenceStatus,
  methodVersion,
  assessedAt,
  compact = false,
  className,
}: {
  breakdown: ScoreBreakdown;
  total: number;
  grade: SwapScoreGrade;
  evidenceStatus?: string;
  methodVersion?: string;
  assessedAt?: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('rounded-3xl border border-sand-200/90 bg-white/90 p-5 shadow-soft', className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">SwapScore</p>
          <p className="mt-1 font-display text-2xl leading-tight text-ink-900">
            Grade {grade} · {total.toFixed(1)}/100
          </p>
          <p className="mt-1 text-[12px] leading-5 text-ink-500">
            An explainable property score, not a guarantee. Verification is shown separately.
          </p>
        </div>
        <ScoreRing score={total} grade={grade} size={compact ? 58 : 74} />
      </div>

      <div className="mt-5 space-y-3">
        {SCORE_FACTORS.map((factor) => {
          const value = breakdown[factor.key as keyof ScoreBreakdown];
          return (
            <div key={factor.key}>
              <div className="flex items-baseline justify-between gap-2 text-[12px]">
                <span className="text-ink-700">{factor.label}</span>
                <span className="tabular-nums text-ink-500">
                  <span className="font-medium text-ink-800">{value}</span>
                  <span className="ml-1 text-[10px] text-ink-500/80">· {factor.weight}%</span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-sand-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-moss to-sage-400"
                  style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-sand-200/70 pt-3 text-[10.5px] uppercase tracking-[0.1em] text-ink-500/80">
        <span>Method v{methodVersion ?? '1.0'}</span>
        {evidenceStatus && <span className="normal-case tracking-normal">Evidence: {evidenceStatus}</span>}
        {assessedAt && (
          <span className="normal-case tracking-normal">
            Assessed {new Date(assessedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        )}
      </div>
    </div>
  );
}
