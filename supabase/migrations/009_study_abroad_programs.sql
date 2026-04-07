-- Official UVA Education Abroad program listings (see data/uva-study-abroad-programs.json).
-- Course titles must be refreshed from each program's Academics tab; many portfolio pages are JS-rendered.

create table if not exists study_abroad_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  detail_url text not null,
  term_bucket text not null check (term_bucket in ('semester_year', 'january', 'summer', 'spring_embedded', 'virtual')),
  region_group text,
  location_summary text not null default '',
  terms_offered_text text not null default '',
  description text not null default '',
  courses_offered text[] not null default '{}',
  subject_areas text[] not null default '{}',
  tags text[] not null default '{}',
  credit_note text not null default '',
  walker_scholarship boolean not null default false,
  transfer_credit boolean not null default false,
  combination_credit boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_study_abroad_programs_term on study_abroad_programs(term_bucket);
create index if not exists idx_study_abroad_programs_tags on study_abroad_programs using gin(tags);

alter table study_abroad_programs enable row level security;

drop policy if exists "Allow public read study_abroad_programs" on study_abroad_programs;
create policy "Allow public read study_abroad_programs" on study_abroad_programs for select using (true);
