-- Per-user completed course codes (Supabase Auth). Dashboard syncs when signed in.
create table if not exists student_course_completions (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_code text not null references courses (code) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, course_code)
);

create index if not exists idx_student_course_completions_user on student_course_completions (user_id);

alter table student_course_completions enable row level security;

create policy "student_course_completions_select_own"
  on student_course_completions for select
  using (auth.uid() = user_id);

create policy "student_course_completions_insert_own"
  on student_course_completions for insert
  with check (auth.uid() = user_id);

create policy "student_course_completions_delete_own"
  on student_course_completions for delete
  using (auth.uid() = user_id);
