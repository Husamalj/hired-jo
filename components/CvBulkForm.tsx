"use client";
import { useState } from "react";
import type { CV } from "@/lib/types";

export function CvBulkForm({ onSubmit }: { onSubmit: (cv: CV) => void }) {
  const [basicInfo, setBasicInfo] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
  });

  const [experienceText, setExperienceText] = useState("");
  const [educationText, setEducationText] = useState("");
  const [projectsText, setProjectsText] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [languagesText, setLanguagesText] = useState("");

  const parseExperience = (text: string) => {
    if (!text.trim()) return [];
    return text.split("\n").filter(line => line.trim()).map(line => {
      const [title, company, dates, ...bullets] = line.split("|").map(s => s.trim());
      const [startDate, endDate] = dates.split("-").map(s => s.trim());
      return { title, company, startDate, endDate, bullets };
    });
  };

  const parseEducation = (text: string) => {
    if (!text.trim()) return [];
    return text.split("\n").filter(line => line.trim()).map(line => {
      const [degree, institution, years, gpa] = line.split("|").map(s => s.trim());
      const [startYear, endYear] = years.split("-").map(s => s.trim());
      return { degree, institution, startYear, endYear, gpa: gpa || undefined };
    });
  };

  const parseProjects = (text: string) => {
    if (!text.trim()) return [];
    return text.split("\n").filter(line => line.trim()).map(line => {
      const [name, description, tech, ...bullets] = line.split("|").map(s => s.trim());
      return { name, description, tech: tech.split(",").map(t => t.trim()), bullets, link: "" };
    });
  };

  const parseSkills = (text: string) => {
    if (!text.trim()) return [];
    return text.split("\n").filter(line => line.trim()).map(line => {
      const [category, items] = line.split("|").map(s => s.trim());
      return { category, items: items.split(",").map(i => i.trim()) };
    });
  };

  const parseLanguages = (text: string) => {
    if (!text.trim()) return [];
    return text.split("\n").filter(line => line.trim()).map(line => {
      const [name, level] = line.split("|").map(s => s.trim());
      return { name, level };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cv: CV = {
      fullName: basicInfo.fullName,
      email: basicInfo.email,
      phone: basicInfo.phone,
      location: basicInfo.location,
      summary: basicInfo.summary,
      experience: parseExperience(experienceText),
      education: parseEducation(educationText),
      projects: parseProjects(projectsText),
      skillCategories: parseSkills(skillsText),
      skills: [],
      languages: parseLanguages(languagesText),
      links: [],
    };
    localStorage.setItem("hired_cv", JSON.stringify(cv));
    onSubmit(cv);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-2">📝 Paste Your Information</h2>
      <p className="text-white/60 mb-8">Just fill in your details below. Use the format guides and paste multiple items separated by new lines.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={basicInfo.fullName}
              onChange={(e) => setBasicInfo({ ...basicInfo, fullName: e.target.value })}
              className="col-span-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50"
            />
            <input
              type="email"
              placeholder="Email"
              value={basicInfo.email}
              onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50"
            />
            <input
              type="text"
              placeholder="Phone"
              value={basicInfo.phone}
              onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50"
            />
            <input
              type="text"
              placeholder="Location"
              value={basicInfo.location}
              onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value })}
              className="col-span-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50"
            />
            <textarea
              placeholder="Professional Summary"
              value={basicInfo.summary}
              onChange={(e) => setBasicInfo({ ...basicInfo, summary: e.target.value })}
              className="col-span-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-16"
            />
          </div>
        </div>

        {/* Experience */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-bold mb-2">Experience</h3>
          <p className="text-sm text-white/50 mb-3">Format: Job Title | Company | Month Year - Month Year | Bullet 1 | Bullet 2</p>
          <textarea
            placeholder="Senior Developer | TechCorp | Jan 2022 - Present | Led team of 5 developers | Increased performance by 40%"
            value={experienceText}
            onChange={(e) => setExperienceText(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-24"
          />
        </div>

        {/* Education */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-bold mb-2">Education</h3>
          <p className="text-sm text-white/50 mb-3">Format: Degree | University | 2020 - 2024 | GPA (optional)</p>
          <textarea
            placeholder="Bachelor of Computer Science | State University | 2018 - 2022 | 3.8"
            value={educationText}
            onChange={(e) => setEducationText(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-20"
          />
        </div>

        {/* Projects */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-bold mb-2">Projects</h3>
          <p className="text-sm text-white/50 mb-3">Format: Project Name | Description | React, Node.js, MongoDB | Achievement 1 | Achievement 2</p>
          <textarea
            placeholder="E-commerce Platform | Full-stack store | React, PostgreSQL, Stripe | 50K+ users | 4.8 star rating"
            value={projectsText}
            onChange={(e) => setProjectsText(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-24"
          />
        </div>

        {/* Skills */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-bold mb-2">Skills</h3>
          <p className="text-sm text-white/50 mb-3">Format: Category | Skill 1, Skill 2, Skill 3</p>
          <textarea
            placeholder="Languages | Python, JavaScript, TypeScript&#10;Tools | Docker, Kubernetes, AWS"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-20"
          />
        </div>

        {/* Languages */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-lg font-bold mb-2">Languages</h3>
          <p className="text-sm text-white/50 mb-3">Format: Language | Level (Native, Fluent, Advanced, Intermediate, Beginner)</p>
          <textarea
            placeholder="English | Fluent&#10;Arabic | Native&#10;French | Intermediate"
            value={languagesText}
            onChange={(e) => setLanguagesText(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-20"
          />
        </div>

        <button
          type="submit"
          className="w-full gold-grad text-black font-bold py-3 rounded-xl text-lg hover:opacity-90"
        >
          Generate CV
        </button>
      </form>
    </div>
  );
}
