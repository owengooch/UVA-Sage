insert into courses (code, title, credits, professor, description, majors, tags, category) values
  ('APMA 2130', 'Ordinary Differential Equations', 3, 'Staff', 'Core math course for many engineering majors.', '{"Computer Engineering","Mechanical Engineering","Electrical Engineering"}', '{"math","modeling","required"}', 'required'),
  ('CS 2150', 'Program and Data Representation', 4, 'Staff', 'Systems-level programming and computer architecture foundations.', '{"Computer Engineering","Computer Science"}', '{"systems","software","required"}', 'required'),
  ('ECE 3750', 'Embedded Systems', 3, 'Prof. Williams', 'Hardware-software co-design for embedded applications.', '{"Computer Engineering","Electrical Engineering"}', '{"embedded","hardware","internship-ready"}', 'elective'),
  ('SYS 3020', 'Data and Information Engineering', 3, 'Prof. Larkin', 'Data modeling and information systems design.', '{"Systems Engineering","Computer Engineering"}', '{"data","analytics","research"}', 'elective'),
  ('COMM 1800', 'Public Speaking', 3, 'Staff', 'Build communication skills for presentations and interviews.', '{"All"}', '{"communication","leadership","outside"}', 'non_engineering'),
  ('ECON 2010', 'Principles of Microeconomics', 3, 'Staff', 'Economic fundamentals useful for product and startup thinking.', '{"All"}', '{"business","policy","outside"}', 'non_engineering')
on conflict (code) do nothing;

insert into opportunities (type, title, description, department, eligibility, tags, link) values
  ('research', 'Autonomous Systems Lab Undergraduate Research', 'Assist graduate students on robot perception and planning.', 'Mechanical and Aerospace Engineering', 'Open to first-year and second-year students with Python interest.', '{"robotics","research","ai","autonomous systems"}', 'https://engineering.virginia.edu/'),
  ('research', 'Cyber-Physical Systems Research Assistant', 'Contribute to embedded sensing research projects.', 'Electrical and Computer Engineering', 'Best for students with circuits or embedded interests.', '{"embedded","hardware","research","systems"}', 'https://engineering.virginia.edu/'),
  ('internship', 'UVA Engineering Career Center Internship Cohort', 'Structured prep with resume review and employer matching.', 'Engineering Career Development', 'Open to all engineering majors.', '{"career","internship","resume","industry"}', 'https://engineering.virginia.edu/'),
  ('internship', 'Charlottesville Startup Internship Program', 'Summer placements in local startups and tech ventures.', 'Technology Entrepreneurship', 'Students interested in product and startup work.', '{"startup","internship","product","business"}', 'https://engineering.virginia.edu/'),
  ('study_abroad', 'Engineering in Germany Semester Program', 'Take technical electives and visit industrial partners.', 'International Programs', 'Sophomores and juniors in engineering.', '{"study abroad","global","industry","mechanical"}', 'https://engineering.virginia.edu/'),
  ('study_abroad', 'Sustainable Design in Denmark', 'Focus on sustainability, systems, and design thinking.', 'International Programs', 'Open to all engineering majors with design interest.', '{"study abroad","sustainability","design","systems"}', 'https://engineering.virginia.edu/');

insert into major_requirements (major, course_code, requirement_type) values
  ('Computer Engineering', 'APMA 2130', 'math'),
  ('Computer Engineering', 'CS 2150', 'core'),
  ('Mechanical Engineering', 'APMA 2130', 'math')
on conflict do nothing;
