alter table student_goals
  add column if not exists study_abroad_interests text[] not null default '{}';
