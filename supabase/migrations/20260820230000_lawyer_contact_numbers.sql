-- Add phone_number and whatsapp_number columns to lawyers table
ALTER TABLE public.lawyers
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;

COMMENT ON COLUMN public.lawyers.phone_number IS 'Direct phone number for voice calls';
COMMENT ON COLUMN public.lawyers.whatsapp_number IS 'Direct WhatsApp contact number';
