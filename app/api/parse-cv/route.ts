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
      // pdfjs-dist requires DOMMatrix which doesn't exist in Node
      if (typeof (globalThis as Record<string, unknown>).DOMMatrix === "undefined") {
        (globalThis as Record<string, unknown>).DOMMatrix = class {
          constructor() {}
          static fromMatrix() { return new (globalThis as Record<string, unknown>).DOMMatrix as object; }
        };
      }
      const pdfParse = (await import("pdf-parse")).default;
      const result = await pdfParse(buffer);
      text = result.text;
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

