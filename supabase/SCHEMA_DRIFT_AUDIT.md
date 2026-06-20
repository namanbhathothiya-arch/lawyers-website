# Schema Drift Audit

## Delivery blockers

- `supabase/schema.sql` does not create `gallery_images`.
- `supabase/schema.sql` does not create the `doctor-images` or `clinic-gallery` buckets.
- `supabase/schema.sql` does not create gallery or storage RLS policies.
- A fresh deployment following `deployment-checklist.md` therefore breaks the homepage gallery and both admin upload managers.
- The migration directory has no initial schema migration. Its first migration starts with `ALTER TABLE`, so a fresh `supabase db reset` or migration-only deployment fails before creating any application table.
- `manage-staff` requires `SUPABASE_ANON_KEY`, but `.env.example` and the deployment checklist do not list it as an Edge Function secret.
- The original own-role policy returns inactive role rows. The client only reads `role`, so disabled users can still enter a portal UI. The consolidated schema fixes this by exposing an own role only when `is_active = true`.
- `manage-staff` checks only `role = 'admin'` in application code. The consolidated schema prevents inactive admins from reading that row, but the function should still explicitly select and verify `is_active`.
- Doctor RBAC exists in SQL, but the application has no doctor account creation workflow, no doctor portal route, and the login page rejects the `doctor` role.

## Runtime database contract

### Tables and columns

- `doctors`: `id`, `name`, `specialization`, `experience`, `photo`, `bio`, `created_at`
- `services`: `id`, `name`, `description`, `price`, `created_at`
- `doctor_services`: `doctor_id`, `service_id`, `created_at`
- `availability`: `id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`, `created_at`
- `appointments`: `id`, `doctor_id`, `service_id`, `date`, `time_slot`, `patient_name`, `patient_phone`, `patient_email`, `status`, `payment_status`, `payment_id`, `order_id`, `created_at`
- `doctor_holidays`: `id`, `doctor_id`, `date`, `created_at`
- `gallery_images`: `id`, `image_url`, `title`, `sort_order`, `created_at`
- `user_roles`: `id`, `user_id`, `full_name`, `role`, `doctor_id`, `is_active`, `created_at`

### Views

- `public_bookings`: `id`, `doctor_id`, `date`, `time_slot`, `status`

### SQL functions

- `is_admin()`
- `has_role(text)`
- `current_doctor_id()`

### Policy inventory found in the repository

Core delivery schema:

- `user_roles`: `admin_all`, `select_own`
- `doctors`: `admin_all`, `public_select`
- `services`: `admin_all`, `public_select`
- `doctor_services`: `admin_all`, `public_select`
- `availability`: `admin_all`, `public_select`
- `appointments`: `admin_all`, `staff_manage`, `staff_update`, `doctor_select_own`, `public_insert`
- `doctor_holidays`: `admin_all`, `public_select`

Split gallery/storage setup files:

- `gallery_images`: `Public Select gallery_images`, `Admin All gallery_images`
- `storage.objects` for `clinic-gallery`: `Public Select clinic-gallery`, `Admin All clinic-gallery`
- `storage.objects` for `doctor-images`: `Public Select doctor-images`, `Admin All doctor-images`, `Staff Select doctor-images`

Corrected consolidated policy set:

- Active own-role lookup plus active-admin management on `user_roles`
- Public read and active-admin management on doctors, services, mappings, availability, holidays, and gallery
- Active-admin management, active-staff read/update, and linked-doctor read on appointments
- Public read and active-admin management on both storage buckets
- No anonymous appointment insert policy

### Storage

- `doctor-images`
- `clinic-gallery`

### Edge Functions

- `create-razorpay-order`
- `verify-razorpay-payment`
- `manage-staff`

### Environment variables

Browser:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_RAZORPAY_KEY_ID`

Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `VITE_RAZORPAY_KEY_ID` is accepted as an undocumented fallback by the Razorpay functions and should not be used for secrets.

Server helper:

- `NODE_ENV`

## Present in the old delivery schema but not required by current code

- The `uuid-ossp` extension is unused; all IDs use `gen_random_uuid()`.
- The anonymous `public_insert` policy on `appointments` is unused. Current bookings are inserted by `verify-razorpay-payment` with the service role. Keeping public insert permits unpaid forged bookings.
- `user_roles.id` is not queried by application code, but remains useful as a stable primary key.
- Several `created_at` columns are not rendered by the UI, but are retained for auditing and ordering.
- The doctor role and `current_doctor_id()` are not reachable through the current frontend, though they are retained for intended doctor-account RBAC.

## Exact SQL correction

- Use `supabase/production_delivery_schema.sql` as the complete replacement delivery SQL.
- It includes every missing table, column, view, helper function, constraint, grant, RLS policy, bucket, MIME restriction, and storage policy.
- It deliberately omits anonymous `INSERT` access to `appointments`; paid appointments are created only by the service-role payment verification function.
- For migration-based delivery, convert the non-destructive creation sections of that file into a baseline migration dated earlier than `20260611160000`.

## Edge Function compatibility

- `create-razorpay-order` matches `services.id` and `services.price`.
- `verify-razorpay-payment` matches all appointment, service, and doctor-service fields in the corrected schema.
- `manage-staff` matches `user_roles.user_id`, `full_name`, `role`, and `created_at`.
- `manage-staff` creates staff only; it does not create doctor accounts or populate `doctor_id`.
- Payment verification does not server-side validate `availability` or `doctor_holidays`. A modified client can pay for an unavailable time. This is not schema drift, but it is a booking-integrity risk.
- Payment verification accepts any doctor when a service has zero doctor mappings. This matches current frontend fallback behavior.

## Required deployment sequence

1. Run `supabase/production_delivery_schema.sql`.
2. Create the first Auth user and insert its active admin row using the SQL example at the end of the schema.
3. Set all five Edge Function secrets, including `SUPABASE_ANON_KEY`.
4. Deploy all three Edge Functions.
5. Confirm `create-razorpay-order` and `verify-razorpay-payment` remain configured with public invocation and `manage-staff` requires JWT verification.
6. Create doctors, services, doctor-service mappings, availability, and holidays through the admin UI.
7. Test both storage uploads and public image loading.
8. Test staff creation, staff login, appointment status updates, and deletion.
9. Test a paid booking and a simultaneous slot-conflict refund.
