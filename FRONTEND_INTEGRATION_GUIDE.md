# SwapStay — Frontend & Backend Integration Guide

This guide enables the **Frontend Developer** and **Backend Developer** to work in parallel and seamlessly merge the codebase.

---

## 1. Clean Project Architecture & Separation

The repository is organized so that **frontend UI files** and **backend server logic** do not conflict:

```text
e:\hackerwrath idea\
├── supabase/
│   ├── migrations/               # PostgreSQL DDL migrations (tables, constraints, RLS)
│   └── seed.sql                  # Seed data for Mumbai, Bengaluru, Gurugram, etc.
├── src/
│   ├── app/
│   │   ├── api/                  # [BACKEND] Next.js Route Handlers (Auth, Properties, Swaps, Bookings, Wallet, Reviews)
│   │   ├── (routes)/             # [FRONTEND] Put your UI pages here (e.g. /search, /properties/[id], /wallet)
│   │   ├── layout.tsx            # [FRONTEND] Global root layout
│   │   └── page.tsx              # [FRONTEND] Landing page (currently API status dashboard)
│   ├── components/               # [FRONTEND] Reusable React UI components (Navbar, PropertyCard, Modal, etc.)
│   ├── lib/
│   │   ├── supabase/             # Client & Server Supabase helpers
│   │   ├── services/             # [BACKEND] Core business logic (SwapScore, Matching, Ledger)
│   │   ├── validations/          # [SHARED] Zod validation schemas (can be imported in forms!)
│   │   └── api-response.ts       # [BACKEND] Standardized API response formatters
│   └── types/                    # [SHARED] TypeScript models and API request/response types
│       ├── database.ts
│       └── api.ts
└── tests/                        # Vitest unit & integration test suite
```

> **Rule for Clean Merging:** The frontend developer builds inside `src/components/`, `src/app/`, and `src/hooks/`. The backend developer builds inside `src/app/api/`, `src/lib/services/`, and `supabase/`. Shared types live in `src/types/` and `src/lib/validations/`.

---

## 2. API Contract & Response Format

All backend endpoints return a standard envelope:

### Successful Response (`HTTP 200 / 201`)
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45
  }
}
```

### Error Response (`HTTP 400 / 401 / 403 / 404 / 409 / 500`)
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_CREDITS",
    "message": "Insufficient credit balance. This 3-night stay requires 3 credits, but you have 1 credit available.",
    "details": { "required": 3, "available": 1 }
  }
}
```

### Standard Error Codes
- `UNAUTHORIZED` — Bearer token missing or expired.
- `FORBIDDEN` — Resource does not belong to the user.
- `VALIDATION_ERROR` — Missing or malformed parameters (inspect `details` for field-level Zod errors).
- `NOT_FOUND` — Listing, swap, or booking does not exist.
- `INSUFFICIENT_CREDITS` — Guest has fewer available credits than the stay duration.
- `OVERLAPPING_BOOKING` — Property already has a confirmed booking for the selected dates.
- `INVALID_STATE_TRANSITION` — E.g., attempting to accept an already confirmed swap, or reviewing an incomplete stay.
- `SELF_BOOKING_NOT_ALLOWED` — User cannot swap with or book their own home.

---

## 3. Endpoints Catalog

### Properties & Search
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/properties/search` | Search active properties with query params: `city`, `checkIn`, `checkOut`, `guests`, `minScore`, `page`, `limit` | No |
| `POST` | `/api/properties` | Create a new property listing (status: `pending_review`) | Yes |
| `GET` | `/api/properties` | List all properties owned by the authenticated caller | Yes |
| `GET` | `/api/properties/:id` | Fetch public property details & SwapScore breakdown (exact address hidden unless confirmed guest or owner) | Optional |
| `PATCH` | `/api/properties/:id` | Update listing details (title, description, amenities, rules) | Yes (Owner) |
| `POST` | `/api/properties/:id/photos` | Add photo storage path to property gallery | Yes (Owner) |
| `GET` | `/api/properties/:id/photos` | Fetch all photos for property listing | No |
| `DELETE` | `/api/properties/:id/photos/:photoId` | Remove a photo from property gallery | Yes (Owner) |
| `GET` | `/api/properties/:id/availability` | Fetch availability calendar (`startDate`, `endDate`) | No |
| `POST` | `/api/properties/:id/availability` | Host sets dates as `available` or `unavailable` | Yes (Owner) |

### User Profile & Verification
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/profile` | Get caller's profile and verification status | Yes |
| `PATCH` | `/api/profile` | Update profile (`display_name`, `bio`, `phone`) | Yes |
| `POST` | `/api/verification` | Submit identity/hosting authority documents for review | Yes |
| `POST` | `/api/admin/verification/:userId` | Admin approves or rejects verification | Yes (Admin) |

### Direct Swaps (Mutual Exchange)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/swaps` | Propose direct swap between caller's home and target home | Yes |
| `GET` | `/api/swaps` | List swaps where caller is requester or recipient | Yes |
| `POST` | `/api/swaps/:id/accept` | Recipient accepts proposal $\rightarrow$ creates agreement snapshot and 2 confirmed bookings | Yes (Recipient) |
| `POST` | `/api/swaps/:id/decline` | Either party declines/cancels proposal | Yes (Participant) |

### Credit-Based Stays
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/bookings` | Request stay. Validates balance, holds credits in reserve, creates booking with `requested` status | Yes |
| `GET` | `/api/bookings` | List all bookings where caller is guest or host | Yes |
| `POST` | `/api/bookings/:id/confirm` | Host confirms requested booking $\rightarrow$ status becomes `confirmed` | Yes (Host) |
| `POST` | `/api/bookings/:id/complete` | Mark stay as completed $\rightarrow$ releases credit reward to host | Yes (Host/Admin) |
| `POST` | `/api/bookings/:id/cancel` | Cancel stay under policy $\rightarrow$ releases reserved credits back to guest | Yes (Participant) |

### Wallet & Credit Ledger
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/wallet` | Returns `{ available_balance, reserved_balance, total_balance }` | Yes |
| `GET` | `/api/wallet/transactions` | Returns append-only transaction history (type, amount, status, description) | Yes |

### Reviews & Reports
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/reviews` | Submit review (`rating` 1-5, `comment`). Only allowed if `booking_status === 'completed'` | Yes (Participant) |
| `POST` | `/api/reports` | File safety/cleanliness/fraud report | Yes |
| `GET` | `/api/admin/reports` | Admin moderation dashboard for reports | Yes (Admin) |

---

## 4. How to Run Locally

### Step 1: Set environment variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 2: Apply Database Schema & Seeds
Execute the SQL in `supabase/migrations/00001_initial_schema.sql` in your Supabase SQL Editor.  
Execute `supabase/seed.sql` to populate sample properties in Mumbai, Bengaluru, and Gurugram.

### Step 3: Run Dev Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the backend integration dashboard.

### Step 4: Run Tests
```bash
npm run test
```
Runs the Vitest suite covering SwapScore calculations, night calculations, and date range overlap logic.
