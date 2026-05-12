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

    const prompt = `You are a CV parser. Extract and structure this person's CV information into JSON format.

IMPORTANT: Return ONLY the JSON object, nothing else. No markdown, no code blocks, no explanation.

Return this exact structure:
{
  "fullName": "extracted name or empty string",
  "email": "extracted email or empty string",
  "phone": "extracted phone or empty string",
  "location": "extracted location or empty string",
  "summary": "professional summary if mentioned, otherwise empty string",
  "experience": [{"title": "job title", "company": "company name", "startDate": "month year", "endDate": "month year or Present", "bullets": ["achievement 1", "achievement 2"]}],
  "education": [{"degree": "degree name", "institution": "university name", "startYear": "year", "endYear": "year", "gpa": null}],
  "projects": [{"name": "project name", "description": "short description", "tech": ["tech1", "tech2"], "bullets": ["achievement"], "link": ""}],
  "skillCategories": [{"category": "category name", "items": ["skill1", "skill2"]}],
  "skills": [],
  "languages": [{"name": "language", "level": "Native"}],
  "links": []
}

Person's information:
${text}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Try to extract JSON - it might be wrapped in markdown code blocks
    let jsonStr = responseText;
    const jsonMatch = responseText.match(/```(?:json)?\n?([\s\S]*?)\n?```/) || responseText.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      jsonStr = jsonMatch[1] || jsonMatch[0];
    }

    const cv: CV = JSON.parse(jsonStr);

    // Ensure all required fields exist
    const validCV: CV = {
      fullName: cv.fullName || "",
      email: cv.email || "",
      phone: cv.phone || "",
      location: cv.location || "",
      summary: cv.summary || "",
      experience: Array.isArray(cv.experience) ? cv.experience : [],
      education: Array.isArray(cv.education) ? cv.education : [],
      projects: Array.isArray(cv.projects) ? cv.projects : [],
      skillCategories: Array.isArray(cv.skillCategories) ? cv.skillCategories : [],
      skills: Array.isArray(cv.skills) ? cv.skills : [],
      languages: Array.isArray(cv.languages) ? cv.languages : [],
      links: Array.isArray(cv.links) ? cv.links : [],
    };

    return Response.json(validCV);
  } catch (error) {
    console.error("Error parsing CV:", error);
    return Response.json(
      { error: `Failed to parse CV: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
