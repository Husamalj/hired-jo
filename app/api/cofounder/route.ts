import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { embed, cosine } from "@/lib/embeddings";

type PrismaCofounder = {
  id: string;
  alias: string;
  email: string;
  skills: string;
  interests: string;
  vibe: string;
  embedding: string | null;
  createdAt: Date;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "register") {
      const text = `${(body.skills as string[]).join(" ")} ${(body.interests as string[]).join(" ")} ${body.vibe}`;
      const emb = await embed(text);
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
      const meText = `${(body.skills as string[]).join(" ")} ${(body.interests as string[]).join(" ")}`;
      const meEmb = await embed(meText);
      const all = (await prisma.cofounderProfile.findMany()) as PrismaCofounder[];
      const ranked = all
        .map((p) => {
          const pSkills: string[] = JSON.parse(p.skills);
          const pInterests: string[] = JSON.parse(p.interests);
          const complementary = pSkills.filter(
            (s) => !(body.skills as string[]).includes(s)
          ).length;
          const shared = pInterests.filter(
            (i) => (body.interests as string[]).includes(i)
          ).length;
          const sim = p.embedding ? cosine(meEmb, JSON.parse(p.embedding)) : 0;
          return { ...p, matchScore: complementary * 0.4 + shared * 0.3 + sim * 0.3 };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        .map(({ embedding: _omit, ...rest }) => rest)
      return NextResponse.json({ matches: ranked });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
