"use client";
import { useState } from "react";
import type { CV } from "@/lib/types";

export function CvBulkForm({ onSubmit }: { onSubmit: (cv: CV) => void }) {
  const [formData, setFormData] = useState<CV>({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    summary: "",
    experience: [],
    education: [],
    projects: [],
    skills: [],
    skillCategories: [],
    languages: [],
    links: [],
  });

  const [expInput, setExpInput] = useState("");
  const [eduInput, setEduInput] = useState("");
  const [projInput, setProjInput] = useState("");

  const handleBasicChange = (field: keyof CV, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addExperience = () => {
    if (expInput.trim()) {
      const [title, company, dates, ...bullets] = expInput.split("|").map(s => s.trim());
      const [startDate, endDate] = dates.split("-").map(s => s.trim());
      setFormData(prev => ({
        ...prev,
        experience: [...prev.experience, { title, company, startDate, endDate, bullets }],
      }));
      setExpInput("");
    }
  };

  const addEducation = () => {
    if (eduInput.trim()) {
      const [degree, institution, years, gpa] = eduInput.split("|").map(s => s.trim());
      const [startYear, endYear] = years.split("-").map(s => s.trim());
      setFormData(prev => ({
        ...prev,
        education: [...prev.education, { degree, institution, startYear, endYear, gpa: gpa || undefined }],
      }));
      setEduInput("");
    }
  };

  const addProject = () => {
    if (projInput.trim()) {
      const [name, description, tech, ...bullets] = projInput.split("|").map(s => s.trim());
      setFormData(prev => ({
        ...prev,
        projects: [...prev.projects, { name, description, tech: tech.split(",").map(t => t.trim()), bullets, link: "" }],
      }));
      setProjInput("");
    }
  };

  const addSkillCategory = (category: string, items: string) => {
    if (category && items) {
      setFormData(prev => ({
        ...prev,
        skillCategories: [...prev.skillCategories, { category, items: items.split(",").map(i => i.trim()) }],
      }));
    }
  };

  const addLanguage = (name: string, level: string) => {
    if (name && level) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, { name, level }],
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("hired_cv", JSON.stringify(formData));
    onSubmit(formData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-3xl font-bold mb-8">Fill Your CV in One Go</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={(e) => handleBasicChange("fullName", e.target.value)}
              className="col-span-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleBasicChange("email", e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50"
            />
            <input
              type="text"
              placeholder="Phone"
              value={formData.phone}
              onChange={(e) => handleBasicChange("phone", e.target.value)}
              className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50"
            />
            <input
              type="text"
              placeholder="Location (city, country)"
              value={formData.location}
              onChange={(e) => handleBasicChange("location", e.target.value)}
              className="col-span-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50"
            />
            <textarea
              placeholder="Professional Summary (e.g., Full Stack Developer with 3 years experience)"
              value={formData.summary}
              onChange={(e) => handleBasicChange("summary", e.target.value)}
              className="col-span-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-20"
            />
          </div>
        </div>

        {/* Experience */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Experience</h3>
          <div className="mb-4">
            <textarea
              placeholder="Format: Job Title | Company | Jan 2023 - Dec 2023 | Bullet point 1 | Bullet point 2 | Bullet point 3"
              value={expInput}
              onChange={(e) => setExpInput(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-24"
            />
            <button type="button" onClick={addExperience} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              + Add Experience
            </button>
          </div>
          {formData.experience.map((exp, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg mb-2">
              <p className="font-bold text-sm">{exp.title} at {exp.company}</p>
              <p className="text-xs text-white/60">{exp.startDate} - {exp.endDate}</p>
            </div>
          ))}
        </div>

        {/* Education */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Education</h3>
          <div className="mb-4">
            <textarea
              placeholder="Format: Degree | Institution | 2020 - 2024 | (optional GPA)"
              value={eduInput}
              onChange={(e) => setEduInput(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-16"
            />
            <button type="button" onClick={addEducation} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              + Add Education
            </button>
          </div>
          {formData.education.map((edu, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg mb-2">
              <p className="font-bold text-sm">{edu.degree}</p>
              <p className="text-xs text-white/60">{edu.institution} ({edu.startYear} - {edu.endYear})</p>
            </div>
          ))}
        </div>

        {/* Projects */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Projects</h3>
          <div className="mb-4">
            <textarea
              placeholder="Format: Project Name | Description | React, Node.js, MongoDB | Bullet 1 | Bullet 2"
              value={projInput}
              onChange={(e) => setProjInput(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 min-h-24"
            />
            <button type="button" onClick={addProject} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
              + Add Project
            </button>
          </div>
          {formData.projects.map((proj, i) => (
            <div key={i} className="p-3 bg-white/5 rounded-lg mb-2">
              <p className="font-bold text-sm">{proj.name}</p>
              <p className="text-xs text-white/60">{proj.tech.join(", ")}</p>
            </div>
          ))}
        </div>

        {/* Skills */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Skills</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input type="text" placeholder="Category (e.g., Languages)" id="skillCat" className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50" />
            <input type="text" placeholder="Items (comma-separated)" id="skillItems" className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50" />
          </div>
          <button
            type="button"
            onClick={() => {
              const cat = (document.getElementById("skillCat") as HTMLInputElement).value;
              const items = (document.getElementById("skillItems") as HTMLInputElement).value;
              addSkillCategory(cat, items);
              (document.getElementById("skillCat") as HTMLInputElement).value = "";
              (document.getElementById("skillItems") as HTMLInputElement).value = "";
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            + Add Skill Category
          </button>
          <div className="mt-4 space-y-2">
            {formData.skillCategories.map((cat, i) => (
              <div key={i} className="p-2 bg-white/5 rounded text-sm">
                <p className="font-bold">{cat.category}:</p>
                <p className="text-white/60">{cat.items.join(", ")}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Languages */}
        <div className="glass rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">Languages</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <input type="text" placeholder="Language" id="langName" className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50" />
            <select id="langLevel" className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white">
              <option value="">Select Level</option>
              <option value="Native">Native</option>
              <option value="Fluent">Fluent</option>
              <option value="Advanced">Advanced</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Beginner">Beginner</option>
            </select>
          </div>
          <button
            type="button"
            onClick={() => {
              const name = (document.getElementById("langName") as HTMLInputElement).value;
              const level = (document.getElementById("langLevel") as HTMLSelectElement).value;
              addLanguage(name, level);
              (document.getElementById("langName") as HTMLInputElement).value = "";
              (document.getElementById("langLevel") as HTMLSelectElement).value = "";
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            + Add Language
          </button>
          <div className="mt-4 space-y-2">
            {formData.languages.map((lang, i) => (
              <div key={i} className="p-2 bg-white/5 rounded text-sm">
                {lang.name} ({lang.level})
              </div>
            ))}
          </div>
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
