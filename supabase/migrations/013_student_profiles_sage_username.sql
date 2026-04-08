alter table student_profiles
  add column if not exists sage_username text;

create unique index if not exists student_profiles_sage_username_lower_key
  on student_profiles (lower(sage_username))
  where sage_username is not null;
