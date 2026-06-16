# PROJECT_STATE

Quick handoff for future Codex sessions. This repository is an Advanced Care Medical Clinic website with public booking, admin CRUD, Supabase persistence, and Razorpay payment flow.

## Architecture

- Frontend: React 19, TanStack Start, TanStack Router, TanStack Query, Vite, TypeScript.
- UI: Tailwind CSS v4, Radix UI/shadcn-style components, lucide-react icons, sonner toasts.
- Routing: file routes in `src/routes`.
- Shared layout/auth: `src/components/SiteLayout.tsx`, `src/components/AuthProvider.tsx`, `src/components/AdminGuard.tsx`.
- Data access: browser Supabase client in `src/lib/supabase.ts`, query hooks in `src/hooks/use-supabase-data.ts`.
- Backend: Supabase Postgres, Supabase Auth, Supabase Edge Functions.
- Generated/vendor folders present: `dist`, `node_modules`, `.tanstack`. Treat source files, `supabase`, `public`, and config files as primary source of truth.
- This folder is not currently a Git repository.

## Database Schema

Schema source: `supabase/schema.sql`. There is no `supabase/migrations` directory and no `supabase/config.toml`.

Tables:

- `user_roles`
  - `user_id` references `auth.users(id)`.
  - `role` allows `admin`, `doctor`, `staff`, but app currently only uses `admin`.
- `doctors`
  - Doctor profiles: name, specialization, experience, photo, bio.
- `services`
  - Service catalog: name, description, price.
  - `price` is text, e.g. `₹600` or `From ₹500`.
- `doctor_services`
  - Join table between doctors and services.
  - Currently unused by app code.
- `availability`
  - Weekly doctor schedule by `doctor_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`.
- `appointments`
  - Patient booking record.
  - References `doctors` and `services`.
  - Stores date, time slot, patient details, status, payment status, Razorpay payment/order IDs.
  - Status values: `pending`, `booked`, `cancelled`, `completed`.
  - Payment status values: `pending`, `paid`, `refunded`, `failed`.
- `doctor_holidays`
  - Per-doctor date blocks.

Important constraints and views:

- `unique_active_appointment` prevents double booking for same doctor/date/time unless status is `cancelled`.
- `public_bookings` view exposes non-sensitive appointment occupancy fields.
- RLS is enabled on all tables.
- Public read exists for doctors, services, doctor_services, availability, doctor_holidays.
- Public insert exists for appointments.
- Public appointment read should use `public_bookings`, not `appointments`.

## Environment Variables

Frontend `.env`:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RAZORPAY_KEY_ID`

Supabase Edge Function secrets:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

Notes:

- `.env.example` only documents frontend variables.
- Edge Function secrets are required for payments but are not fully documented in the deployment checklist.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `RAZORPAY_KEY_SECRET` with a `VITE_` prefix.

## Edge Functions

Functions live in `supabase/functions`.

- `create-razorpay-order`
  - Input: `service_id`, optional `receipt`.
  - Uses service role Supabase client to fetch service price from `services`.
  - Parses text price into paise.
  - Calls Razorpay `/v1/orders`.
  - Returns `order_id`, amount, currency.

- `verify-razorpay-payment`
  - Input: Razorpay payment/order/signature plus booking details.
  - Verifies HMAC signature using `RAZORPAY_KEY_SECRET`.
  - Checks idempotency by `payment_id`.
  - Inserts appointment with `status: "booked"` and `payment_status: "paid"`.

Known payment risks:

- Verification trusts booking metadata from the client after payment.
- It does not call Razorpay to confirm captured status, amount, currency, or service match.
- If the slot is taken after payment but before insert, the DB unique index can reject appointment creation after money has been paid.
- No refund, reconciliation, or webhook flow exists.
- CORS is currently permissive.

## Completed Phases

Mostly complete:

- Public website pages: home, about, contact, doctors, services, appointment.
- Dynamic doctor/service loading from Supabase.
- Admin login with Supabase Auth.
- Admin route guard using `user_roles`.
- Admin dashboard shell.
- Doctors CRUD.
- Services CRUD.
- Holidays create/delete.
- Availability create/delete.
- Appointment admin list with filters.
- Appointment cancel/complete actions.
- Razorpay order + signature verification structure.
- Basic SEO metadata, `public/sitemap.xml`, `public/robots.txt`.

Verified during audit:

- `npx tsc --noEmit` passes.
- `npm run lint` runs via `cmd /c npm run lint` but fails with many lint/format issues.

## Remaining Phases

Before production deployment:

- Implement Service -> Doctor booking flow using `doctor_services`.
- Build receptionist/staff portal.
- Expand appointment workflow statuses and transitions.
- Improve phone validation.
- Harden payment verification and post-payment booking conflict handling.
- Add Supabase migrations and project config.
- Document and deploy Edge Functions with secrets.
- Add automated tests for booking, admin CRUD, RLS-sensitive flows, and payment functions.

## Known Bugs

- `useDoctorBookings` in `src/hooks/use-supabase-data.ts` queries `appointments` directly. Anonymous users likely cannot read it under current RLS, so booked slot disabling can fail. It should query `public_bookings`.
- `doctor_services` table exists but no UI or hook uses it, so users can select any doctor with any service.
- Appointment success copy says "Appointment requested" and mentions follow-up confirmation even though the backend creates a booked, paid appointment.
- Button/footer copy in appointment page still says "Payment & confirmation will be added soon" despite payment integration existing.
- `getAmountInPaise` exists unused in `src/routes/appointment.tsx`.
- Admin roles `doctor` and `staff` exist in schema but are not implemented in app logic.
- Lint fails with Prettier formatting errors and `no-explicit-any` errors.

## Technical Debt

- No migration history; schema file is destructive and starts with `DROP TABLE`.
- No test suite.
- No typed database model generation from Supabase.
- Many admin components use `any`.
- Price is stored as display text, then parsed for payments.
- No storage/upload path for doctor photos; admin accepts a URL string.
- No role management UI.
- No audit logs for admin actions.
- No email/SMS notifications.
- No webhook-based payment reconciliation.
- `dist` is present in project folder and appears generated.
- `src/lib/api/example.functions.ts` is sample/dead code unless TanStack server functions are intentionally adopted.

## Deployment Steps

1. Create/configure a Supabase project.
2. Apply `supabase/schema.sql` manually in Supabase SQL Editor.
3. Create or invite the admin user through Supabase Auth.
4. Insert admin role manually:

   ```sql
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('ADMIN-USER-UUID-HERE', 'admin');
   ```

5. Seed doctors and services through admin UI or SQL.
6. Configure frontend environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_RAZORPAY_KEY_ID`
7. Deploy Supabase Edge Functions:
   - `create-razorpay-order`
   - `verify-razorpay-payment`
8. Set Edge Function secrets:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
9. Deploy frontend host with build command:

   ```bash
   npm run build
   ```

10. Post-deployment QA:
    - Public pages load.
    - Doctors/services load from Supabase.
    - Admin login works.
    - Admin CRUD works.
    - Availability/holiday blocks affect booking.
    - Razorpay test order opens.
    - Successful payment creates appointment with `payment_status = paid`.
    - Booked slots are hidden/disabled for anonymous users.

## Current Health Snapshot

- Completion estimate: 72%.
- Health: Yellow.
- The product is substantially implemented but not production-ready until RLS booking visibility, payment hardening, Edge Function deployment docs, migrations, and lint/test debt are addressed.
