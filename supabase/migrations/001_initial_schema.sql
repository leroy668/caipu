-- 食记：完整数据结构、RLS、存储桶和历史收藏迁移
create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 20),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.recipes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  description text not null default '',
  category_id uuid references public.categories(id) on delete set null,
  image_url text not null default '',
  prep_time integer not null default 20 check (prep_time > 0),
  servings integer not null default 2 check (servings > 0),
  main_ingredients jsonb not null default '[]'::jsonb,
  seasonings jsonb not null default '[]'::jsonb,
  steps jsonb not null default '[]'::jsonb,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.favorite_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 24),
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table if not exists public.favorite_list_recipes (
  list_id uuid not null references public.favorite_lists(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (list_id, recipe_id)
);

create index if not exists categories_user_sort_idx
  on public.categories(user_id, sort_order);
create index if not exists recipes_user_created_idx
  on public.recipes(user_id, created_at desc);
create index if not exists recipes_category_idx
  on public.recipes(category_id);
create index if not exists favorite_lists_user_idx
  on public.favorite_lists(user_id);
create index if not exists favorite_list_recipes_recipe_idx
  on public.favorite_list_recipes(recipe_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_set_updated_at on public.recipes;
create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function public.set_updated_at();

-- 一次 RPC 完成分类重排。函数仍受调用者身份约束，只更新自己的分类。
create or replace function public.reorder_categories(ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  category_id uuid;
  position integer := 0;
begin
  foreach category_id in array ordered_ids loop
    update public.categories
      set sort_order = position
      where id = category_id and user_id = auth.uid();
    position := position + 1;
  end loop;
end;
$$;

grant execute on function public.reorder_categories(uuid[]) to authenticated;

alter table public.categories enable row level security;
alter table public.recipes enable row level security;
alter table public.favorite_lists enable row level security;
alter table public.favorite_list_recipes enable row level security;

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories
for select to authenticated using (auth.uid() = user_id);
drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "recipes_select_own" on public.recipes;
create policy "recipes_select_own" on public.recipes
for select to authenticated using (auth.uid() = user_id);
drop policy if exists "recipes_insert_own" on public.recipes;
create policy "recipes_insert_own" on public.recipes
for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "recipes_update_own" on public.recipes;
create policy "recipes_update_own" on public.recipes
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "recipes_delete_own" on public.recipes;
create policy "recipes_delete_own" on public.recipes
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "favorite_lists_select_own" on public.favorite_lists;
create policy "favorite_lists_select_own" on public.favorite_lists
for select to authenticated using (auth.uid() = user_id);
drop policy if exists "favorite_lists_insert_own" on public.favorite_lists;
create policy "favorite_lists_insert_own" on public.favorite_lists
for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "favorite_lists_update_own" on public.favorite_lists;
create policy "favorite_lists_update_own" on public.favorite_lists
for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "favorite_lists_delete_own" on public.favorite_lists;
create policy "favorite_lists_delete_own" on public.favorite_lists
for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "favorite_links_select_own" on public.favorite_list_recipes;
create policy "favorite_links_select_own" on public.favorite_list_recipes
for select to authenticated using (
  exists (
    select 1 from public.favorite_lists
    where favorite_lists.id = favorite_list_recipes.list_id
      and favorite_lists.user_id = auth.uid()
  )
);
drop policy if exists "favorite_links_insert_own" on public.favorite_list_recipes;
create policy "favorite_links_insert_own" on public.favorite_list_recipes
for insert to authenticated with check (
  exists (
    select 1 from public.favorite_lists
    where favorite_lists.id = favorite_list_recipes.list_id
      and favorite_lists.user_id = auth.uid()
  )
  and exists (
    select 1 from public.recipes
    where recipes.id = favorite_list_recipes.recipe_id
      and recipes.user_id = auth.uid()
  )
);
drop policy if exists "favorite_links_delete_own" on public.favorite_list_recipes;
create policy "favorite_links_delete_own" on public.favorite_list_recipes
for delete to authenticated using (
  exists (
    select 1 from public.favorite_lists
    where favorite_lists.id = favorite_list_recipes.list_id
      and favorite_lists.user_id = auth.uid()
  )
);

-- 将旧版 is_favorite=true 菜谱迁移进每个用户的“默认收藏夹”。
insert into public.favorite_lists (user_id, name)
select distinct user_id, '默认收藏夹'
from public.recipes
where is_favorite = true
on conflict (user_id, name) do nothing;

insert into public.favorite_list_recipes (list_id, recipe_id)
select favorite_lists.id, recipes.id
from public.recipes
join public.favorite_lists
  on favorite_lists.user_id = recipes.user_id
  and favorite_lists.name = '默认收藏夹'
where recipes.is_favorite = true
on conflict (list_id, recipe_id) do nothing;

-- 图片桶公开读取，写入操作只允许用户管理自己的顶层目录。
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'recipe-images',
  'recipe-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "recipe_images_public_read" on storage.objects;
create policy "recipe_images_public_read" on storage.objects
for select using (bucket_id = 'recipe-images');
drop policy if exists "recipe_images_insert_own_folder" on storage.objects;
create policy "recipe_images_insert_own_folder" on storage.objects
for insert to authenticated with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "recipe_images_update_own_folder" on storage.objects;
create policy "recipe_images_update_own_folder" on storage.objects
for update to authenticated using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
) with check (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
drop policy if exists "recipe_images_delete_own_folder" on storage.objects;
create policy "recipe_images_delete_own_folder" on storage.objects
for delete to authenticated using (
  bucket_id = 'recipe-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);
