import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { embed, cosine } from "@/lib/embeddings";

type CofounderRow = {
  id: string;
  alias: string;
  email: string;
  skills: string;
  interests: string;
  vibe: string;
  embedding: string | null;
  created_at: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "register") {
      const text = `${(body.skills as string[]).join(" ")} ${(body.interests as string[]).join(" ")} ${body.vibe}`;
      const emb = await embed(text);

      const { error } = await getSupabase().from("cofounder_profiles").insert({
        alias: body.alias,
        email: body.email,
        skills: JSON.stringify(body.skills),
        interests: JSON.stringify(body.interests),
        vibe: body.vibe,
        embedding: JSON.stringify(emb),
      });

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "match") {
      const meText = `${(body.skills as string[]).join(" ")} ${(body.interests as string[]).join(" ")}`;
      const meEmb = await embed(meText);

      const { data, error } = await supabase
        .from("cofounder_profiles")
        .select("id, alias, email, skills, interests, vibe, embedding");

      if (error) throw new Error(error.message);

      const ranked = (data as CofounderRow[])
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
          const matchScore = complementary * 0.4 + shared * 0.3 + sim * 0.3;
          const { embedding: _omit, ...rest } = p;
          return { ...rest, matchScore };
        })
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);

      return NextResponse.json({ matches: ranked });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
