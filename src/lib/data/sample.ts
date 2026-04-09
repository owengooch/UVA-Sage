import type { Course, MajorRequirement, Opportunity } from "@/types/domain";

export const sampleCourses: Course[] = [
  {
    code: "APMA 2130",
    title: "Ordinary Differential Equations",
    credits: 3,
    professor: "Staff",
    description: "Core math course for many engineering majors.",
    majors: ["Computer Engineering", "Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Systems Engineering"],
    tags: ["math", "modeling", "required"],
    category: "required"
  },
  {
    code: "CS 2150",
    title: "Program and Data Representation",
    credits: 4,
    professor: "Staff",
    description: "Systems-level programming and computer architecture foundations.",
    majors: ["Computer Engineering", "Computer Science"],
    tags: ["systems", "software", "required"],
    category: "required"
  },
  {
    code: "ECE 3750",
    title: "Embedded Systems",
    credits: 3,
    professor: "Prof. Williams",
    description: "Hardware-software co-design for embedded applications.",
    majors: ["Computer Engineering", "Electrical Engineering"],
    tags: ["embedded", "hardware", "internship-ready"],
    category: "elective"
  },
  {
    code: "SYS 3020",
    title: "Data and Information Engineering",
    credits: 3,
    professor: "Prof. Larkin",
    description: "Data modeling and information systems design.",
    majors: ["Systems Engineering", "Computer Engineering"],
    tags: ["data", "analytics", "research"],
    category: "elective"
  },
  {
    code: "MAE 2100",
    title: "Introduction to Mechanical Design",
    credits: 3,
    professor: "Prof. Thomas",
    description: "Design principles and prototyping methods for mechanical systems.",
    majors: ["Mechanical Engineering", "Civil Engineering"],
    tags: ["design", "mechanics", "project-based"],
    category: "elective"
  },
  {
    code: "ENGR 3200",
    title: "Engineering Product Development",
    credits: 3,
    professor: "Prof. Patel",
    description: "Cross-disciplinary product development focused on teamwork and execution.",
    majors: ["All"],
    tags: ["product", "teamwork", "innovation", "internship-ready"],
    category: "elective"
  },
  {
    code: "COMM 1800",
    title: "Public Speaking",
    credits: 3,
    professor: "Staff",
    description: "Build communication skills for presentations and interviews.",
    majors: ["All"],
    tags: ["communication", "leadership", "outside"],
    category: "non_engineering"
  },
  {
    code: "ECON 2010",
    title: "Principles of Microeconomics",
    credits: 3,
    professor: "Staff",
    description: "Economic fundamentals useful for product and startup thinking.",
    majors: ["All"],
    tags: ["business", "policy", "outside"],
    category: "non_engineering"
  },
  {
    code: "PSYC 2150",
    title: "Introduction to Psychological Science",
    credits: 3,
    professor: "Staff",
    description: "Foundational methods and topics across psychology — perception, cognition, development, and mental health contexts.",
    majors: ["All"],
    tags: ["psychology", "research", "outside"],
    category: "non_engineering"
  },
  {
    code: "SOC 1010",
    title: "Introductory Sociology",
    credits: 3,
    professor: "Staff",
    description: "Core concepts in social structure, inequality, and group behavior.",
    majors: ["All"],
    tags: ["sociology", "society", "outside"],
    category: "non_engineering"
  }
];

export const sampleRequirements: MajorRequirement[] = [
  { major: "Computer Engineering", courseCode: "APMA 2130", requirementType: "math" },
  { major: "Computer Engineering", courseCode: "CS 2150", requirementType: "core" },
  { major: "Mechanical Engineering", courseCode: "APMA 2130", requirementType: "math" },
  { major: "Electrical Engineering", courseCode: "APMA 2130", requirementType: "math" },
  { major: "Systems Engineering", courseCode: "APMA 2130", requirementType: "math" },
  { major: "Civil Engineering", courseCode: "APMA 2130", requirementType: "math" }
];

export const sampleOpportunities: Opportunity[] = [
  {
    type: "research",
    title: "Autonomous Systems Lab Undergraduate Research",
    description: "Assist graduate students on robot perception and planning.",
    department: "Mechanical and Aerospace Engineering",
    eligibility: "Open to first-year and second-year students with Python interest.",
    tags: ["robotics", "research", "ai", "autonomous systems"],
    link: "https://engineering.virginia.edu/"
  },
  {
    type: "research",
    title: "Cyber-Physical Systems Research Assistant",
    description: "Contribute to embedded sensing research projects.",
    department: "Electrical and Computer Engineering",
    eligibility: "Best for students with circuits or embedded interests.",
    tags: ["embedded", "hardware", "research", "systems"],
    link: "https://engineering.virginia.edu/"
  },
  {
    type: "internship",
    title: "UVA Engineering Career Center Internship Cohort",
    description: "Structured prep with resume review and employer matching.",
    department: "Engineering Career Development",
    eligibility: "Open to all engineering majors.",
    tags: ["career", "internship", "resume", "industry"],
    link: "https://engineering.virginia.edu/"
  },
  {
    type: "internship",
    title: "Charlottesville Startup Internship Program",
    description: "Summer placements in local startups and tech ventures.",
    department: "Technology Entrepreneurship",
    eligibility: "Students interested in product and startup work.",
    tags: ["startup", "internship", "product", "business"],
    link: "https://engineering.virginia.edu/"
  },
  {
    type: "study_abroad",
    title: "Engineering in Germany Semester Program",
    description: "Take technical electives and visit industrial partners.",
    department: "International Programs",
    eligibility: "Sophomores and juniors in engineering.",
    tags: ["study abroad", "global", "industry", "mechanical"],
    link: "https://engineering.virginia.edu/"
  },
  {
    type: "study_abroad",
    title: "Sustainable Design in Denmark",
    description: "Focus on sustainability, systems, and design thinking.",
    department: "International Programs",
    eligibility: "Open to all engineering majors with design interest.",
    tags: ["study abroad", "sustainability", "design", "systems"],
    link: "https://engineering.virginia.edu/"
  }
];
