alter table student_profiles
  add column if not exists outside_interest_details text[] not null default '{}';
