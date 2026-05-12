import { GoogleGenerativeAI } from "@google/generative-ai";
import type { CV } from "@/lib/types";

const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text || !text.trim()) {
      return Response.json({ error: "No text provided" }, { status: 400 });
    }

    const model = gemini.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Extract and structure this person's CV information from the raw text below. Return ONLY a valid JSON object matching this structure (no markdown, no explanation):

{
  "fullName": "string (extract from text)",
  "email": "string or empty",
  "phone": "string or empty",
  "location": "string or empty",
  "summary": "string - professional summary/title or empty",
  "experience": [
    {
      "title": "string",
      "company": "string",
      "startDate": "string (e.g., 'Jan 2022')",
      "endDate": "string (e.g., 'Present')",
      "bullets": ["string", "string"]
    }
  ],
  "education": [
    {
      "degree": "string",
      "institution": "string",
      "startYear": "string (e.g., '2020')",
      "endYear": "string (e.g., '2024')",
      "gpa": "string or null"
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "tech": ["string", "string"],
      "bullets": ["string"],
      "link": "string or empty"
    }
  ],
  "skillCategories": [
    {
      "category": "string",
      "items": ["string", "string"]
    }
  ],
  "skills": [],
  "languages": [
    {
      "name": "string",
      "level": "string (Native, Fluent, Advanced, Intermediate, Beginner)"
    }
  ],
  "links": []
}

Text to parse:
${text}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Could not extract JSON from response");
    }

    const cv: CV = JSON.parse(jsonMatch[0]);

    return Response.json(cv);
  } catch (error) {
    console.error("Error parsing CV:", error);
    return Response.json(
      { error: "Failed to parse CV" },
      { status: 500 }
    );
  }
}
