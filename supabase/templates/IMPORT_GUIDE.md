# UVA Sage CSV Import Guide

Use this order to import CSV files into Supabase Table Editor.

## Before you import

- Make sure these migrations have already been run:
  - `supabase/migrations/001_initial.sql`
  - `supabase/migrations/002_catalog_upgrade.sql`
- In Supabase, go to `Table Editor`.
- For each table below, click `Insert` -> `Import data from CSV`.

## Import order

1. `01_majors.csv` -> table `majors`
2. `02_courses.csv` -> table `courses`
3. `05_opportunities.csv` -> table `opportunities`

## Files that require lookup mapping

These CSVs include human-readable keys (`course_code`, `major_name`) and need SQL mapping after import.

- `03_course_metadata.csv`
- `04_major_course_requirements.csv`

### Recommended beginner flow

1. Import rows manually with SQL snippets below (copy and run in SQL Editor).
2. Later, when your dataset is larger, automate with staging tables.

## SQL for `course_metadata`

```sql
insert into course_metadata (course_id, semester_offered, prerequisites, source_url, last_verified_at)
select
  c.id as course_id,
  t.semester_offered::text[],
  t.prerequisites::text[],
  t.source_url,
  t.last_verified_at::timestamptz
from (
  values
    ('APMA 2130', '{Fall,Spring}', '{APMA 1110}', 'https://engineering.virginia.edu', '2026-03-30'),
    ('CS 2150', '{Fall,Spring}', '{CS 1110}', 'https://engineering.virginia.edu', '2026-03-30'),
    ('ECE 3750', '{Fall}', '{ECE 2330}', 'https://engineering.virginia.edu', '2026-03-30'),
    ('SYS 3020', '{Spring}', '{SYS 2001}', 'https://engineering.virginia.edu', '2026-03-30'),
    ('MAE 2100', '{Fall}', '{PHYS 1425}', 'https://engineering.virginia.edu', '2026-03-30'),
    ('ENGR 3200', '{Fall,Spring}', '{}', 'https://engineering.virginia.edu', '2026-03-30'),
    ('COMM 1800', '{Fall,Spring,Summer}', '{}', 'https://louslist.org', '2026-03-30'),
    ('ECON 2010', '{Fall,Spring,Summer}', '{}', 'https://louslist.org', '2026-03-30')
) as t(course_code, semester_offered, prerequisites, source_url, last_verified_at)
join courses c on c.code = t.course_code
on conflict (course_id) do update
set
  semester_offered = excluded.semester_offered,
  prerequisites = excluded.prerequisites,
  source_url = excluded.source_url,
  last_verified_at = excluded.last_verified_at;
```

## SQL for `major_course_requirements`

```sql
insert into major_course_requirements
  (major_id, course_id, requirement_bucket, is_required, min_grade, notes)
select
  m.id,
  c.id,
  t.requirement_bucket,
  t.is_required,
  t.min_grade,
  t.notes
from (
  values
    ('Computer Engineering', 'APMA 2130', 'math', true, 'C-', 'Core math requirement'),
    ('Computer Engineering', 'CS 2150', 'core', true, 'C-', 'Core systems requirement'),
    ('Mechanical Engineering', 'APMA 2130', 'math', true, 'C-', 'Core math requirement'),
    ('Electrical Engineering', 'APMA 2130', 'math', true, 'C-', 'Core math requirement'),
    ('Systems Engineering', 'APMA 2130', 'math', true, 'C-', 'Core math requirement'),
    ('Civil Engineering', 'APMA 2130', 'math', true, 'C-', 'Core math requirement'),
    ('Mechanical Engineering', 'MAE 2100', 'core', true, 'C-', 'Intro major requirement'),
    ('Systems Engineering', 'SYS 3020', 'core', true, 'C-', 'Data systems foundation')
) as t(major_name, course_code, requirement_bucket, is_required, min_grade, notes)
join majors m on m.name = t.major_name
join courses c on c.code = t.course_code
on conflict (major_id, course_id, requirement_bucket) do update
set
  is_required = excluded.is_required,
  min_grade = excluded.min_grade,
  notes = excluded.notes;
```
