CREATE TABLE public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id text NOT NULL,
  company text NOT NULL DEFAULT '',
  role_title text NOT NULL DEFAULT '',
  resume_variant text NOT NULL,
  job_description text NOT NULL,
  analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'applied',
  notes text NOT NULL DEFAULT '',
  applied_on date NOT NULL DEFAULT current_date,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE INDEX applications_owner_idx ON public.applications(owner_id, created_at DESC);