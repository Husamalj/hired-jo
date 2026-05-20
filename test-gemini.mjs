import { GoogleGenerativeAI } from "@google/generative-ai";

const key = process.argv[2];
if (!key) { console.error("Usage: node test-gemini.mjs YOUR_API_KEY"); process.exit(1); }

const genAI = new GoogleGenerativeAI(key);
const models = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash", "gemini-2.0-flash-lite"];

for (const name of models) {
  try {
    const m = genAI.getGenerativeModel({ model: name });
    const r = await m.generateContent("Say hi");
    console.log(`✅ ${name}: ${r.response.text().slice(0, 40)}`);
  } catch (e) {
    console.log(`❌ ${name}: ${e.message.slice(0, 80)}`);
  }
}
