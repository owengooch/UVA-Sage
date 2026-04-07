insert into majors (name, department, degree_type) values
  ('Aerospace Engineering', 'Mechanical and Aerospace Engineering', 'BS'),
  ('Biomedical Engineering', 'Biomedical Engineering', 'BS'),
  ('Chemical Engineering', 'Chemical Engineering', 'BS'),
  ('Civil Engineering', 'Civil and Environmental Engineering', 'BS'),
  ('Computer Engineering', 'Electrical and Computer Engineering', 'BS'),
  ('Computer Science (Engineering)', 'Computer Science', 'BS'),
  ('Electrical Engineering', 'Electrical and Computer Engineering', 'BS'),
  ('Mechanical Engineering', 'Mechanical and Aerospace Engineering', 'BS'),
  ('Materials Science and Engineering', 'Materials Science and Engineering', 'BS'),
  ('Systems Engineering', 'Systems and Information Engineering', 'BS')
on conflict (name) do nothing;
