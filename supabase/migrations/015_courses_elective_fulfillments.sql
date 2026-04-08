-- Elective / requirement tags from Undergraduate Record footnotes (see src/lib/elective-fulfillment-tags.ts).
-- Backfill: npm run recompute:electives

alter table courses
  add column if not exists elective_fulfillments text[] not null default '{}';

create index if not exists idx_courses_elective_fulfillments on courses using gin (elective_fulfillments);
