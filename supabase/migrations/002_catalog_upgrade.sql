create table if not exists majors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  department text not null,
  degree_type text not null default 'BS',
  created_at timestamptz not null default now()
);

create table if not exists course_offerings (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references courses(id) on delete cascade,
  term text not null,
  professor text not null,
  seats_total int,
  seats_open int,
  updated_at timestamptz not null default now()
);

create table if not exists course_metadata (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null unique references courses(id) on delete cascade,
  semester_offered text[] not null default '{}',
  prerequisites text[] not null default '{}',
  source_url text,
  last_verified_at timestamptz
);

create table if not exists major_course_requirements (
  id uuid primary key default gen_random_uuid(),
  major_id uuid not null references majors(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  requirement_bucket text not null check (requirement_bucket in ('core', 'technical_elective', 'science', 'math', 'capstone', 'humanities')),
  is_required boolean not null default true,
  min_grade text,
  notes text,
  unique (major_id, course_id, requirement_bucket)
);

alter table opportunities
  add column if not exists source_url text,
  add column if not exists last_verified_at timestamptz,
  add column if not exists deadline date,
  add column if not exists class_years text[] not null default '{}';

create index if not exists idx_major_course_requirements_major on major_course_requirements(major_id);
create index if not exists idx_course_offerings_course_id on course_offerings(course_id);
create index if not exists idx_opportunities_deadline on opportunities(deadline);
