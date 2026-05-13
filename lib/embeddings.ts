/**
 * Local keyword-based embeddings — no external API required.
 * Builds a sparse TF-style vector over a fixed vocabulary derived from
 * common tech/job keywords. The cosine() function is unchanged so all
 * callers (cofounder matching) work without modification.
 */

const VOCAB: string[] = [
  // Tech
  "javascript","typescript","python","java","go","rust","php","ruby","swift","kotlin","dart","scala",
  "react","nextjs","vue","angular","svelte","nodejs","express","nestjs","django","flask","fastapi","spring","laravel",
  "sql","postgresql","mysql","mongodb","redis","elasticsearch","firebase","supabase","graphql","rest","api",
  "aws","azure","gcp","docker","kubernetes","terraform","cicd","git","linux","bash",
  "html","css","tailwind","figma","ui","ux","design","mobile","flutter","reactnative","android","ios",
  "machine","learning","deep","ai","nlp","data","science","analytics","tableau","powerbi","excel","statistics",
  "security","blockchain","devops","cloud","microservices","serverless",
  // Business / soft skills
  "marketing","sales","business","finance","accounting","legal","hr","recruitment","operations","logistics",
  "management","leadership","communication","teamwork","agile","scrum","project","product","strategy","research",
  "customer","service","support","healthcare","education","teaching","journalism","media","retail","ecommerce",
  "arabic","english","french","german","spanish",
  // Seniority
  "intern","junior","senior","lead","manager","director","head","principal","architect","engineer","developer",
];

const IDX = new Map<string, number>(VOCAB.map((w, i) => [w, i]));

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export function embed(text: string): number[] {
  const vec = new Array<number>(VOCAB.length).fill(0);
  for (const token of tokenize(text)) {
    const i = IDX.get(token);
    if (i !== undefined) vec[i] += 1;
  }
  return vec;
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na  += a[i] * a[i];
    nb  += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}
