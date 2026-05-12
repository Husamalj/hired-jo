export type CV = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  links?: { label: string; url: string }[];
  summary: string;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: string[];
  skillCategories?: { category: string; items: string[] }[];
  achievements?: string[];
  languages: { name: string; level: "Native" | "Fluent" | "Intermediate" | "Basic" }[];
  certifications: string[];
};

export type Education = {
  degree: string;
  institution: string;
  startYear: number;
  endYear: number | "Present";
  gpa?: string;
};

export type Experience = {
  title: string;
  company: string;
  startDate: string;
  endDate: string | "Present";
  bullets: string[];
};

export type Project = {
  name: string;
  description: string;
  tech: string[];
  link?: string;
  bullets: string[];
};

export type Job = {
  id: string;
  title: string;
  company: string;
  country: string;
  city: string;
  sector: string;
  seniority: "Intern" | "Junior" | "Mid" | "Senior";
  skills: string[];
  salaryMin?: number;
  salaryMax?: number;
  description: string;
  postedAt: string;
  source: "Akhtaboot" | "Bayt" | "Wuzzuf" | "Fursa" | "LinkedIn" | "Indeed" | "Glassdoor" | "Naukrigulf" | "GulfTalent" | "Tanqeeb";
  url?: string;
  remote?: boolean;
  internshipCountry?: string;
};

export type MatchResult = {
  jobId: string;
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  rewrittenSummary: string;
  learningPlan: LearningStep[];
};

export type LearningStep = {
  skill: string;
  weeks: number;
  resources: { title: string; url: string; provider: string }[];
};

export type HiredScore = {
  total: number;
  breakdown: {
    cvStrength: number;
    skillDemand: number;
    marketFit: number;
    completeness: number;
  };
  tips: string[];
};

export type LearningResource = {
  id: string;
  skill: string;
  title: string;
  provider: string;
  url: string;
  hours: number;
  free: boolean;
  language: "EN" | "AR" | "Both";
};

export type CofounderProfile = {
  id: string;
  alias: string;
  email: string;
  skills: string[];
  interests: string[];
  vibe: string;
  embedding?: number[];
};

export type LeaderboardEntry = {
  alias: string;
  score: number;
  topSkill: string;
  createdAt: string;
};
