create extension if not exists pgcrypto;

create type public.batch_status as enum ('draft', 'ready', 'queued', 'processing', 'completed', 'failed');
create type public.run_scope as enum ('single', 'batch');

create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status public.batch_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.batch_images (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  original_filename text not null,
  input_storage_path text not null,
  edit_prompt text not null,
  status public.batch_status not null default 'draft',
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.processing_runs (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  target_image_id uuid references public.batch_images(id) on delete set null,
  run_scope public.run_scope not null,
  status public.batch_status not null default 'queued',
  upscale_requested boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  started_at timestamptz,
  completed_at timestamptz,
  error_message text
);

create table if not exists public.image_results (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references public.batch_images(id) on delete cascade,
  run_id uuid not null references public.processing_runs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_job_id text,
  output_storage_path text,
  upscaled_output_storage_path text,
  status public.batch_status not null default 'queued',
  output_width integer,
  output_height integer,
  provider_payload jsonb,
  error_message text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists batches_user_id_updated_at_idx on public.batches(user_id, updated_at desc);
create index if not exists batch_images_batch_id_sort_order_idx on public.batch_images(batch_id, sort_order asc);
create index if not exists image_results_image_id_created_at_idx on public.image_results(image_id, created_at desc);
create index if not exists processing_runs_batch_id_created_at_idx on public.processing_runs(batch_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_batches_updated_at on public.batches;
create trigger set_batches_updated_at
before update on public.batches
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_batch_images_updated_at on public.batch_images;
create trigger set_batch_images_updated_at
before update on public.batch_images
for each row
execute procedure public.set_updated_at();

drop trigger if exists set_image_results_updated_at on public.image_results;
create trigger set_image_results_updated_at
before update on public.image_results
for each row
execute procedure public.set_updated_at();

alter table public.batches enable row level security;
alter table public.batch_images enable row level security;
alter table public.processing_runs enable row level security;
alter table public.image_results enable row level security;

create policy "users manage own batches"
on public.batches
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own batch_images"
on public.batch_images
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own processing_runs"
on public.processing_runs
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "users manage own image_results"
on public.image_results
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values
  ('image-documents', 'image-documents', false)
on conflict (id) do nothing;

create policy "users can access own storage objects"
on storage.objects
for all
using (bucket_id = 'image-documents' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'image-documents' and auth.uid()::text = (storage.foldername(name))[1]);
