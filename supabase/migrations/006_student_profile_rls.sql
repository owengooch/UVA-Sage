-- Persist onboarding fields on student_profiles; RLS per auth user.

alter table student_profiles
  add column if not exists major_track text,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists student_profiles_user_id_unique
  on student_profiles (user_id)
  where user_id is not null;

alter table student_profiles enable row level security;
alter table student_goals enable row level security;

drop policy if exists "student_profiles_select_own" on student_profiles;
drop policy if exists "student_profiles_insert_own" on student_profiles;
drop policy if exists "student_profiles_update_own" on student_profiles;
drop policy if exists "student_profiles_delete_own" on student_profiles;

create policy "student_profiles_select_own"
  on student_profiles for select
  using (auth.uid() = user_id);

create policy "student_profiles_insert_own"
  on student_profiles for insert
  with check (auth.uid() = user_id);

create policy "student_profiles_update_own"
  on student_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "student_profiles_delete_own"
  on student_profiles for delete
  using (auth.uid() = user_id);

drop policy if exists "student_goals_select_own" on student_goals;
drop policy if exists "student_goals_insert_own" on student_goals;
drop policy if exists "student_goals_update_own" on student_goals;
drop policy if exists "student_goals_delete_own" on student_goals;

create policy "student_goals_select_own"
  on student_goals for select
  using (
    exists (
      select 1 from student_profiles p
      where p.id = student_goals.profile_id and p.user_id = auth.uid()
    )
  );

create policy "student_goals_insert_own"
  on student_goals for insert
  with check (
    exists (
      select 1 from student_profiles p
      where p.id = student_goals.profile_id and p.user_id = auth.uid()
    )
  );

create policy "student_goals_update_own"
  on student_goals for update
  using (
    exists (
      select 1 from student_profiles p
      where p.id = student_goals.profile_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from student_profiles p
      where p.id = student_goals.profile_id and p.user_id = auth.uid()
    )
  );

create policy "student_goals_delete_own"
  on student_goals for delete
  using (
    exists (
      select 1 from student_profiles p
      where p.id = student_goals.profile_id and p.user_id = auth.uid()
    )
  );
