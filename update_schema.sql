
-- Fix trial days to 20
create or replace function set_trial_end_date()
returns trigger as $$
begin
  if new.trial_started_at is not null and new.trial_ends_at is null then
    new.trial_ends_at := new.trial_started_at + interval '20 days';
  end if;
  return new;
end;
$$ language plpgsql;

-- Update any shops still using 28 day trial
update shops
set trial_ends_at = trial_started_at + interval '20 days'
where trial_started_at is not null
and trial_ends_at is not null
and trial_ends_at = trial_started_at + interval '28 days';

-- Make sure mark all read function exists
create or replace function mark_all_notifications_read(p_user_id uuid)
returns void as $$
begin
  update notifications
  set read = true
  where user_id = p_user_id
  and read = false;
end;
$$ language plpgsql
security definer;

-- Stock management trigger
drop trigger if exists on_sale_recorded on orders;
drop function if exists update_stock_on_sale();

create or replace function update_stock_on_sale()
returns trigger as $$
declare
  v_sizes jsonb;
  v_new_sizes jsonb;
  v_total int;
  v_size_record jsonb;
  v_new_qty int;
begin
  -- Get current sizes from product
  select sizes, total_stock
  into v_sizes, v_total
  from products
  where id = new.product_id;
  
  -- If sizes is null or empty
  -- just decrement total_stock
  if v_sizes is null or
     v_sizes = '[]'::jsonb then
    
    update products
    set total_stock = greatest(
      0,
      coalesce(total_stock, 0) -
      coalesce(new.quantity, 1)
    )
    where id = new.product_id;
    
    return new;
  end if;
  
  -- Update the specific size quantity
  v_new_sizes := '[]'::jsonb;
  
  for v_size_record in
    select * from jsonb_array_elements(
      v_sizes
    )
  loop
    if v_size_record->>'size' =
       new.size then
      v_new_qty := greatest(
        0,
        coalesce(
          (v_size_record->>'quantity')
            ::int,
          0
        ) - coalesce(new.quantity, 1)
      );
      v_new_sizes := v_new_sizes ||
        jsonb_build_object(
          'size',
          v_size_record->>'size',
          'quantity',
          v_new_qty
        );
    else
      v_new_sizes := v_new_sizes ||
        v_size_record;
    end if;
  end loop;
  
  -- Recalculate total stock
  -- from all sizes combined
  select coalesce(
    sum(
      (s->>'quantity')::int
    ), 0
  )
  into v_total
  from jsonb_array_elements(
    v_new_sizes
  ) as s;
  
  -- Update the product
  update products
  set
    sizes = v_new_sizes,
    total_stock = v_total
  where id = new.product_id;
  
  return new;
  
exception when others then
  -- Log error but don't fail
  -- the order insert
  raise warning
    'Stock update failed for
    product %: %',
    new.product_id,
    sqlerrm;
  return new;
end;
$$ language plpgsql
security definer;

create trigger on_sale_recorded
after insert on orders
for each row
execute function update_stock_on_sale();

-- Recalculate total_stock for all products based on sizes
update products
set total_stock = (
  select coalesce(
    sum((s->>'quantity')::int), 0
  )
  from jsonb_array_elements(
    sizes
  ) as s
)
where sizes is not null
and sizes != '[]'::jsonb
and jsonb_typeof(sizes) = 'array';
create index if not exists idx_notifications_user_unread
on notifications (user_id, read)
where read = false;

-- Unread count function
create or replace function get_unread_notifications_count(user_id_param uuid)
returns bigint as $$
begin
  return (
    select count(*)
    from notifications
    where user_id = user_id_param
    and read = false
  );
end;
$$ language plpgsql
security definer;
