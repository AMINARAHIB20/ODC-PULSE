revoke all on function public.current_profile_id() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.owns_learner(uuid) from public, anon;

grant execute on function public.current_profile_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.owns_learner(uuid) to authenticated;

revoke all on function public.rls_auto_enable() from public, anon, authenticated;
