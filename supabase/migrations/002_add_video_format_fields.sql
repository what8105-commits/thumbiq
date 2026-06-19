alter table public.video_results
  add column if not exists duration_seconds integer not null default 0,
  add column if not exists format text not null default 'video';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'video_results_format_check'
  ) then
    alter table public.video_results
      add constraint video_results_format_check check (format in ('video', 'short'));
  end if;
end $$;
