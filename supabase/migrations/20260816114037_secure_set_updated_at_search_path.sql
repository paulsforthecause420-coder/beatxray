-- Prevent object shadowing in the trigger function.
alter function public.set_updated_at()
  set search_path = '';
