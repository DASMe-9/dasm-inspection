export type WorkshopEducationalVideo = {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  sort_order?: number;
};

export const WORKSHOP_SHOWCASE_LIMITS = {
  gallery: 24,
  repairs: 24,
  videos: 12,
} as const;

/** Only trusted Cloudinary uploads go through the Next.js image optimizer. */
export function isOptimizableWorkshopImageUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com";
  } catch {
    return false;
  }
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function parseUrlList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item !== "" && isValidHttpUrl(item));
}

export function parseEducationalVideos(raw: unknown): WorkshopEducationalVideo[] {
  if (!Array.isArray(raw)) return [];

  const items: WorkshopEducationalVideo[] = [];
  raw.forEach((entry, index) => {
    if (!entry || typeof entry !== "object") return;
    const row = entry as Record<string, unknown>;
    const videoUrl =
      typeof row.video_url === "string" ? row.video_url.trim() : "";
    if (!isValidHttpUrl(videoUrl)) return;

    const title =
      typeof row.title === "string" && row.title.trim() !== ""
        ? row.title.trim()
        : "إصلاح مميز";

    items.push({
      id:
        typeof row.id === "string" && row.id.trim() !== ""
          ? row.id.trim()
          : `video-${index + 1}`,
      title,
      description:
        typeof row.description === "string" && row.description.trim() !== ""
          ? row.description.trim()
          : undefined,
      video_url: videoUrl,
      thumbnail_url:
        typeof row.thumbnail_url === "string" &&
        row.thumbnail_url.trim() !== "" &&
        isValidHttpUrl(row.thumbnail_url)
          ? row.thumbnail_url.trim()
          : undefined,
      sort_order:
        typeof row.sort_order === "number" && Number.isFinite(row.sort_order)
          ? row.sort_order
          : index,
    });
  });

  return items
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .slice(0, WORKSHOP_SHOWCASE_LIMITS.videos);
}

export function normalizeUrlList(
  urls: string[],
  max: number
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of urls) {
    const url = raw.trim();
    if (!isValidHttpUrl(url) || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= max) break;
  }
  return out;
}

export function normalizeEducationalVideos(
  videos: WorkshopEducationalVideo[]
): WorkshopEducationalVideo[] {
  return videos
    .filter((v) => isValidHttpUrl(v.video_url))
    .slice(0, WORKSHOP_SHOWCASE_LIMITS.videos)
    .map((v, index) => ({
      id: v.id || `video-${index + 1}`,
      title: v.title.trim() || "إصلاح مميز",
      description: v.description?.trim() || undefined,
      video_url: v.video_url.trim(),
      thumbnail_url:
        v.thumbnail_url && isValidHttpUrl(v.thumbnail_url)
          ? v.thumbnail_url.trim()
          : undefined,
      sort_order: index,
    }));
}

export function parseUrlListJson(raw: string): string[] {
  if (!raw.trim()) return [];
  try {
    return parseUrlList(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function parseEducationalVideosJson(raw: string): WorkshopEducationalVideo[] {
  if (!raw.trim()) return [];
  try {
    return parseEducationalVideos(JSON.parse(raw));
  } catch {
    return [];
  }
}
