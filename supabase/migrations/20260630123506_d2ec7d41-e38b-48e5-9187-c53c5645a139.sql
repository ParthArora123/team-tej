
-- Tighten function execute privileges
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, public.app_role) from public, anon;
-- has_role still needs to be callable by authenticated users via RLS evaluation
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
