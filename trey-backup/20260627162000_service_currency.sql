-- Add explicit service currency support for payment routing.

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'INR';

ALTER TABLE public.services
DROP CONSTRAINT IF EXISTS services_currency_check;

ALTER TABLE public.services
ADD CONSTRAINT services_currency_check
CHECK (currency IN ('INR'));

COMMENT ON COLUMN public.services.currency IS
    'ISO currency code used for payment routing and checkout amount validation. Razorpay uses INR for public bookings.';
