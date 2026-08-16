-- Keep the RLS event-trigger helper unavailable through the Data API.
revoke execute on function public.rls_auto_enable()
  from public, anon, authenticated;
