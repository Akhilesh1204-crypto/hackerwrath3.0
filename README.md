# SwapStay frontend

Standalone Next.js frontend for the SwapStay API (`hackerwrath3.0`). It uses the same-origin `/api` path, proxied to `BACKEND_URL` by `next.config.mjs`.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open <http://localhost:3000>.

Set `BACKEND_URL` to the backend URL and use the same Supabase project values as the backend:

```env
BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

Optional Supabase Storage buckets are configured with `NEXT_PUBLIC_SUPABASE_PHOTO_BUCKET` and `NEXT_PUBLIC_SUPABASE_VERIFICATION_BUCKET`.

## Demo mode

Demo mode is available from the sign-in page and works without backend or Supabase keys. It provides seeded homes, members, swaps, bookings, wallet activity, reports, and an admin verification queue. Changes are stored only in this browser. Use **Reset demo** in the banner to restore the seed data, or **Exit demo** to return to real authentication.

`NEXT_PUBLIC_DEMO_MODE=true` makes demo mode the default; it can still be exited in the UI.

## Checks

```bash
npm run typecheck
npm run build
```

The client displays server/API errors and treats server responses as authoritative for verification, availability, credit balances, bookings, and swaps.

## Backend notes

- The frontend relies on the Next rewrite because the backend does not provide browser CORS handling.
- Production verification queue data is unavailable unless the backend exposes the admin verification endpoint; the demo includes a local seeded queue.
- Photo and verification uploads require the corresponding Supabase Storage buckets and are handled gracefully when storage is not configured.
- Messaging is backed by the companion `hackerwrath3.0` API using `/api/conversations` and `/api/conversations/:id/messages`; apply its `00002_messaging.sql` migration before enabling production chat.
