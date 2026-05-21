import { createSupabaseBrowserClient } from "./supabase-browser";
import type { CV } from "./types";

const sb = () => createSupabaseBrowserClient();

export async function syncCvToAccount(cv: CV): Promise<void> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return;
  await sb().from("user_cvs").upsert(
    { user_id: user.id, cv_json: cv, updated_at: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function loadCvFromAccount(): Promise<CV | null> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return null;
  const { data } = await sb().from("user_cvs").select("cv_json").eq("user_id", user.id).single();
  return (data?.cv_json as CV) ?? null;
}

export async function saveJob(jobId: string): Promise<void> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return;
  await sb().from("user_saved_jobs").upsert({ user_id: user.id, job_id: jobId }, { onConflict: "user_id,job_id" });
}

export async function unsaveJob(jobId: string): Promise<void> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return;
  await sb().from("user_saved_jobs").delete().eq("user_id", user.id).eq("job_id", jobId);
}

export async function loadSavedJobIds(): Promise<string[]> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return [];
  const { data } = await sb().from("user_saved_jobs").select("job_id").eq("user_id", user.id);
  return data?.map((r: any) => r.job_id) ?? [];
}

export async function syncScoreToAccount(score: number, breakdown: Record<string, unknown>): Promise<void> {
  const { data: { user } } = await sb().auth.getUser();
  if (!user) return;
  await sb().from("user_scores").insert({ user_id: user.id, score, breakdown });
}
