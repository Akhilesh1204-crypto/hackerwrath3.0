-- SwapStay credit rules: one credit equals one hosted night.

ALTER TYPE credit_tx_type_enum ADD VALUE IF NOT EXISTS 'swap_difference';
ALTER TYPE credit_tx_type_enum ADD VALUE IF NOT EXISTS 'cancellation_fee';

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS credit_reservation_amount INT NOT NULL DEFAULT 0 CHECK (credit_reservation_amount >= 0),
  ADD COLUMN IF NOT EXISTS cancellation_fee_nights INT NOT NULL DEFAULT 0 CHECK (cancellation_fee_nights >= 0),
  ADD COLUMN IF NOT EXISTS credits_settled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS credits_released_at TIMESTAMPTZ;

UPDATE public.bookings
SET credit_reservation_amount = credit_price
WHERE booking_type = 'credit_stay' AND credit_reservation_amount = 0 AND credit_price > 0;

ALTER TABLE public.swap_requests
  ADD COLUMN IF NOT EXISTS credit_difference INT NOT NULL DEFAULT 0 CHECK (credit_difference >= 0),
  ADD COLUMN IF NOT EXISTS credit_payer_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS credit_recipient_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS credit_terms_note TEXT,
  ADD COLUMN IF NOT EXISTS credit_terms_status TEXT NOT NULL DEFAULT 'equal'
    CHECK (credit_terms_status IN ('equal', 'pending', 'accepted', 'countered', 'declined', 'return_stay'));

CREATE INDEX IF NOT EXISTS idx_swap_credit_terms ON public.swap_requests(credit_terms_status, credit_difference);
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_settlement_once
  ON public.credit_transactions(user_id, booking_id, transaction_type)
  WHERE booking_id IS NOT NULL AND transaction_type IN ('stay_debit', 'host_reward', 'cancellation_fee');
