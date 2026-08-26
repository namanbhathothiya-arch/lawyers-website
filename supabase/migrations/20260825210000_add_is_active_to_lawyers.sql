-- Migration: Add is_active column to lawyers table for safe archiving
-- Timestamp: 20260825210000

ALTER TABLE public.lawyers
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.lawyers.is_active IS 'Indicates whether the lawyer is active or archived/deactivated';

CREATE INDEX IF NOT EXISTS idx_lawyers_is_active ON public.lawyers(is_active);
