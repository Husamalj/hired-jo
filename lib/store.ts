// In-memory store — persists for the lifetime of the server process (fine for demo)

export type LeaderboardRow = {
  id: number;
  alias: string;
  score: number;
  topSkill: string;
  createdAt: string;
};

export type CofounderRow = {
  id: number;
  alias: string;
  email: string;
  skills: string;
  interests: string;
  vibe: string;
};

const g = globalThis as any;
if (!g.__store) {
  g.__store = { leaderboard: [] as LeaderboardRow[], cofounders: [] as CofounderRow[], nextId: 1 };
}
const store: { leaderboard: LeaderboardRow[]; cofounders: CofounderRow[]; nextId: number } = g.__store;

export function addLeaderboardEntry(entry: Omit<LeaderboardRow, "id" | "createdAt">): LeaderboardRow {
  const row: LeaderboardRow = { ...entry, id: store.nextId++, createdAt: new Date().toISOString() };
  store.leaderboard.push(row);
  return row;
}

export function getLeaderboard(): LeaderboardRow[] {
  return [...store.leaderboard].sort((a, b) => b.score - a.score).slice(0, 20);
}

export function addCofounder(entry: Omit<CofounderRow, "id">): CofounderRow {
  const existing = store.cofounders.findIndex((c) => c.alias === entry.alias);
  if (existing >= 0) { store.cofounders[existing] = { ...store.cofounders[existing], ...entry }; return store.cofounders[existing]; }
  const row: CofounderRow = { ...entry, id: store.nextId++ };
  store.cofounders.push(row);
  return row;
}

export function getCofounders(): CofounderRow[] {
  return store.cofounders;
}
