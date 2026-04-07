create extension if not exists "pgcrypto";

create table if not exists student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  major text not null,
  graduation_year text not null,
  outside_interests text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists student_goals (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references student_profiles(id) on delete cascade,
  research_goal text not null default '',
  internship_goal text not null default '',
  study_abroad_goal text not null default ''
);

create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text not null,
  credits int not null,
  professor text not null,
  description text not null,
  majors text[] not null default '{}',
  tags text[] not null default '{}',
  category text not null check (category in ('required', 'elective', 'non_engineering'))
);

create table if not exists opportunities (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('research', 'internship', 'study_abroad', 'co_curricular')),
  title text not null,
  description text not null,
  department text not null,
  eligibility text not null,
  tags text[] not null default '{}',
  link text not null
);

create table if not exists major_requirements (
  id uuid primary key default gen_random_uuid(),
  major text not null,
  course_code text not null references courses(code) on delete cascade,
  requirement_type text not null check (requirement_type in ('core', 'technical_elective', 'science', 'math'))
);

create index if not exists idx_courses_category on courses(category);
create index if not exists idx_opportunities_type on opportunities(type);
create index if not exists idx_major_requirements_major on major_requirements(major);
