'use client';

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const controlBase =
  'w-full rounded-xl border border-sand-300 bg-white/90 text-sm text-ink-800 shadow-[0_1px_0_rgba(11,31,27,0.03)] transition placeholder:text-ink-500/45 focus:border-moss focus:outline-none focus:ring-2 focus:ring-moss/15 disabled:cursor-not-allowed disabled:bg-sand-100/80';

interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
  counter?: string;
}

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  className,
  children,
  counter,
}: FieldShellProps) {
  return (
    <div className={cn('w-full', className)}>
      {(label || counter) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && (
            <label htmlFor={htmlFor} className="text-[13px] font-medium text-ink-700">
              {label}
              {required && <span className="ml-0.5 text-clay-500">*</span>}
            </label>
          )}
          {counter && <span className="text-[11px] tabular-nums text-ink-500/70">{counter}</span>}
        </div>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-[#9c3b2e]" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 hint">{hint}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leading, trailing, className, wrapperClassName, id, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={wrapperClassName}
    >
      <div className="relative">
        {leading && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-500/70">
            {leading}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(
            controlBase,
            'h-11 px-3.5',
            leading && 'pl-10',
            trailing && 'pr-10',
            error && 'border-[#c07a6c] focus:border-[#9c3b2e] focus:ring-[#9c3b2e]/15',
            className,
          )}
          {...props}
        />
        {trailing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500/70">{trailing}</span>
        )}
      </div>
    </Field>
  );
});

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
  showCount?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, wrapperClassName, id, required, showCount, maxLength, value, ...props },
  ref,
) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const length = typeof value === 'string' ? value.length : 0;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={textareaId}
      className={wrapperClassName}
      counter={showCount && maxLength ? `${length}/${maxLength}` : undefined}
    >
      <textarea
        ref={ref}
        id={textareaId}
        required={required}
        maxLength={maxLength}
        value={value}
        aria-invalid={Boolean(error)}
        className={cn(
          controlBase,
          'min-h-[120px] resize-y px-3.5 py-3 leading-relaxed',
          error && 'border-[#c07a6c] focus:border-[#9c3b2e] focus:ring-[#9c3b2e]/15',
          className,
        )}
        {...props}
      />
    </Field>
  );
});

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  wrapperClassName?: string;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, wrapperClassName, id, required, options, placeholder, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={selectId}
      className={wrapperClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={Boolean(error)}
          className={cn(
            controlBase,
            'h-11 cursor-pointer appearance-none px-3.5 pr-10',
            error && 'border-[#c07a6c] focus:border-[#9c3b2e] focus:ring-[#9c3b2e]/15',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500/60"
          aria-hidden
        />
      </div>
    </Field>
  );
});

export function ChipToggle({
  active,
  children,
  onClick,
  disabled,
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-[13px] transition',
        active
          ? 'border-moss/40 bg-sage-100 text-pine shadow-[inset_0_0_0_1px_rgba(31,111,92,0.12)]'
          : 'border-sand-300 bg-white/70 text-ink-600 hover:border-moss/30 hover:text-pine',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      {children}
    </button>
  );
}
