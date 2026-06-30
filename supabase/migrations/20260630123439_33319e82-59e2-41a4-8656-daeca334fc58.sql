
-- =============== ROLES ===============
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- =============== PROFILES ===============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  age int,
  experience text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create policy "profiles self read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_role(auth.uid(), 'admin'));
create policy "profiles self upsert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- =============== PROGRAMS (classes/workshops/online) ===============
create type public.program_kind as enum ('workshop','nritya_sadhana','zero_to_hero','online_training');

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  kind public.program_kind not null,
  name text not null,
  description text,
  duration text,
  price_inr int not null,
  style text,
  starts_on date,
  seats int,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.programs to anon, authenticated;
grant all on public.programs to authenticated;
grant all on public.programs to service_role;
alter table public.programs enable row level security;
create policy "programs public read" on public.programs for select using (active = true or public.has_role(auth.uid(), 'admin'));
create policy "programs admin write" on public.programs for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- =============== EVENTS ===============
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  venue text,
  event_date timestamptz not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.events to anon, authenticated;
grant all on public.events to service_role;
alter table public.events enable row level security;
create policy "events public read" on public.events for select using (active = true or public.has_role(auth.uid(),'admin'));
create policy "events admin write" on public.events for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- =============== ENROLLMENTS ===============
create type public.enrollment_status as enum ('awaiting_payment','payment_submitted','confirmed','rejected');

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete restrict,
  status public.enrollment_status not null default 'awaiting_payment',
  amount_inr int not null,
  ticket_code text unique,
  payment_note text,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.enrollments to authenticated;
grant all on public.enrollments to service_role;
alter table public.enrollments enable row level security;

create policy "enrollments owner read" on public.enrollments for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "enrollments owner insert" on public.enrollments for insert to authenticated
  with check (user_id = auth.uid());
create policy "enrollments owner update payment" on public.enrollments for update to authenticated
  using (user_id = auth.uid() and status = 'awaiting_payment')
  with check (user_id = auth.uid() and status = 'payment_submitted');
create policy "enrollments admin all" on public.enrollments for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- =============== TESTIMONIALS (move from localStorage) ===============
create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  role text,
  story text,
  video_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);
grant select on public.testimonials to anon, authenticated;
grant insert on public.testimonials to authenticated;
grant all on public.testimonials to service_role;
alter table public.testimonials enable row level security;
create policy "testimonials public read approved" on public.testimonials for select
  using (approved = true or user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "testimonials owner insert" on public.testimonials for insert to authenticated
  with check (user_id = auth.uid());
create policy "testimonials admin manage" on public.testimonials for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

-- =============== UPDATED_AT TRIGGER ===============
create or replace function public.tg_set_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.tg_set_updated_at();
create trigger trg_enrollments_updated before update on public.enrollments for each row execute function public.tg_set_updated_at();

-- =============== AUTO-CREATE PROFILE + ADMIN GRANT ===============
-- Note: admin email is checked against a settings row (because triggers can't read process.env).
create table public.app_settings (
  key text primary key,
  value text not null
);
grant select on public.app_settings to authenticated;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;
create policy "settings admin read" on public.app_settings for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create policy "settings admin write" on public.app_settings for all to authenticated
  using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare admin_email text;
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.raw_user_meta_data->>'phone',''));
  select value into admin_email from public.app_settings where key = 'admin_email';
  if admin_email is not null and lower(new.email) = lower(admin_email) then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- Seed sample programs
insert into public.programs (kind, name, description, duration, price_inr, style) values
  ('nritya_sadhana','Nritya Sadhana — Weekly Practice','Disciplined weekly practice rooted in tradition with contemporary expression.','12 weeks · 2x/week', 6500,'fusion'),
  ('zero_to_hero','Zero to Hero — Beginner Track','From your first step to a stage-ready performance in one season.','16 weeks · 3x/week', 9500,'bollywood'),
  ('workshop','Contemporary Intensive','One-day deep dive with guest choreographer.','1 day · 6 hours', 2500,'fusion'),
  ('online_training','Online Foundations','Self-paced video modules + monthly live feedback.','8 weeks · online', 3500,'hiphop');
