'use client';

import { useMemo, useState } from 'react';
import { Check, Plus, Sparkles, X } from 'lucide-react';
import type { CreatePropertyInput } from '@/lib/types';
import {
  AMENITIES,
  CITY_STATE_MAP,
  CITIES,
  HOUSE_RULES,
  PROPERTY_TYPES,
} from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { ChipToggle, Input, Select, Textarea, Field } from '@/components/ui/Input';

type FormState = {
  title: string;
  description: string;
  city: string;
  neighbourhood: string;
  property_type: string;
  bedrooms: string;
  guest_capacity: string;
  amenities: string[];
  house_rules: string[];
  exact_address: string;
};

const EMPTY: FormState = {
  title: '',
  description: '',
  city: '',
  neighbourhood: '',
  property_type: 'apartment',
  bedrooms: '2',
  guest_capacity: '4',
  amenities: ['Wi-Fi', 'Kitchen', 'Hot water'],
  house_rules: ['No smoking indoors', 'Quiet hours after 10 pm'],
  exact_address: '',
};

function toFormState(initial?: Partial<CreatePropertyInput>): FormState {
  if (!initial) return EMPTY;
  return {
    title: initial.title ?? '',
    description: initial.description ?? '',
    city: initial.city ?? '',
    neighbourhood: initial.neighbourhood ?? '',
    property_type: initial.property_type ?? 'apartment',
    bedrooms: String(initial.bedrooms ?? 2),
    guest_capacity: String(initial.guest_capacity ?? 4),
    amenities: initial.amenities ?? [],
    house_rules: initial.house_rules ?? [],
    exact_address: initial.exact_address ?? '',
  };
}

export function PropertyForm({
  initial,
  submitLabel = 'Save listing',
  submitting = false,
  serverError,
  fieldErrors,
  onSubmit,
}: {
  initial?: Partial<CreatePropertyInput>;
  submitLabel?: string;
  submitting?: boolean;
  serverError?: string | null;
  fieldErrors?: Record<string, string>;
  onSubmit: (input: CreatePropertyInput) => void | Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customRule, setCustomRule] = useState('');

  const state = useMemo(() => CITY_STATE_MAP[form.city] ?? '', [form.city]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const next = { ...current };
      delete next[key as string];
      return next;
    });
  }

  function toggleList(key: 'amenities' | 'house_rules', value: string) {
    setForm((current) => {
      const list = current[key];
      return {
        ...current,
        [key]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value],
      };
    });
  }

  function addCustomRule() {
    const rule = customRule.trim();
    if (rule.length < 3) return;
    setForm((current) =>
      current.house_rules.includes(rule)
        ? current
        : { ...current, house_rules: [...current.house_rules, rule] },
    );
    setCustomRule('');
  }

  function validate(): Record<string, string> {
    const next: Record<string, string> = {};
    if (form.title.trim().length < 5) next.title = 'Use at least 5 characters.';
    if (form.title.trim().length > 120) next.title = 'Keep the title under 120 characters.';
    if (form.description.trim().length < 20)
      next.description = 'Describe the home in at least 20 characters.';
    if (!form.city) next.city = 'Choose a launch city.';
    if (form.neighbourhood.trim().length < 2) next.neighbourhood = 'Neighbourhood is required.';
    if (form.exact_address.trim().length < 10)
      next.exact_address = 'Enter the full address (kept private until a stay is confirmed).';
    const bedrooms = Number(form.bedrooms);
    if (!Number.isInteger(bedrooms) || bedrooms < 1 || bedrooms > 20)
      next.bedrooms = 'Enter 1 to 20 bedrooms.';
    const guests = Number(form.guest_capacity);
    if (!Number.isInteger(guests) || guests < 1 || guests > 30)
      next.guest_capacity = 'Enter 1 to 30 guests.';
    return next;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validate();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      city: form.city,
      state: state || CITY_STATE_MAP[form.city] || '',
      neighbourhood: form.neighbourhood.trim(),
      property_type: form.property_type,
      bedrooms: Number(form.bedrooms),
      guest_capacity: Number(form.guest_capacity),
      amenities: form.amenities,
      house_rules: form.house_rules,
      exact_address: form.exact_address.trim(),
    });
  }

  const mergedErrors = { ...errors, ...(fieldErrors ?? {}) };

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <section className="card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-sage-100 text-pine">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-[18px] leading-tight">The essentials</h2>
            <p className="text-[11.5px] text-ink-500">
              Clear, specific listings get better swap requests.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Input
            label="Listing title"
            placeholder="e.g. Bandra balcony with a sea-facing study"
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            error={mergedErrors.title}
            maxLength={120}
            required
          />

          <Textarea
            label="Description"
            placeholder="What makes the home comfortable? Mention the neighbourhood, the workspace, transport and anything a guest should know."
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            error={mergedErrors.description}
            hint="Minimum 20 characters. Avoid including the exact address here."
            maxLength={3000}
            showCount
            required
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="City"
              value={form.city}
              onChange={(event) => update('city', event.target.value)}
              options={CITIES.map((city) => ({ value: city, label: city }))}
              placeholder="Choose a city"
              error={mergedErrors.city}
              required
            />
            <Input
              label="State"
              value={state}
              placeholder="Set by city"
              readOnly
              disabled
              hint="Stored separately for Delhi NCR."
            />
            <Input
              label="Neighbourhood"
              placeholder="e.g. Bandra West"
              value={form.neighbourhood}
              onChange={(event) => update('neighbourhood', event.target.value)}
              error={mergedErrors.neighbourhood}
              maxLength={100}
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Select
              label="Property type"
              value={form.property_type}
              onChange={(event) => update('property_type', event.target.value)}
              options={PROPERTY_TYPES.map((type) => ({ value: type.value, label: type.label }))}
              required
            />
            <Input
              label="Bedrooms"
              type="number"
              min={1}
              max={20}
              value={form.bedrooms}
              onChange={(event) => update('bedrooms', event.target.value)}
              error={mergedErrors.bedrooms}
              required
            />
            <Input
              label="Guest capacity"
              type="number"
              min={1}
              max={30}
              value={form.guest_capacity}
              onChange={(event) => update('guest_capacity', event.target.value)}
              error={mergedErrors.guest_capacity}
              hint="The maximum number of guests you will host."
              required
            />
          </div>

          <Textarea
            label="Exact address"
            placeholder="Flat / house number, street, area, city, PIN"
            value={form.exact_address}
            onChange={(event) => update('exact_address', event.target.value)}
            error={mergedErrors.exact_address}
            hint="Private. Shown only to the member whose stay is confirmed, never in search results."
            rows={3}
            required
          />
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-[18px] leading-tight">Amenities</h2>
        <p className="mt-1 text-[11.5px] text-ink-500">
          Select everything a guest can reliably use during their stay.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {AMENITIES.map((amenity) => (
            <ChipToggle
              key={amenity}
              active={form.amenities.includes(amenity)}
              onClick={() => toggleList('amenities', amenity)}
            >
              {amenity}
            </ChipToggle>
          ))}
        </div>
        <p className="mt-3 text-[10.5px] text-ink-500">
          {form.amenities.length} selected · Amenities count towards the SwapScore amenities factor.
        </p>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-[18px] leading-tight">House rules</h2>
        <p className="mt-1 text-[11.5px] text-ink-500">
          Be explicit. Guests see these before requesting and again before confirming.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {HOUSE_RULES.map((rule) => (
            <ChipToggle
              key={rule}
              active={form.house_rules.includes(rule)}
              onClick={() => toggleList('house_rules', rule)}
            >
              {rule}
            </ChipToggle>
          ))}
        </div>

        {form.house_rules.filter((rule) => !HOUSE_RULES.includes(rule as (typeof HOUSE_RULES)[number]))
          .length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {form.house_rules
              .filter((rule) => !HOUSE_RULES.includes(rule as (typeof HOUSE_RULES)[number]))
              .map((rule) => (
                <span
                  key={rule}
                  className="inline-flex items-center gap-1 rounded-full border border-sage-200 bg-sage-50 px-3 py-1.5 text-[12px] text-pine"
                >
                  {rule}
                  <button
                    type="button"
                    onClick={() => toggleList('house_rules', rule)}
                    aria-label={`Remove rule: ${rule}`}
                    className="rounded-full p-0.5 transition hover:bg-white"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
          </div>
        )}

        <Field label="Add a custom rule" hint="Up to 500 characters. Keep it specific and enforceable.">
          <div className="flex gap-2">
            <input
              value={customRule}
              onChange={(event) => setCustomRule(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  addCustomRule();
                }
              }}
              placeholder="e.g. Building gate closes at 11 pm"
              maxLength={120}
              className="h-11 w-full rounded-xl border border-sand-300 bg-white/90 px-3.5 text-sm text-ink-800 outline-none transition focus:border-moss focus:ring-2 focus:ring-moss/15"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={addCustomRule}
              leading={<Plus className="h-4 w-4" />}
            >
              Add
            </Button>
          </div>
        </Field>
      </section>

      {serverError && (
        <p
          className="rounded-xl border border-[#e3bdb4] bg-[#fdf4f2] px-3.5 py-3 text-[12px] leading-5 text-[#8d3527]"
          role="alert"
        >
          {serverError}
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border border-sand-200 bg-white/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-1.5 text-[10.5px] leading-5 text-ink-500">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" />
          Listings are reviewed before going live. The server controls your listing status and SwapScore.
        </p>
        <Button type="submit" size="lg" loading={submitting} className="shrink-0">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
