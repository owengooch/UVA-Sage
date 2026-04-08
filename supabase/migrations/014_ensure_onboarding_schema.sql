-- Idempotent: run on hosted Supabase if profile save fails ("column ... not found in schema cache").
-- Aligns student_profiles / student_goals with the app.

alter table student_profiles
  add column if not exists major_track text,
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists outside_interest_details text[] not null default '{}',
  add column if not exists uva_email text,
  add column if not exists sage_username text;

alter table student_goals
  add column if not exists study_abroad_interests text[] not null default '{}';

create unique index if not exists student_profiles_user_id_unique
  on student_profiles (user_id)
  where user_id is not null;

create unique index if not exists student_profiles_uva_email_lower_key
  on student_profiles (lower(uva_email))
  where uva_email is not null;

create unique index if not exists student_profiles_sage_username_lower_key
  on student_profiles (lower(sage_username))
  where sage_username is not null;
