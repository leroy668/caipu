-- 为收藏夹中的菜谱保存可跨设备同步的显示顺序。
alter table public.favorite_list_recipes
  add column if not exists sort_order integer;

with ranked as (
  select
    list_id,
    recipe_id,
    (row_number() over (partition by list_id order by created_at, recipe_id) - 1)::integer as position
  from public.favorite_list_recipes
)
update public.favorite_list_recipes as flr
set sort_order = ranked.position
from ranked
where flr.list_id = ranked.list_id
  and flr.recipe_id = ranked.recipe_id;

alter table public.favorite_list_recipes
  alter column sort_order set default 0,
  alter column sort_order set not null;

create index if not exists favorite_list_recipes_order_idx
  on public.favorite_list_recipes(list_id, sort_order);

drop policy if exists "favorite_links_update_own" on public.favorite_list_recipes;
create policy "favorite_links_update_own" on public.favorite_list_recipes
for update to authenticated using (
  exists (
    select 1 from public.favorite_lists
    where favorite_lists.id = favorite_list_recipes.list_id
      and favorite_lists.user_id = auth.uid()
  )
) with check (
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

create or replace function public.reorder_favorite_list_recipes(
  target_list_id uuid,
  ordered_recipe_ids uuid[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  ordered_recipe_id uuid;
  position integer := 0;
begin
  if not exists (
    select 1
    from public.favorite_lists
    where id = target_list_id
      and user_id = auth.uid()
  ) then
    raise exception '收藏夹不存在或无权操作';
  end if;

  foreach ordered_recipe_id in array ordered_recipe_ids loop
    update public.favorite_list_recipes as flr
    set sort_order = position
    where flr.list_id = target_list_id
      and flr.recipe_id = ordered_recipe_id;
    position := position + 1;
  end loop;
end;
$$;

grant execute on function public.reorder_favorite_list_recipes(uuid, uuid[]) to authenticated;
