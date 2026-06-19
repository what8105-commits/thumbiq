create extension if not exists "pgcrypto";

create table if not exists public.analysis_runs (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  video_count integer not null default 0,
  insights jsonb not null default '{}'::jsonb,
  recommendations jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.video_results (
  id uuid primary key default gen_random_uuid(),
  analysis_run_id uuid not null references public.analysis_runs(id) on delete cascade,
  video_id text not null,
  title text not null,
  channel text not null,
  thumbnail_url text not null,
  views bigint not null default 0,
  published_at timestamptz not null,
  duration_seconds integer not null default 0,
  format text not null default 'video' check (format in ('video', 'short')),
  performance_score integer not null,
  analysis jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists analysis_runs_topic_idx on public.analysis_runs using gin (to_tsvector('english', topic));
create index if not exists video_results_run_idx on public.video_results (analysis_run_id);
create index if not exists video_results_score_idx on public.video_results (performance_score desc);

alter table public.analysis_runs enable row level security;
alter table public.video_results enable row level security;

create policy "Service role can manage analysis runs"
  on public.analysis_runs
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy "Service role can manage video results"
  on public.video_results
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
