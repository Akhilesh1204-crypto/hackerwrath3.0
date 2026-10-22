-- Auditable identity and hosting-authority verification submissions.

CREATE TABLE IF NOT EXISTS public.verification_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  id_document_path TEXT NOT NULL,
  property_proof_path TEXT,
  status verification_status_enum NOT NULL DEFAULT 'pending',
  notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_submissions_status
  ON public.verification_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_verification_submissions_user
  ON public.verification_submissions(user_id, created_at DESC);

ALTER TABLE public.verification_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members can view their own verification submissions" ON public.verification_submissions;
CREATE POLICY "Members can view their own verification submissions" ON public.verification_submissions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Members can submit their own verification" ON public.verification_submissions;
CREATE POLICY "Members can submit their own verification" ON public.verification_submissions
  FOR INSERT WITH CHECK (user_id = auth.uid());

INSERT INTO storage.buckets (id, name, public)
VALUES ('verification', 'verification', false)
ON CONFLICT (id) DO UPDATE SET public = false;

DROP POLICY IF EXISTS "Members can upload their own verification documents" ON storage.objects;
CREATE POLICY "Members can upload their own verification documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'verification' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Members can view their own verification documents" ON storage.objects;
CREATE POLICY "Members can view their own verification documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'verification' AND (storage.foldername(name))[1] = auth.uid()::text
  );
