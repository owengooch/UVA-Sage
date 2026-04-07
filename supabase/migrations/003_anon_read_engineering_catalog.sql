-- Allow the Next.js app (anon key) to read catalog tables for the dashboard.
-- Run in Supabase SQL Editor if API returns empty rows or permission errors.

alter table courses enable row level security;
alter table major_requirements enable row level security;
alter table opportunities enable row level security;

drop policy if exists "Allow public read courses" on courses;
create policy "Allow public read courses" on courses for select using (true);

drop policy if exists "Allow public read major_requirements" on major_requirements;
create policy "Allow public read major_requirements" on major_requirements for select using (true);

drop policy if exists "Allow public read opportunities" on opportunities;
create policy "Allow public read opportunities" on opportunities for select using (true);
