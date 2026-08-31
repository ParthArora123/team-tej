ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS participant_count integer NOT NULL DEFAULT 1;

ALTER TABLE public.enrollments
  ADD CONSTRAINT enrollments_participant_count_range CHECK (participant_count BETWEEN 1 AND 5);

CREATE TABLE public.enrollment_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL REFERENCES public.enrollments(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  position integer NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  ticket_code text UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (enrollment_id, position)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollment_participants TO authenticated;
GRANT ALL ON public.enrollment_participants TO service_role;

ALTER TABLE public.enrollment_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage participants of own registrations"
ON public.enrollment_participants FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.enrollments e WHERE e.id = enrollment_id AND e.user_id = auth.uid()));

CREATE POLICY "Admins manage all participants"
ON public.enrollment_participants FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = auth.uid() AND ur.role = 'admin'));

CREATE TRIGGER tg_enrollment_participants_updated
BEFORE UPDATE ON public.enrollment_participants
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX idx_enrollment_participants_enrollment ON public.enrollment_participants(enrollment_id);
CREATE INDEX idx_enrollment_participants_program ON public.enrollment_participants(program_id);

ALTER TABLE public.attendance
  ADD COLUMN IF NOT EXISTS participant_id uuid REFERENCES public.enrollment_participants(id) ON DELETE CASCADE;

ALTER TABLE public.attendance DROP CONSTRAINT IF EXISTS attendance_enrollment_id_key;

CREATE UNIQUE INDEX attendance_enrollment_only_uniq
  ON public.attendance(enrollment_id) WHERE participant_id IS NULL;

CREATE UNIQUE INDEX attendance_participant_uniq
  ON public.attendance(participant_id) WHERE participant_id IS NOT NULL;