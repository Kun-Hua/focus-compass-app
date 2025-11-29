-- Enforce max 5 accountability partners per owner (counting status in ('pending','active'))
-- Create function and trigger on AccountabilityPartner

create or replace function public.enforce_partner_limit()
returns trigger
language plpgsql
security definer
as $$
begin
  if (tg_op = 'INSERT') then
    -- Count current rows for this owner where status is active or pending
    if (
      select count(1) from "AccountabilityPartner"
      where owner_user_id = new.owner_user_id and status in ('pending','active')
    ) >= 5 then
      raise exception using
        errcode = '45000',
        message = 'partner_limit_exceeded: Max 5 accountability partners';
    end if;
    return new;
  elsif (tg_op = 'UPDATE') then
    -- If owner_user_id/status changes in a way that would increase non-revoked count, enforce again
    if (
      (new.owner_user_id is distinct from old.owner_user_id)
      or (new.status is distinct from old.status)
    ) then
      if (
        select count(1) from "AccountabilityPartner"
        where owner_user_id = new.owner_user_id and status in ('pending','active')
      ) > 5 then
        -- > 5 because this row already counted if active/pending; block transitions that exceed cap
        raise exception using
          errcode = '45000',
          message = 'partner_limit_exceeded: Max 5 accountability partners';
      end if;
    end if;
    return new;
  end if;
  return new;
end;
$$;

-- Drop then create trigger to avoid duplicates
DROP TRIGGER IF EXISTS trg_enforce_partner_limit ON "AccountabilityPartner";
create trigger trg_enforce_partner_limit
before insert or update on "AccountabilityPartner"
for each row
execute function public.enforce_partner_limit();
