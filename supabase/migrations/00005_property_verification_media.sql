-- Property trust layer: ownership evidence, physical code checks, photos and short videos.

-- Verification state kept on the property so search and admin views can filter quickly.
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS verification_status verification_status_enum NOT NULL DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS verification_code TEXT,
  ADD COLUMN IF NOT EXISTS verification_notes TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_properties_verification
  ON public.properties(verification_status, created_at DESC);

-- 1. PROPERTY VERIFICATION SUBMISSIONS
CREATE TABLE IF NOT EXISTS public.property_verification_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ownership_document_path TEXT,
  lease_document_path TEXT,
  physical_code TEXT NOT NULL,
  physical_code_photo_path TEXT NOT NULL,
  status verification_status_enum NOT NULL DEFAULT 'pending',
  notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT property_verification_evidence CHECK (
    ownership_document_path IS NOT NULL OR lease_document_path IS NOT NULL
  )
);

-- 2. LISTING MEDIA (short videos; photos continue to live in property_photos)
CREATE TABLE IF NOT EXISTS public.property_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
  storage_path TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  moderation_status moderation_status_enum NOT NULL DEFAULT 'pending',
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_property_verification_status
  ON public.property_verification_submissions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_verification_owner
  ON public.property_verification_submissions(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_verification_property
  ON public.property_verification_submissions(property_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_property_media_property
  ON public.property_media(property_id, media_type, display_order);

ALTER TABLE public.property_verification_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can view property verification" ON public.property_verification_submissions;
CREATE POLICY "Owners can view property verification" ON public.property_verification_submissions
  FOR SELECT USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can submit property verification" ON public.property_verification_submissions;
CREATE POLICY "Owners can submit property verification" ON public.property_verification_submissions
  FOR INSERT WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "Owners can manage property media" ON public.property_media;
CREATE POLICY "Owners can manage property media" ON public.property_media
  FOR ALL USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- 3. STORAGE BUCKETS
-- Listing photos are public; verification evidence and videos stay private and use signed URLs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-photos', 'property-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-verification', 'property-verification', false)
ON CONFLICT (id) DO UPDATE SET public = false;

INSERT INTO storage.buckets (id, name, public)
VALUES ('property-videos', 'property-videos', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Paths are always <owner_id>/<property_id>/<file>.
DROP POLICY IF EXISTS "Owners upload property photos" ON storage.objects;
CREATE POLICY "Owners upload property photos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-photos' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners update property photos" ON storage.objects;
CREATE POLICY "Owners update property photos" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'property-photos' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners delete property photos" ON storage.objects;
CREATE POLICY "Owners delete property photos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-photos' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners upload property evidence" ON storage.objects;
CREATE POLICY "Owners upload property evidence" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-verification' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners view property evidence" ON storage.objects;
CREATE POLICY "Owners view property evidence" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'property-verification' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners upload property videos" ON storage.objects;
CREATE POLICY "Owners upload property videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-videos' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners view property videos" ON storage.objects;
CREATE POLICY "Owners view property videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'property-videos' AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Owners delete property videos" ON storage.objects;
CREATE POLICY "Owners delete property videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'property-videos' AND (storage.foldername(name))[1] = auth.uid()::text
  );
