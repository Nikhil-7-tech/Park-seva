-- Fix the remaining function search path issue
CREATE OR REPLACE FUNCTION public.track_workflow_execution()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
begin
  if new.status = 'completed' and (old.status is null or old.status != 'completed') then
    insert into public.usage_tracking (user_id, metric_type, metadata)
    values (
      new.user_id,
      'workflow_execution',
      jsonb_build_object('workflow_id', new.workflow_id, 'execution_id', new.id)
    );
  end if;
  return new;
end;
$$;