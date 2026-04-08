-- Email used for Supabase Auth magic links; stored on profile for admin/reporting and client display.
alter table student_profiles
  add column if not exists uva_email text;

-- One profile per UVA email (verified via auth.users).
create unique index if not exists student_profiles_uva_email_lower_key
  on student_profiles (lower(uva_email))
  where uva_email is not null;
