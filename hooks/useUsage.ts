"use client";
import { useEffect, useState, useCallback } from "react";
import type { Tier } from "@/lib/tiers";
import { LIMITS } from "@/lib/tiers";

export interface UsageData {
  cv_builds: number;
  ai_edits: number;
  cover_letters: number;
  cv_builds_lifetime: number;
  cover_letters_lifetime: number;
  ai_edits_bonus: number;
  cv_builds_bonus: number;
  cover_letters_bonus: number;
}

export interface UsageState {
  tier: Tier;
  usage: UsageData | null;
  limits: typeof LIMITS[Tier];
  loading: boolean;
  refetch: () => void;
}

export function useUsage(): UsageState {
  const [tier, setTier] = useState<Tier>("free");
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [limits, setLimits] = useState<typeof LIMITS[Tier]>(LIMITS.free);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(() => {
    setLoading(true);
    fetch("/api/subscription")
      .then((r) => r.json())
      .then((data) => {
        setTier(data.tier ?? "free");
        setUsage(data.usage ?? null);
        setLimits(data.limits ?? LIMITS.free);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  return { tier, usage, limits, loading, refetch: fetchUsage };
}
