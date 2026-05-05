create extension if not exists pgcrypto;

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  servings integer not null default 1,
  estimated_prep_time_minutes integer not null default 0,
  estimated_cook_time_minutes integer not null default 0,
  estimated_total_time_minutes integer not null default 0,
  actual_total_time_minutes integer,
  actual_time_notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text default '',
  original_text text default '',
  scalable boolean not null default true
);

create table if not exists instructions (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  step_number integer not null,
  text text not null,
  has_timer boolean not null default false,
  timer_seconds integer
);

create table if not exists recipe_equipment (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  name text not null,
  notes text default ''
);

create table if not exists recipe_photos (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  photo_url text not null,
  is_cover_photo boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table if not exists recipe_tags (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references recipes(id) on delete cascade,
  tag_id uuid not null references tags(id) on delete cascade,
  unique (recipe_id, tag_id)
);

create index if not exists ingredients_recipe_id_idx on ingredients(recipe_id);
create index if not exists instructions_recipe_id_idx on instructions(recipe_id);
create index if not exists recipe_equipment_recipe_id_idx on recipe_equipment(recipe_id);
create index if not exists recipe_photos_recipe_id_idx on recipe_photos(recipe_id);
create index if not exists recipe_tags_recipe_id_idx on recipe_tags(recipe_id);

alter table recipes enable row level security;
alter table ingredients enable row level security;
alter table instructions enable row level security;
alter table recipe_equipment enable row level security;
alter table recipe_photos enable row level security;
alter table tags enable row level security;
alter table recipe_tags enable row level security;

drop policy if exists "Public recipe read" on recipes;
drop policy if exists "Public recipe insert" on recipes;
drop policy if exists "Public recipe update" on recipes;
drop policy if exists "Public recipe delete" on recipes;
drop policy if exists "Public ingredients all" on ingredients;
drop policy if exists "Public instructions all" on instructions;
drop policy if exists "Public equipment all" on recipe_equipment;
drop policy if exists "Public photos all" on recipe_photos;
drop policy if exists "Public tags all" on tags;
drop policy if exists "Public recipe tags all" on recipe_tags;

create policy "Public recipe read" on recipes for select using (true);
create policy "Public recipe insert" on recipes for insert with check (true);
create policy "Public recipe update" on recipes for update using (true) with check (true);
create policy "Public recipe delete" on recipes for delete using (true);

create policy "Public ingredients all" on ingredients for all using (true) with check (true);
create policy "Public instructions all" on instructions for all using (true) with check (true);
create policy "Public equipment all" on recipe_equipment for all using (true) with check (true);
create policy "Public photos all" on recipe_photos for all using (true) with check (true);
create policy "Public tags all" on tags for all using (true) with check (true);
create policy "Public recipe tags all" on recipe_tags for all using (true) with check (true);

insert into storage.buckets (id, name, public)
values ('recipe-photos', 'recipe-photos', true)
on conflict (id) do nothing;

drop policy if exists "Public recipe photo read" on storage.objects;
drop policy if exists "Public recipe photo upload" on storage.objects;
drop policy if exists "Public recipe photo update" on storage.objects;
drop policy if exists "Public recipe photo delete" on storage.objects;

create policy "Public recipe photo read" on storage.objects
for select using (bucket_id = 'recipe-photos');

create policy "Public recipe photo upload" on storage.objects
for insert with check (bucket_id = 'recipe-photos');

create policy "Public recipe photo update" on storage.objects
for update using (bucket_id = 'recipe-photos') with check (bucket_id = 'recipe-photos');

create policy "Public recipe photo delete" on storage.objects
for delete using (bucket_id = 'recipe-photos');
