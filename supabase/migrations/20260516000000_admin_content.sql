-- =========================================================
-- Iteration 6b — Admin content CRUD:
--   * soft-delete columns for exercises/workouts/foods
--   * admin_audit_log extension (entity_type, entity_id)
--   * RLS read policies updated to hide soft-deleted from non-admin
--   * SECURITY DEFINER RPCs for atomic workout/program save + audit logger
--
-- Audit action values (entity.action):
--   exercise.{create,update,delete,restore}
--   workout.{create,update,delete,restore}
--   program.{create,update,delete}
--   blog_post.{create,update,delete}
--   food.{create,update,delete,restore}
-- =========================================================

-- 1. SOFT-DELETE COLUMNS -----------------------------------
alter table public.exercises add column deleted_at timestamptz;
alter table public.workouts  add column deleted_at timestamptz;
alter table public.foods     add column deleted_at timestamptz;

create index exercises_active_idx
  on public.exercises (created_at desc) where deleted_at is null;
create index workouts_active_idx
  on public.workouts  (created_at desc) where deleted_at is null;
create index foods_active_idx
  on public.foods     (created_at desc) where deleted_at is null;

-- 2. ADMIN_AUDIT_LOG EXTENSION -----------------------------
alter table public.admin_audit_log
  add column entity_type text,
  add column entity_id   uuid;

create index admin_audit_log_entity_idx
  on public.admin_audit_log (entity_type, entity_id, created_at desc);

-- 3. RLS READ POLICIES — hide soft-deleted from non-admin --
drop policy "exercises_read" on public.exercises;
create policy "exercises_read" on public.exercises
  for select using (
    auth.role() = 'authenticated'
    and (deleted_at is null or public.is_admin())
  );

drop policy "workouts_read" on public.workouts;
create policy "workouts_read" on public.workouts
  for select using (
    auth.role() = 'authenticated'
    and (deleted_at is null or public.is_admin())
  );

drop policy "foods_read" on public.foods;
create policy "foods_read" on public.foods
  for select using (
    auth.role() = 'authenticated'
    and (deleted_at is null or public.is_admin())
  );

-- 4. RPC: admin_log_content_action -------------------------
-- Universal logger for entity CRUD that doesn't need atomic parent+children save
create or replace function public.admin_log_content_action(
  p_action      text,
  p_entity_type text,
  p_entity_id   uuid,
  p_before      jsonb,
  p_after       jsonb,
  p_note        text default null
)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_admin_id uuid := auth.uid();
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.admin_audit_log
    (admin_id, action, target_user_id, entity_type, entity_id, before, after, note)
  values
    (v_admin_id, p_action, null, p_entity_type, p_entity_id, p_before, p_after, p_note);
end;
$$;

grant execute on function public.admin_log_content_action(
  text, text, uuid, jsonb, jsonb, text
) to authenticated;

-- 5. RPC: admin_save_workout_with_exercises ----------------
-- Atomic upsert workout + replace workout_exercises + audit log
create or replace function public.admin_save_workout_with_exercises(
  p_workout   jsonb,
  p_exercises jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_admin_id   uuid := auth.uid();
  v_workout_id uuid;
  v_is_update  boolean;
  v_before     jsonb;
  v_after      jsonb;
  v_exercises  jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_workout_id := nullif(p_workout->>'id', '')::uuid;
  v_is_update  := v_workout_id is not null;

  if v_is_update then
    select to_jsonb(w.*) into v_before
      from public.workouts w
      where w.id = v_workout_id;

    if v_before is null then
      raise exception 'workout_not_found' using errcode = 'P0002';
    end if;

    update public.workouts set
      slug             = coalesce(p_workout->>'slug',             slug),
      title            = coalesce(p_workout->>'title',            title),
      description      =          p_workout->>'description',
      category         = coalesce((p_workout->>'category')::workout_category_enum, category),
      cover_path       =          p_workout->>'cover_path',
      duration_minutes = coalesce((p_workout->>'duration_minutes')::int, duration_minutes),
      difficulty       = coalesce((p_workout->>'difficulty')::int,       difficulty),
      min_tier         = coalesce((p_workout->>'min_tier')::subscription_tier_enum, min_tier),
      deleted_at       = case
                           when p_workout ? 'deleted_at'
                             then nullif(p_workout->>'deleted_at', '')::timestamptz
                           else deleted_at
                         end
    where id = v_workout_id;
  else
    insert into public.workouts
      (slug, title, description, category, cover_path,
       duration_minutes, difficulty, min_tier)
    values
      (p_workout->>'slug',
       p_workout->>'title',
       p_workout->>'description',
       (p_workout->>'category')::workout_category_enum,
       p_workout->>'cover_path',
       (p_workout->>'duration_minutes')::int,
       (p_workout->>'difficulty')::int,
       coalesce((p_workout->>'min_tier')::subscription_tier_enum, 'basic'))
    returning id into v_workout_id;
  end if;

  delete from public.workout_exercises where workout_id = v_workout_id;

  insert into public.workout_exercises
    (workout_id, position, exercise_id, sets, reps, rest_seconds, notes)
  select
    v_workout_id,
    (row_number() over (order by ord))::int as position,
    (item->>'exercise_id')::uuid,
    (item->>'sets')::int,
     item->>'reps',
    (item->>'rest_seconds')::int,
     item->>'notes'
  from jsonb_array_elements(coalesce(p_exercises, '[]'::jsonb))
       with ordinality as t(item, ord);

  select to_jsonb(w.*) into v_after
    from public.workouts w where w.id = v_workout_id;

  select coalesce(jsonb_agg(to_jsonb(we.*) order by we.position), '[]'::jsonb)
    into v_exercises
    from public.workout_exercises we
    where we.workout_id = v_workout_id;

  v_after := v_after || jsonb_build_object('exercises', v_exercises);

  insert into public.admin_audit_log
    (admin_id, action, target_user_id, entity_type, entity_id, before, after)
  values
    (v_admin_id,
     case when v_is_update then 'workout.update' else 'workout.create' end,
     null, 'workout', v_workout_id, v_before, v_after);

  return v_after;
end;
$$;

grant execute on function public.admin_save_workout_with_exercises(jsonb, jsonb)
  to authenticated;

-- 6. RPC: admin_save_program_with_workouts -----------------
-- Atomic upsert program + replace program_workouts + audit log
create or replace function public.admin_save_program_with_workouts(
  p_program  jsonb,
  p_schedule jsonb
)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_admin_id   uuid := auth.uid();
  v_program_id uuid;
  v_is_update  boolean;
  v_before     jsonb;
  v_after      jsonb;
  v_schedule   jsonb;
begin
  if not public.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  v_program_id := nullif(p_program->>'id', '')::uuid;
  v_is_update  := v_program_id is not null;

  if v_is_update then
    select to_jsonb(p.*) into v_before
      from public.programs p
      where p.id = v_program_id;

    if v_before is null then
      raise exception 'program_not_found' using errcode = 'P0002';
    end if;

    update public.programs set
      slug              = coalesce(p_program->>'slug',  slug),
      title             = coalesce(p_program->>'title', title),
      description       =          p_program->>'description',
      cover_path        =          p_program->>'cover_path',
      weeks             = coalesce((p_program->>'weeks')::int,             weeks),
      sessions_per_week = coalesce((p_program->>'sessions_per_week')::int, sessions_per_week),
      difficulty        = coalesce((p_program->>'difficulty')::int,        difficulty),
      min_tier          = coalesce((p_program->>'min_tier')::subscription_tier_enum, min_tier)
    where id = v_program_id;
  else
    insert into public.programs
      (slug, title, description, cover_path,
       weeks, sessions_per_week, difficulty, min_tier)
    values
      (p_program->>'slug',
       p_program->>'title',
       p_program->>'description',
       p_program->>'cover_path',
       (p_program->>'weeks')::int,
       (p_program->>'sessions_per_week')::int,
       (p_program->>'difficulty')::int,
       coalesce((p_program->>'min_tier')::subscription_tier_enum, 'pro'))
    returning id into v_program_id;
  end if;

  delete from public.program_workouts where program_id = v_program_id;

  insert into public.program_workouts (program_id, week, day_of_week, workout_id)
  select
    v_program_id,
    (item->>'week')::int,
    (item->>'day_of_week')::int,
    (item->>'workout_id')::uuid
  from jsonb_array_elements(coalesce(p_schedule, '[]'::jsonb)) as t(item);

  select to_jsonb(p.*) into v_after
    from public.programs p where p.id = v_program_id;

  select coalesce(
           jsonb_agg(
             to_jsonb(pw.*)
             order by pw.week, pw.day_of_week
           ),
           '[]'::jsonb
         )
    into v_schedule
    from public.program_workouts pw
    where pw.program_id = v_program_id;

  v_after := v_after || jsonb_build_object('schedule', v_schedule);

  insert into public.admin_audit_log
    (admin_id, action, target_user_id, entity_type, entity_id, before, after)
  values
    (v_admin_id,
     case when v_is_update then 'program.update' else 'program.create' end,
     null, 'program', v_program_id, v_before, v_after);

  return v_after;
end;
$$;

grant execute on function public.admin_save_program_with_workouts(jsonb, jsonb)
  to authenticated;
