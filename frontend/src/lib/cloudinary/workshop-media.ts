import "server-only";
import { createHash } from "crypto";
import type { WorkshopMediaKind } from "@/lib/cloudinary/workshop-media-kinds";

export type { WorkshopMediaKind } from "@/lib/cloudinary/workshop-media-kinds";

type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

function parseCloudinaryUrl(): CloudinaryCredentials | null {
  const raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) return null;
  try {
    const u = new URL(raw);
    const cloudName = u.hostname;
    const apiKey = decodeURIComponent(u.username);
    const apiSecret = decodeURIComponent(u.password);
    if (!cloudName || !apiKey || !apiSecret) return null;
    return { cloudName, apiKey, apiSecret };
  } catch {
    return null;
  }
}

function signParams(
  params: Record<string, string | number>,
  apiSecret: string
): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${apiSecret}`).digest("hex");
}

function sanitizeFolderSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "workshop";
}

export async function uploadWorkshopImageToCloudinary(input: {
  file: File;
  workshopSlug: string;
  kind: WorkshopMediaKind;
}): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const creds = parseCloudinaryUrl();
  if (!creds) {
    return {
      ok: false,
      message:
        "تخزين الصور غير مُعدّ (CLOUDINARY_URL). أبلغ الإدارة لإكمال الإعداد.",
    };
  }

  const maxBytes = 8 * 1024 * 1024;
  if (input.file.size > maxBytes) {
    return { ok: false, message: "حجم الصورة يتجاوز 8 ميغابايت." };
  }
  if (!input.file.type.startsWith("image/")) {
    return { ok: false, message: "يُقبل ملفات الصور فقط." };
  }

  const folder = `workshops/${sanitizeFolderSegment(input.workshopSlug)}`;
  const publicId = input.kind;
  const timestamp = Math.floor(Date.now() / 1000);
  const params: Record<string, string | number> = {
    folder,
    invalidate: 1,
    overwrite: 1,
    public_id: publicId,
    timestamp,
  };
  const signature = signParams(params, creds.apiSecret);

  const body = new FormData();
  body.set("file", input.file);
  body.set("api_key", creds.apiKey);
  body.set("timestamp", String(timestamp));
  body.set("folder", folder);
  body.set("public_id", publicId);
  body.set("overwrite", "1");
  body.set("invalidate", "1");
  body.set("signature", signature);

  const endpoint = `https://api.cloudinary.com/v1_1/${creds.cloudName}/image/upload`;
  const res = await fetch(endpoint, { method: "POST", body });
  const json = (await res.json().catch(() => null)) as {
    secure_url?: string;
    error?: { message?: string };
  } | null;

  if (!res.ok || !json?.secure_url) {
    return {
      ok: false,
      message: json?.error?.message ?? "تعذّر رفع الصورة إلى التخزين.",
    };
  }

  return { ok: true, url: json.secure_url };
}
