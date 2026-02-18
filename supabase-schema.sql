-- ============================================================
-- WhatWeHavin — Supabase SQL Schema
-- Run this in your Supabase SQL Editor (dashboard.supabase.com)
-- ============================================================

-- ============================================================
-- RECIPES
-- ============================================================

create table public.recipes (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  description  text,
  servings     integer not null default 2,
  image_url    text,
  source_url   text,
  category     text not null check (category in ('starter', 'main', 'dessert')),
  tags         text[] not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table public.recipe_ingredients (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid not null references public.recipes(id) on delete cascade,
  quantity    numeric,
  unit        text,
  name        text not null,
  notes       text,
  sort_order  integer not null default 0
);

create table public.recipe_steps (
  id           uuid primary key default gen_random_uuid(),
  recipe_id    uuid not null references public.recipes(id) on delete cascade,
  step_number  integer not null,
  instruction  text not null
);

-- ============================================================
-- MEAL PLANNER
-- ============================================================

create table public.meal_plan_weeks (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  week_start_date  date not null,
  unique (user_id, week_start_date)
);

create table public.meal_plan_slots (
  id          uuid primary key default gen_random_uuid(),
  week_id     uuid not null references public.meal_plan_weeks(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6),
  meal_type   text not null check (meal_type in ('breakfast', 'lunch', 'dinner')),
  recipe_id   uuid references public.recipes(id) on delete set null,
  free_text   text,
  servings    integer,
  unique (week_id, day_of_week, meal_type)
);

-- ============================================================
-- SHOPPING LIST
-- ============================================================

create table public.shopping_list_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  week_id         uuid references public.meal_plan_weeks(id) on delete cascade,
  ingredient_name text not null,
  quantity        numeric,
  unit            text,
  checked         boolean not null default false,
  is_manual       boolean not null default false,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.recipes enable row level security;
alter table public.recipe_ingredients enable row level security;
alter table public.recipe_steps enable row level security;
alter table public.meal_plan_weeks enable row level security;
alter table public.meal_plan_slots enable row level security;
alter table public.shopping_list_items enable row level security;

-- Recipes: owner only
create policy "owner access" on public.recipes
  for all using (auth.uid() = user_id);

-- Ingredients: owner via parent recipe
create policy "owner access" on public.recipe_ingredients
  for all using (
    auth.uid() = (select user_id from public.recipes where id = recipe_id)
  );

-- Steps: owner via parent recipe
create policy "owner access" on public.recipe_steps
  for all using (
    auth.uid() = (select user_id from public.recipes where id = recipe_id)
  );

-- Meal plan weeks: owner only
create policy "owner access" on public.meal_plan_weeks
  for all using (auth.uid() = user_id);

-- Meal plan slots: owner via parent week
create policy "owner access" on public.meal_plan_slots
  for all using (
    auth.uid() = (select user_id from public.meal_plan_weeks where id = week_id)
  );

-- Shopping list: owner only
create policy "owner access" on public.shopping_list_items
  for all using (auth.uid() = user_id);

-- ============================================================
-- INDEXES
-- ============================================================

create index on public.recipes (user_id, category);
create index on public.recipes using gin (tags);
create index on public.recipe_ingredients (recipe_id, sort_order);
create index on public.recipe_steps (recipe_id, step_number);
create index on public.meal_plan_weeks (user_id, week_start_date);
create index on public.meal_plan_slots (week_id);
create index on public.shopping_list_items (user_id, week_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger recipes_updated_at
  before update on public.recipes
  for each row execute procedure public.set_updated_at();
