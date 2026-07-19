import type { MetadataRoute } from "next";
import { content, origin } from "../lib/data";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = origin();
  const updated = new Date("2026-07-19T00:00:00Z");
  return [
    { url: base, lastModified: updated, changeFrequency: "monthly", priority: 1 },
    { url: `${base}/frameworks`, lastModified: updated, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/compare`, lastModified: updated, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/cases/reliable-webhook-delivery`, lastModified: updated, changeFrequency: "yearly", priority: 0.8 },
    ...content.frameworks.map((framework) => ({ url: `${base}/frameworks/${framework.slug}`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...content.comparisons.map((comparison) => ({ url: `${base}/compare/${comparison.slug}`, lastModified: updated, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
