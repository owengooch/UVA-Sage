-- Clone base major_requirements rows into per-track variants for non-Civil majors.
-- Track slugs match option values in src/lib/major-tracks.ts (undecided = empty = base major only).
-- Civil Engineering already uses Civil Engineering (IS|EWR|SE|CEM) in the source import; skip.
-- Idempotent: NOT EXISTS avoids duplicates if re-run.

INSERT INTO major_requirements (major, course_code, requirement_type)
SELECT v.base_major || ' (' || v.slug || ')', b.course_code, b.requirement_type
FROM (
  VALUES
    ('Aerospace Engineering', 'aerodynamics-fluids'),
    ('Aerospace Engineering', 'structures'),
    ('Aerospace Engineering', 'propulsion'),
    ('Aerospace Engineering', 'controls-flight'),
    ('Biomedical Engineering', 'computational-bme'),
    ('Biomedical Engineering', 'biotech-pharma'),
    ('Chemical Engineering', 'broad-based'),
    ('Chemical Engineering', 'data-analytics-che'),
    ('Chemical Engineering', 'biotechnology-che'),
    ('Chemical Engineering', 'pre-med-che'),
    ('Computer Engineering', 'chips'),
    ('Computer Engineering', 'electronic-photonic'),
    ('Computer Engineering', 'robotics-embedded'),
    ('Computer Engineering', 'machine-learning'),
    ('Computer Science (Engineering)', 'software'),
    ('Computer Science (Engineering)', 'systems'),
    ('Computer Science (Engineering)', 'ai-ml'),
    ('Computer Science (Engineering)', 'theory'),
    ('Computer Science (Engineering)', 'security'),
    ('Electrical Engineering', 'chips'),
    ('Electrical Engineering', 'electronic-photonic'),
    ('Electrical Engineering', 'robotics-embedded'),
    ('Electrical Engineering', 'machine-learning'),
    ('Materials Science and Engineering', 'electronic-materials'),
    ('Materials Science and Engineering', 'structural'),
    ('Materials Science and Engineering', 'energy-sustainability'),
    ('Mechanical Engineering', 'thermal-fluids'),
    ('Mechanical Engineering', 'mechanics-materials'),
    ('Mechanical Engineering', 'design-manufacturing'),
    ('Mechanical Engineering', 'dynamics-controls'),
    ('Systems Engineering', 'human-tech'),
    ('Systems Engineering', 'intelligent-automation'),
    ('Systems Engineering', 'operations-analytics')
) AS v(base_major, slug)
JOIN major_requirements b ON b.major = v.base_major
WHERE NOT EXISTS (
  SELECT 1
  FROM major_requirements x
  WHERE x.major = v.base_major || ' (' || v.slug || ')'
    AND x.course_code = b.course_code
    AND x.requirement_type = b.requirement_type
);
