# Deployment Checklist: HeartCare Advanced Clinic

Follow these steps to deploy the HeartCare Advanced Clinic application to production.

---

## 1. Database Setup (Supabase)

1. **Create Supabase Project**:
   - Register or sign in at [supabase.com](https://supabase.com) and create a new project.
2. **Execute Database Schema**:
   - Copy the contents of `supabase/production_delivery_schema.sql` and execute it in the **SQL Editor** of your Supabase dashboard.
   - This creates all application tables, including `gallery_images`, the `public_bookings` privacy view, both storage buckets, and all required Row Level Security policies.
   - Do not use `supabase db reset` for a fresh project until a baseline migration is added. The current migrations only alter an already-created schema.
3. **Provision Database Seed Data**:
   - Insert services and doctors through the Admin dashboard or write SQL inserts directly to populate the practitioners lists.
4. **Provision Admin User**:
   - Instruct the primary administrator to register via the standard Supabase Auth signup (or create the account in the Supabase Auth Dashboard).
   - Find their User ID (UUID) in the `auth.users` list.
   - Assign the admin role by executing:
     ```sql
     INSERT INTO public.user_roles (user_id, role)
     VALUES ('ADMIN-USER-UUID-HERE', 'admin');
     ```

---

## 2. Environment Variables configuration

Add the following environment variables to your host provider (e.g. Vercel dashboard) and your local `.env` files:

| Environment Variable         | Description                    | Example / Details                        |
| :--------------------------- | :----------------------------- | :--------------------------------------- |
| **`VITE_SUPABASE_URL`**      | Supabase Project API Endpoint  | `https://your-proj.supabase.co`          |
| **`VITE_SUPABASE_ANON_KEY`** | Anonymous Client API Key       | `eyJhbGciOiJIUzI...`                     |
| **`VITE_RAZORPAY_KEY_ID`**   | Razorpay Gateway Public Key ID | `rzp_live_xxxxxx` (or `rzp_test_xxxxxx`) |

> [!CAUTION]
> Ensure that no secret keys (like the Supabase Database password or Razorpay Secret Keys) are prefixed with `VITE_` or exposed in your frontend repository.

Set the following only as Supabase Edge Function secrets:

| Secret                          | Description                                            |
| :------------------------------ | :----------------------------------------------------- |
| **`SUPABASE_URL`**              | Supabase project API endpoint                          |
| **`SUPABASE_ANON_KEY`**         | Anonymous key used to validate the calling admin JWT   |
| **`SUPABASE_SERVICE_ROLE_KEY`** | Service role key used only inside Edge Functions       |
| **`RAZORPAY_KEY_ID`**           | Razorpay key ID for server API calls                   |
| **`RAZORPAY_KEY_SECRET`**       | Razorpay key secret for order/payment/refund API calls |

---

## 3. Razorpay Gateway Setup

1. **Obtain API Keys**:
   - Access the **Razorpay Dashboard** -> **Settings** -> **API Keys**.
   - Generate a Key ID and Key Secret.
2. **Set Up Key ID**:
   - Configure `VITE_RAZORPAY_KEY_ID` on the hosting provider settings.
3. **Review Payment Methods**:
   - In the Razorpay Dashboard, verify that the required payment methods (Cards, Netbanking, UPI, Wallets) are active for your merchant account.

---

## 3A. Supabase Edge Functions

1. Link the Supabase project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
2. Set required secrets:
   ```bash
   supabase secrets set \
     SUPABASE_URL=https://your-proj.supabase.co \
     SUPABASE_ANON_KEY=your-anon-key \
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key \
     RAZORPAY_KEY_ID=rzp_live_xxxxxx \
     RAZORPAY_KEY_SECRET=your-razorpay-secret
   ```
3. Deploy functions:
   ```bash
   supabase functions deploy create-razorpay-order
   supabase functions deploy verify-razorpay-payment
   supabase functions deploy manage-staff
   ```
4. Confirm all three functions are visible in the Supabase dashboard and have access to the configured secrets.

---

## 4. Hosting Deployment (Vercel)

1. **Connect Repository**:
   - Import your GitHub repository into Vercel.
2. **Configure Build Commands**:
   - Vercel automatically detects Vite/TanStack Start configurations. Ensure they match:
     - **Build Command**: `npm run build`
     - **Output Directory**: `.output` or `dist` (automatically resolved by TanStack Start config)
3. **Add Env Variables**:
   - Copy the configuration table in Section 2 into Vercel's Environment Variables page.
4. **Deploy**:
   - Click "Deploy" to launch the project.

---

## 5. Post-Deployment Verification (QA)

Run the following manual tests on the live production domain:

1. **Homepage Loading**: Open the site and check if the home page loads fast with no console errors, and dynamic doctors/services list are loaded.
2. **Booking Flow**: Fill out the appointment booking form, select a doctor, slot, and click "Book Appointment". Verify the Razorpay Checkout popup loads.
3. **Payment Completion**: Complete a checkout flow in Razorpay's test mode. Verify the booking redirects to the success screen.
4. **Admin Dashboard Access**:
   - Navigate to `/admin/login` and authenticate using the admin credentials.
   - Verify that the new appointment shows in the log with payment status labeled **"Paid"** and references the transaction ID.
5. **CRUD checks**: Try creating/editing/deleting a doctor, service, and holiday block in the admin tabs, verifying the Radix `<AlertDialog>` shows on delete.
