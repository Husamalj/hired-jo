import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Stub embed/cosine until Track C delivers lib/embeddings.ts
// When ready: import { embed, cosine } from "@/lib/embeddings";
function stubEmbed(_text: string): number[] {
  return Array(10).fill(0);
}
function stubCosine(_a: number[], _b: number[]): number {
  return Math.random(); // random until real embeddings arrive
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "register") {
      const text = `${(body.skills as string[]).join(" ")} ${(body.interests as string[]).join(" ")} ${body.vibe}`;
      const emb = stubEmbed(text);
      await prisma.cofounderProfile.create({
        data: {
          alias: body.alias,
          email: body.email,
          skills: JSON.stringify(body.skills),
          interests: JSON.stringify(body.interests),
          vibe: body.vibe,
          embedding: JSON.stringify(emb),
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "match") {
      const meEmb = stubEmbed(`${(body.skills as string[]).join(" ")} ${(body.interests as string[]).join(" ")}`);
      const all = await prisma.cofounderProfile.findMany();
      const ranked = all
        .map((p) => {
          const pSkills: string[] = JSON.parse(p.skills);
          const complementary = pSkills.filter((s) => !(body.skills as string[]).includes(s)).length;
          const sim = p.embedding ? stubCosine(meEmb, JSON.parse(p.embedding)) : 0;
          return { ...p, matchScore: complementary * 0.5 + sim * 0.5 };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)
        .map(({ embedding, ...rest }) => rest); // strip embedding from response
      return NextResponse.json({ matches: ranked });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
