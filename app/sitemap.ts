import type { MetadataRoute } from "next";

const SITE_URL = "https://hiredjo.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/build", priority: 0.9, changeFrequency: "monthly" },
    { path: "/jobs", priority: 0.9, changeFrequency: "daily" },
    { path: "/score", priority: 0.8, changeFrequency: "monthly" },
    { path: "/roast", priority: 0.8, changeFrequency: "monthly" },
    { path: "/cover", priority: 0.7, changeFrequency: "monthly" },
    { path: "/dashboard", priority: 0.7, changeFrequency: "weekly" },
    { path: "/cofounder", priority: 0.7, changeFrequency: "weekly" },
    { path: "/leaderboard", priority: 0.6, changeFrequency: "daily" },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
