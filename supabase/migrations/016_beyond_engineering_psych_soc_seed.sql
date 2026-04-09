-- Representative HSS courses for Beyond Engineering matching (psychology / sociology interests).
-- Safe to re-run: skips if codes already exist.

insert into courses (code, title, credits, professor, description, majors, tags, category)
values
  (
    'PSYC 2150',
    'Introduction to Psychological Science',
    3,
    'Staff',
    'Foundational methods and topics across psychology — perception, cognition, development, and mental health contexts.',
    '{"All"}',
    '{"psychology","research","outside"}',
    'non_engineering'
  ),
  (
    'SOC 1010',
    'Introductory Sociology',
    3,
    'Staff',
    'Core concepts in social structure, inequality, and group behavior.',
    '{"All"}',
    '{"sociology","society","outside"}',
    'non_engineering'
  )
on conflict (code) do nothing;
