DROP POLICY IF EXISTS "programs public read" ON public.programs;
CREATE POLICY "programs public read published"
ON public.programs
FOR SELECT
TO anon, authenticated
USING (published = true);
CREATE POLICY "programs admin read all"
ON public.programs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "events public read" ON public.events;
CREATE POLICY "events public read active"
ON public.events
FOR SELECT
TO anon, authenticated
USING (active = true);
CREATE POLICY "events admin read all"
ON public.events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "testimonials public read approved" ON public.testimonials;
CREATE POLICY "testimonials public read approved"
ON public.testimonials
FOR SELECT
TO anon, authenticated
USING (approved = true);
CREATE POLICY "testimonials owner read own"
ON public.testimonials
FOR SELECT
TO authenticated
USING (user_id = auth.uid());
CREATE POLICY "testimonials admin read all"
ON public.testimonials
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));