/** Detail pill under a specific broad interest; `value` feeds course matching (lowercased). */
export type OutsideInterestDetailOption = {
  value: string;
  label: string;
};

export type OutsideInterestOption = {
  value: string;
  label: string;
  /** In-depth questions only for this broad choice (not the whole section). */
  followUp?: {
    heading: string;
    options: OutsideInterestDetailOption[];
  };
};

export type OutsideInterestSection = {
  heading: string;
  options: OutsideInterestOption[];
};

export const OUTSIDE_INTEREST_SECTIONS: OutsideInterestSection[] = [
  {
    heading: "Communication & Leadership",
    options: [
      {
        value: "communication",
        label: "Communication & Rhetoric",
        followUp: {
          heading: "What kind of communication work pulls you in?",
          options: [
            { value: "comm-rhetoric-persuasion", label: "Persuasion & rhetorical theory" },
            { value: "comm-interpersonal-relational", label: "Interpersonal & relational communication" },
            { value: "comm-organizational", label: "Organizational & professional communication" },
            { value: "comm-health-science", label: "Health, science & risk communication" },
            { value: "comm-political-public", label: "Political & public discourse" },
            { value: "comm-digital-media", label: "Digital media & platforms" }
          ]
        }
      },
      {
        value: "leadership",
        label: "Leadership & Organizations",
        followUp: {
          heading: "What kind of leadership contexts interest you?",
          options: [
            { value: "lead-student-orgs", label: "Student organizations & clubs" },
            { value: "lead-project-teams", label: "Project teams & execution" },
            { value: "lead-dei-inclusion", label: "Inclusion, equity & culture change" },
            { value: "lead-ethical-decisions", label: "Ethics & responsible leadership" },
            { value: "lead-community-nonprofit", label: "Community & nonprofit leadership" },
            { value: "lead-entrepreneurial", label: "Startup & entrepreneurial leadership" }
          ]
        }
      },
      {
        value: "writing",
        label: "Writing & Composition",
        followUp: {
          heading: "Which writing paths feel closest?",
          options: [
            { value: "write-academic-research", label: "Academic & research writing" },
            { value: "write-professional-tech", label: "Professional & technical writing" },
            { value: "write-creative-nonfiction", label: "Creative nonfiction & essays" },
            { value: "write-poetry-poetics", label: "Poetry & poetics" },
            { value: "write-editing-workshops", label: "Editing, tutoring & workshops" },
            { value: "write-multimodal", label: "Multimodal & digital composition" }
          ]
        }
      },
      {
        value: "journalism",
        label: "Media & Journalism",
        followUp: {
          heading: "Where in journalism and media do you lean?",
          options: [
            { value: "jour-reporting-investigate", label: "Reporting & investigative stories" },
            { value: "jour-sports-culture-beat", label: "Sports, arts & culture beats" },
            { value: "jour-broadcast-podcast", label: "Broadcast, audio & podcast" },
            { value: "jour-photo-video-doc", label: "Photo, video & documentary" },
            { value: "jour-data-visual", label: "Data & visualization journalism" },
            { value: "jour-audience-engagement", label: "Audience, product & engagement" }
          ]
        }
      }
    ]
  },
  {
    heading: "Business, Policy & Society",
    options: [
      {
        value: "business",
        label: "Business & Management",
        followUp: {
          heading: "Which business areas do you want to explore?",
          options: [
            { value: "biz-finance", label: "Finance & markets" },
            { value: "biz-marketing", label: "Marketing & brand" },
            { value: "biz-operations-supply", label: "Operations & supply chain" },
            { value: "biz-strategy-consulting", label: "Strategy & consulting-style problems" },
            { value: "biz-hr-organizations", label: "People, culture & organizations" },
            { value: "biz-accounting-analytics", label: "Accounting & business analytics" }
          ]
        }
      },
      {
        value: "economics",
        label: "Economics",
        followUp: {
          heading: "What lens in economics fits you best?",
          options: [
            { value: "econ-micro-behavior", label: "Microeconomics & individual choices" },
            { value: "econ-macro-policy", label: "Macro, growth & policy" },
            { value: "econ-international-trade", label: "International & trade" },
            { value: "econ-development", label: "Development & inequality" },
            { value: "econ-behavioral", label: "Behavioral & experimental economics" },
            { value: "econ-data-econometrics", label: "Data, metrics & econometrics" }
          ]
        }
      },
      {
        value: "policy",
        label: "Public Policy & Government",
        followUp: {
          heading: "What policy domains matter most?",
          options: [
            { value: "pol-domestic-social", label: "Domestic social policy" },
            { value: "pol-urban-local", label: "Urban, housing & local government" },
            { value: "pol-environmental", label: "Environmental & energy policy" },
            { value: "pol-international-security", label: "International relations & security" },
            { value: "pol-human-rights", label: "Human rights & justice" },
            { value: "pol-tech-governance", label: "Technology & governance" }
          ]
        }
      },
      {
        value: "law",
        label: "Law & Ethics",
        followUp: {
          heading: "What legal or ethics angles intrigue you?",
          options: [
            { value: "law-constitutional", label: "Constitutional & civil liberties" },
            { value: "law-corporate-compliance", label: "Business law & compliance" },
            { value: "law-criminal-justice", label: "Criminal justice reform" },
            { value: "law-international-human-rights", label: "International & human rights law" },
            { value: "law-bioethics", label: "Bioethics & health law" },
            { value: "law-pre-law-litigation", label: "Pre-law & litigation interest" }
          ]
        }
      },
      {
        value: "sociology",
        label: "Sociology & Society",
        followUp: {
          heading: "Which social questions draw you in?",
          options: [
            { value: "soc-inequality-class", label: "Inequality, class & mobility" },
            { value: "soc-race-ethnicity", label: "Race, ethnicity & migration" },
            { value: "soc-gender-family", label: "Gender, family & sexuality" },
            { value: "soc-urban-community", label: "Cities, communities & networks" },
            { value: "soc-culture-identities", label: "Culture, religion & identities" },
            { value: "soc-research-methods", label: "Social research & methods" }
          ]
        }
      },
      {
        value: "entrepreneurship",
        label: "Entrepreneurship & Startups",
        followUp: {
          heading: "What kind of entrepreneurial energy do you have?",
          options: [
            { value: "ent-venture-startup", label: "Building a new venture" },
            { value: "ent-social-impact-ventures", label: "Social impact & mission-driven ventures" },
            { value: "ent-product-innovation", label: "Product innovation & design" },
            { value: "ent-fundraising-investment", label: "Fundraising & investment" },
            { value: "ent-small-business", label: "Small business & family enterprise" },
            { value: "ent-tech-commercialization", label: "Technology commercialization" }
          ]
        }
      }
    ]
  },
  {
    heading: "Arts & Humanities",
    options: [
      {
        value: "arts",
        label: "Visual Arts & Studio",
        followUp: {
          heading: "How do you want to work in visual art?",
          options: [
            { value: "art-studio-practice", label: "Studio practice & technique" },
            { value: "art-drawing-painting", label: "Drawing & painting" },
            { value: "art-sculpture-3d", label: "Sculpture & three-dimensional work" },
            { value: "art-print-photo", label: "Printmaking & photography" },
            { value: "art-new-media-digital", label: "New media & digital art" },
            { value: "art-history-critical", label: "Art history & criticism" }
          ]
        }
      },
      {
        value: "music",
        label: "Music & Performance",
        followUp: {
          heading: "What aspect of music matters most to you?",
          options: [
            { value: "music-vocal-choral", label: "Voice & choral ensemble" },
            { value: "music-instrumental-classical", label: "Instrumental performance (classical & concert)" },
            { value: "music-jazz-pop-contemporary", label: "Jazz, popular & contemporary performance" },
            { value: "music-theory-composition", label: "Theory, analysis & composition" },
            { value: "music-tech-audio-production", label: "Music technology, audio & production" },
            { value: "music-ethnomusicology-world", label: "World music, ethnomusicology & culture" },
            { value: "music-education-conducting", label: "Music education, conducting & arranging" }
          ]
        }
      },
      {
        value: "literature",
        label: "Literature & Literary Studies",
        followUp: {
          heading: "Which literary conversations do you want to join?",
          options: [
            { value: "lit-british-irish", label: "British & Irish literatures" },
            { value: "lit-american", label: "American literature" },
            { value: "lit-global-postcolonial", label: "Global, postcolonial & diaspora" },
            { value: "lit-poetry-drama", label: "Poetry & drama" },
            { value: "lit-critical-theory", label: "Literary theory & criticism" },
            { value: "lit-creative-craft", label: "Creative writing craft alongside reading" }
          ]
        }
      },
      {
        value: "history",
        label: "History",
        followUp: {
          heading: "What histories do you want to study?",
          options: [
            { value: "hist-us", label: "United States history" },
            { value: "hist-europe", label: "European history" },
            { value: "hist-global-non-western", label: "Africa, Asia, Latin America & the Middle East" },
            { value: "hist-science-tech", label: "Science, technology & environment" },
            { value: "hist-public-memory", label: "Public history, museums & archives" },
            { value: "hist-law-politics", label: "Law, empire & political history" }
          ]
        }
      },
      {
        value: "philosophy",
        label: "Philosophy",
        followUp: {
          heading: "Which philosophical areas fit you?",
          options: [
            { value: "phil-ethics-applied", label: "Ethics & applied philosophy" },
            { value: "phil-political-social", label: "Political & social philosophy" },
            { value: "phil-mind-cognition", label: "Mind, language & cognition" },
            { value: "phil-metaphysics-epistemology", label: "Metaphysics & knowledge" },
            { value: "phil-logic-formal", label: "Logic & formal reasoning" },
            { value: "phil-history-philosophy", label: "History of philosophy" }
          ]
        }
      },
      {
        value: "classics",
        label: "Classics & Antiquity",
        followUp: {
          heading: "How do you want to engage the ancient world?",
          options: [
            { value: "clas-greek-language", label: "Ancient Greek language & texts" },
            { value: "clas-latin-language", label: "Latin language & texts" },
            { value: "clas-archaeology-material", label: "Archaeology & material culture" },
            { value: "clas-reception-modern", label: "Reception in later art & literature" },
            { value: "clas-history-ideas", label: "Intellectual & political history of antiquity" },
            { value: "clas-myth-religion", label: "Myth, religion & performance" }
          ]
        }
      },
      {
        value: "architecture",
        label: "Architecture & Design",
        followUp: {
          heading: "What side of architecture draws you?",
          options: [
            { value: "arch-design-studio", label: "Design studio & spatial concepts" },
            { value: "arch-urban-landscape", label: "Urbanism, landscape & cities" },
            { value: "arch-sustainable-building", label: "Sustainable & high-performance buildings" },
            { value: "arch-history-theory", label: "Architectural history & theory" },
            { value: "arch-digital-representation", label: "Digital modeling & representation" },
            { value: "arch-community-engagement", label: "Community engaged & participatory design" }
          ]
        }
      }
    ]
  },
  {
    heading: "Languages & Global Studies",
    options: [
      {
        value: "languages",
        label: "World Languages",
        followUp: {
          heading: "What language goals feel right?",
          options: [
            { value: "lang-proficiency-literature", label: "Advanced proficiency & reading literature" },
            { value: "lang-translation-interpretation", label: "Translation & interpretation" },
            { value: "lang-teaching-pedagogy", label: "Teaching languages" },
            { value: "lang-linguistics-structure", label: "Linguistic structure & analysis" },
            { value: "lang-multilingual-identity", label: "Multilingualism & identity" },
            { value: "lang-less-commonly-taught", label: "Less commonly taught languages" }
          ]
        }
      },
      {
        value: "global",
        label: "Global & Area Studies",
        followUp: {
          heading: "Which global frames interest you?",
          options: [
            { value: "glob-east-asia", label: "East & Southeast Asia" },
            { value: "glob-europe-eurasia", label: "Europe, Russia & Eurasia" },
            { value: "glob-latin-america-caribbean", label: "Latin America & Caribbean" },
            { value: "glob-middle-east-africa", label: "Middle East & Africa" },
            { value: "glob-migration-diaspora", label: "Migration, diaspora & transnational life" },
            { value: "glob-governance-development", label: "Governance, institutions & development" }
          ]
        }
      },
      {
        value: "culture",
        label: "Cultural Studies",
        followUp: {
          heading: "How do you want to study culture?",
          options: [
            { value: "cult-media-film-tv", label: "Media, film & television" },
            { value: "cult-popular-digital", label: "Popular & digital cultures" },
            { value: "cult-gender-sexuality", label: "Gender, sexuality & feminist analysis" },
            { value: "cult-race-ethnicity-power", label: "Race, ethnicity & power" },
            { value: "cult-religion-secularism", label: "Religion & secularism" },
            { value: "cult-comparative-heritage", label: "Comparative & heritage studies" }
          ]
        }
      },
      {
        value: "anthropology",
        label: "Anthropology & Archaeology",
        followUp: {
          heading: "What anthropological path fits?",
          options: [
            { value: "anth-socio-cultural", label: "Sociocultural anthropology & ethnography" },
            { value: "anth-archaeology-field", label: "Archaeology & field methods" },
            { value: "anth-linguistic-anthro", label: "Linguistic anthropology" },
            { value: "anth-medical-biological", label: "Medical & biological anthropology" },
            { value: "anth-environment-food", label: "Environment, food systems & livelihoods" },
            { value: "anth-museum-public", label: "Museums & public anthropology" }
          ]
        }
      }
    ]
  },
  {
    heading: "STEM Beyond Engineering",
    options: [
      {
        value: "biology",
        label: "Biology & Life Sciences",
        followUp: {
          heading: "What biology focus appeals to you?",
          options: [
            { value: "bio-molecular-cell", label: "Molecular & cell biology" },
            { value: "bio-genetics-genomics", label: "Genetics & genomics" },
            { value: "bio-ecology-evolution", label: "Ecology & evolution" },
            { value: "bio-microbes", label: "Microbiology & immunology" },
            { value: "bio-neuro-behavior", label: "Neurobiology & behavior" },
            { value: "bio-biotech-applied", label: "Biotechnology & applied life sciences" }
          ]
        }
      },
      {
        value: "chemistry",
        label: "Chemistry",
        followUp: {
          heading: "Which chemistry direction?",
          options: [
            { value: "chem-organic-synthesis", label: "Organic & synthetic chemistry" },
            { value: "chem-physical-theory", label: "Physical & theoretical chemistry" },
            { value: "chem-analytical", label: "Analytical & instrumentation" },
            { value: "chem-biochemical", label: "Biochemistry & chemical biology" },
            { value: "chem-materials-energy", label: "Materials, energy & sustainability" },
            { value: "chem-computational", label: "Computational chemistry" }
          ]
        }
      },
      {
        value: "physics",
        label: "Physics & Astronomy",
        followUp: {
          heading: "Where in physics or astronomy?",
          options: [
            { value: "phys-theoretical", label: "Theoretical & mathematical physics" },
            { value: "phys-experimental", label: "Experimental physics & lab work" },
            { value: "phys-condensed-matter", label: "Condensed matter & materials" },
            { value: "phys-astro-cosmology", label: "Astronomy & cosmology" },
            { value: "phys-biophysics", label: "Biophysics & medical physics" },
            { value: "phys-computational-modeling", label: "Computational modeling & simulation" }
          ]
        }
      },
      {
        value: "environment",
        label: "Environment & Sustainability",
        followUp: {
          heading: "What environmental angle matters most?",
          options: [
            { value: "env-climate-atmosphere", label: "Climate & atmospheric science" },
            { value: "env-ecology-conservation", label: "Ecology & conservation" },
            { value: "env-water-oceans", label: "Hydrology, oceans & freshwater" },
            { value: "env-soil-agriculture", label: "Soil, agriculture & food systems" },
            { value: "env-policy-governance", label: "Environmental policy & governance" },
            { value: "env-human-health-exposure", label: "Environmental health & exposure science" }
          ]
        }
      },
      {
        value: "statistics",
        label: "Statistics & Data Literacy",
        followUp: {
          heading: "How do you want to use statistics?",
          options: [
            { value: "stat-inference-modeling", label: "Inference & statistical modeling" },
            { value: "stat-computing-ml", label: "Statistical computing & machine learning" },
            { value: "stat-biostats-health", label: "Biostatistics & health data" },
            { value: "stat-experiments-causal", label: "Experiments & causal reasoning" },
            { value: "stat-survey-social", label: "Survey methods & social data" },
            { value: "stat-visualization-communication", label: "Visualization & communication" }
          ]
        }
      },
      {
        value: "neuroscience",
        label: "Neuroscience & Cognition",
        followUp: {
          heading: "Which neuroscience direction?",
          options: [
            { value: "neuro-molecular-cell", label: "Molecular & cellular neuroscience" },
            { value: "neuro-systems-circuits", label: "Systems & circuits" },
            { value: "neuro-cognitive-psych", label: "Cognitive neuroscience & behavior" },
            { value: "neuro-computational", label: "Computational & theoretical neuroscience" },
            { value: "neuro-clinical-disorders", label: "Clinical & translational neuroscience" },
            { value: "neuro-philosophy-mind", label: "Philosophy of mind & consciousness" }
          ]
        }
      }
    ]
  },
  {
    heading: "People, Health & Education",
    options: [
      {
        value: "psychology",
        label: "Psychology",
        followUp: {
          heading: "What psychology focus fits you?",
          options: [
            { value: "psych-clinical-mental-health", label: "Clinical & mental health" },
            { value: "psych-cognitive", label: "Cognitive psychology & memory" },
            { value: "psych-developmental", label: "Developmental & lifespan" },
            { value: "psych-social-personality", label: "Social & personality" },
            { value: "psych-biopsychology", label: "Biopsychology & neuroscience links" },
            { value: "psych-research-applied", label: "Research methods & applied psychology" }
          ]
        }
      },
      {
        value: "health",
        label: "Public Health & Pre-Health",
        followUp: {
          heading: "What health pathway interests you?",
          options: [
            { value: "health-epidemiology", label: "Epidemiology & population health" },
            { value: "health-policy-systems", label: "Health policy & systems" },
            { value: "health-global-equity", label: "Global health & equity" },
            { value: "health-environmental-occupational", label: "Environmental & occupational health" },
            { value: "health-pre-clinical-path", label: "Pre-clinical & clinical preparation" },
            { value: "health-community-programs", label: "Community programs & health promotion" }
          ]
        }
      },
      {
        value: "education",
        label: "Education & Teaching",
        followUp: {
          heading: "What education context?",
          options: [
            { value: "edu-k12-teaching", label: "K–12 teaching & curriculum" },
            { value: "edu-stem-education", label: "STEM education & outreach" },
            { value: "edu-special-inclusive", label: "Special & inclusive education" },
            { value: "edu-higher-student-affairs", label: "Higher education & student affairs" },
            { value: "edu-policy-leadership", label: "Policy, leadership & reform" },
            { value: "edu-learning-sciences", label: "Learning sciences & assessment" }
          ]
        }
      },
      {
        value: "kinesiology",
        label: "Kinesiology & Movement",
        followUp: {
          heading: "Which movement-science angle?",
          options: [
            { value: "kine-exercise-physiology", label: "Exercise physiology & training" },
            { value: "kine-biomechanics", label: "Biomechanics & motor control" },
            { value: "kine-sports-medicine", label: "Sports medicine & injury" },
            { value: "kine-sport-psychology", label: "Sport & performance psychology" },
            { value: "kine-public-health-activity", label: "Physical activity & public health" },
            { value: "kine-rehab-disability", label: "Rehabilitation & disability studies" }
          ]
        }
      }
    ]
  }
];

const labelByValue = new Map<string, string>();
for (const sec of OUTSIDE_INTEREST_SECTIONS) {
  for (const o of sec.options) {
    labelByValue.set(o.value.toLowerCase(), o.label);
    if (o.followUp) {
      for (const d of o.followUp.options) {
        labelByValue.set(d.value.toLowerCase(), d.label);
      }
    }
  }
}

export type OutsideInterestFollowUpBlock = {
  parentHeading: string;
  heading: string;
  options: OutsideInterestDetailOption[];
};

/** One collapsible follow-up per selected broad option that defines a followUp. */
export function followUpBlocksForSelections(outsideInterests: string[]): OutsideInterestFollowUpBlock[] {
  const sel = new Set(outsideInterests.map((x) => x.toLowerCase().trim()).filter(Boolean));
  return OUTSIDE_INTEREST_SECTIONS.flatMap((sec) =>
    sec.options.flatMap((opt) => {
      if (!opt.followUp || !sel.has(opt.value.toLowerCase())) return [];
      return [
        {
          parentHeading: `${sec.heading} · ${opt.label}`,
          heading: opt.followUp.heading,
          options: opt.followUp.options
        }
      ];
    })
  );
}

/** Remove detail tokens that no longer belong to a selected broad option's follow-up. */
export function pruneOutsideInterestDetails(broad: string[], details: string[]): string[] {
  const broadLower = new Set(broad.map((b) => b.toLowerCase()));
  const allowed = new Set<string>();
  for (const sec of OUTSIDE_INTEREST_SECTIONS) {
    for (const opt of sec.options) {
      if (!opt.followUp || !broadLower.has(opt.value.toLowerCase())) continue;
      for (const d of opt.followUp.options) {
        allowed.add(d.value.toLowerCase());
      }
    }
  }
  return details.filter((d) => allowed.has(d.toLowerCase()));
}

/** Human-readable chip label; falls back to stored string (legacy free-text saves). */
export function outsideInterestLabel(stored: string): string {
  const key = stored.trim().toLowerCase();
  return labelByValue.get(key) ?? stored;
}
