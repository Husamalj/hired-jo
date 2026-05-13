import { NextResponse } from "next/server";
import { parseCvFromText } from "@/lib/gemini";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    let text = "";

    if (file.name.toLowerCase().endsWith(".pdf")) {
      const { extractText } = await import("unpdf");
      const { text: pages } = await extractText(new Uint8Array(buffer), { mergePages: true });
      text = pages as unknown as string;
    } else if (file.name.toLowerCase().endsWith(".docx")) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else {
      return NextResponse.json({ error: "Upload a PDF or DOCX file." }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not read text from your file." }, { status: 422 });
    }

    const cv = await parseCvFromText(text);
    return NextResponse.json({ cv });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

