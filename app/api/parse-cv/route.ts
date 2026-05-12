import type { CV } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return Response.json({ error: "No text provided" }, { status: 400 });
    }

    const cv: CV = parseCV(text);
    return Response.json(cv);
  } catch (error) {
    console.error("Error parsing CV:", error);
    return Response.json(
      { error: `Failed to parse CV: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

function parseCV(text: string): CV {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l);
  const textLower = text.toLowerCase();

  return {
    fullName: extractName(text),
    email: extractEmail(text),
    phone: extractPhone(text),
    location: extractLocation(text),
    summary: extractSummary(text),
    experience: extractExperience(text),
    education: extractEducation(text),
    projects: extractProjects(text),
    skillCategories: extractSkills(text),
    skills: [],
    languages: extractLanguages(text),
    links: [],
  };
}

function extractName(text: string): string {
  const nameMatch = text.match(/(?:name|my name)[:\s]+([A-Za-z\s]+?)(?:[\.|,]|email|phone|$)/i);
  return nameMatch ? nameMatch[1].trim() : "";
}

function extractEmail(text: string): string {
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : "";
}

function extractPhone(text: string): string {
  const phoneMatch = text.match(/\+?[\d\s\-\(\)]{10,}/);
  return phoneMatch ? phoneMatch[0].trim() : "";
}

function extractLocation(text: string): string {
  const locMatch = text.match(/(?:location|based in)[:\s]+([^,.\n]+(?:,[^,.\n]+)?)/i);
  return locMatch ? locMatch[1].trim() : "";
}

function extractSummary(text: string): string {
  const lines = text.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (
      (line.includes("engineer") ||
        line.includes("developer") ||
        line.includes("designer") ||
        line.includes("years of experience")) &&
      !line.includes("@")
    ) {
      return lines[i].trim();
    }
  }
  return "";
}

function extractExperience(text: string): Array<any> {
  const exp: any[] = [];
  const expKeywords = /(worked as|engineer|developer|manager|director|specialist|lead|senior)\s+(.+?)(?:at|company|for)\s+(.+?)\s+(?:from|between)?\s*(\w+\s+\d{4})\s*(?:to|-|–)\s*(\w+\s+\d{4}|present)/gi;

  let match;
  while ((match = expKeywords.exec(text)) !== null) {
    exp.push({
      title: match[2].trim(),
      company: match[3].trim(),
      startDate: match[4].trim(),
      endDate: match[5].trim(),
      bullets: extractBullets(text, match[2]),
    });
  }
  return exp;
}

function extractEducation(text: string): Array<any> {
  const edu: any[] = [];
  const eduRegex = /(?:degree|studied|graduated|bachelor|master|diploma)\s+(?:in\s+)?(.+?)(?:from|at)\s+(.+?)\s+(\d{4})\s*(?:to|-|–)\s*(\d{4})(?:\s*,?\s*(?:gpa|gp\.a\.?|gpa:)\s*([\d.]+))?/gi;

  let match;
  while ((match = eduRegex.exec(text)) !== null) {
    edu.push({
      degree: match[1].trim(),
      institution: match[2].trim(),
      startYear: match[3],
      endYear: match[4],
      gpa: match[5] ? match[5].trim() : undefined,
    });
  }
  return edu;
}

function extractProjects(text: string): Array<any> {
  const projects: any[] = [];
  const projRegex = /(?:project|built|developed)\s*[:–-]?\s*(.+?)(?:description|desc\.?|:)?\s+(.+?)(?:tech|technologies|stack|tools)[:–-]?\s*(.+?)(?:$|[\n•])/gi;

  let match;
  while ((match = projRegex.exec(text)) !== null) {
    projects.push({
      name: match[1].trim(),
      description: match[2].trim(),
      tech: match[3].split(/[,;]/).map(t => t.trim()),
      bullets: [],
      link: "",
    });
  }
  return projects;
}

function extractSkills(text: string): Array<any> {
  const skills: any[] = [];
  const skillRegex = /(?:skills?|expertise|proficient in|know|know:|technologies?)\s*[:–-]?\s*(.+?)(?:\n|$)/gi;

  let match;
  while ((match = skillRegex.exec(text)) !== null) {
    const skillItems = match[1]
      .split(/[,;]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (skillItems.length > 0) {
      skills.push({
        category: "Skills",
        items: skillItems,
      });
    }
  }
  return skills;
}

function extractLanguages(text: string): Array<any> {
  const langs: any[] = [];
  const langRegex = /(?:languages?|speaks?|fluent in)\s*[:–-]?\s*(.+?)(?:\n|$)/gi;

  let match;
  while ((match = langRegex.exec(text)) !== null) {
    const langItems = match[1].split(/[,;]/);
    for (const item of langItems) {
      const parts = item.split(/[\(\)]/);
      const name = parts[0].trim();
      const level = parts[1]?.trim() || "Fluent";
      if (name) {
        langs.push({ name, level });
      }
    }
  }
  return langs;
}

function extractBullets(text: string, context: string): string[] {
  const bullets: string[] = [];
  // Simple heuristic: look for sentences after the job title
  const contextIdx = text.toLowerCase().indexOf(context.toLowerCase());
  if (contextIdx > 0) {
    const section = text.substring(contextIdx, contextIdx + 500);
    const sentences = section.match(/[.!?]+\s+[A-Z][^.!?]*[.!?]+/g) || [];
    bullets.push(...sentences.slice(0, 3).map(s => s.trim()));
  }
  return bullets;
}

