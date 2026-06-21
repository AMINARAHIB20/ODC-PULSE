begin;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.profiles
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where auth_user_id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.owns_learner(target_learner_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.learners
    where id = target_learner_id
      and profile_id = public.current_profile_id()
  );
$$;

revoke all on function public.current_profile_id() from public;
revoke all on function public.is_admin() from public;
revoke all on function public.owns_learner(uuid) from public;
grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_learner(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.programs enable row level security;
alter table public.learners enable row level security;
alter table public.attendance_records enable row level security;
alter table public.quiz_results enable row level security;
alter table public.projects enable row level security;
alter table public.skills enable row level security;
alter table public.company_offers enable row level security;
alter table public.ai_analyses enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
for select to authenticated
using (auth_user_id = auth.uid() or (select public.is_admin()));

drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "programs_authenticated_read" on public.programs;
create policy "programs_authenticated_read" on public.programs
for select to authenticated using (true);

drop policy if exists "programs_admin_all" on public.programs;
create policy "programs_admin_all" on public.programs
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "learners_select_own_or_admin" on public.learners;
create policy "learners_select_own_or_admin" on public.learners
for select to authenticated
using (profile_id = (select public.current_profile_id()) or (select public.is_admin()));

drop policy if exists "learners_admin_all" on public.learners;
create policy "learners_admin_all" on public.learners
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "attendance_select_own_or_admin" on public.attendance_records;
create policy "attendance_select_own_or_admin" on public.attendance_records
for select to authenticated
using (public.owns_learner(learner_id) or (select public.is_admin()));

drop policy if exists "attendance_admin_all" on public.attendance_records;
create policy "attendance_admin_all" on public.attendance_records
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "quiz_results_select_own_or_admin" on public.quiz_results;
create policy "quiz_results_select_own_or_admin" on public.quiz_results
for select to authenticated
using (public.owns_learner(learner_id) or (select public.is_admin()));

drop policy if exists "quiz_results_admin_all" on public.quiz_results;
create policy "quiz_results_admin_all" on public.quiz_results
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "projects_select_own_or_admin" on public.projects;
create policy "projects_select_own_or_admin" on public.projects
for select to authenticated
using (public.owns_learner(learner_id) or (select public.is_admin()));

drop policy if exists "projects_admin_all" on public.projects;
create policy "projects_admin_all" on public.projects
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "skills_select_own_or_admin" on public.skills;
create policy "skills_select_own_or_admin" on public.skills
for select to authenticated
using (public.owns_learner(learner_id) or (select public.is_admin()));

drop policy if exists "skills_admin_all" on public.skills;
create policy "skills_admin_all" on public.skills
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "offers_authenticated_read" on public.company_offers;
create policy "offers_authenticated_read" on public.company_offers
for select to authenticated using (true);

drop policy if exists "offers_admin_all" on public.company_offers;
create policy "offers_admin_all" on public.company_offers
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

drop policy if exists "analyses_select_own_or_admin" on public.ai_analyses;
create policy "analyses_select_own_or_admin" on public.ai_analyses
for select to authenticated
using (public.owns_learner(learner_id) or (select public.is_admin()));

drop policy if exists "analyses_admin_all" on public.ai_analyses;
create policy "analyses_admin_all" on public.ai_analyses
for all to authenticated
using ((select public.is_admin()))
with check ((select public.is_admin()));

grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;

commit;
