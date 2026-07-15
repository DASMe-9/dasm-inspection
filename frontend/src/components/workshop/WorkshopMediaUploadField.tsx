"use client";

import { useRef, useState, useTransition } from "react";
import { Camera, ImagePlus } from "lucide-react";
import { uploadWorkshopMediaAction } from "@/app/actions/workshop-media";
import type { WorkshopMediaKind } from "@/lib/cloudinary/workshop-media-kinds";

export function WorkshopMediaUploadField({
  workshopId,
  workshopSlug,
  kind,
  label,
  value,
  onUploaded,
}: {
  workshopId: string;
  workshopSlug: string;
  kind: WorkshopMediaKind;
  label: string;
  value: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="block space-y-2">
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      <input type="hidden" name={kind === "logo" ? "logo_url" : "cover_url"} value={value} />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-600 dark:bg-slate-800/60">
        <div className="relative flex h-28 items-center justify-center bg-slate-100 dark:bg-slate-900/50">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-slate-400">
              {kind === "cover" ? (
                <Camera className="h-7 w-7" aria-hidden />
              ) : (
                <ImagePlus className="h-7 w-7" aria-hidden />
              )}
              <span className="text-xs">لا صورة بعد</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 px-3 py-2 dark:border-slate-600">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            من جهازك — يُحفظ في مجلد الورشة على التخزين السحابي
          </p>
          <button
            type="button"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-lg bg-[#1E74E8] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
          >
            {pending ? "جاري الرفع…" : value ? "تغيير" : "اختيار صورة"}
          </button>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="sr-only"
        aria-label={label}
        disabled={pending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setMsg(null);
          const fd = new FormData();
          fd.set("workshop_id", workshopId);
          fd.set("workshop_slug", workshopSlug);
          fd.set("kind", kind);
          fd.set("file", file);
          startTransition(async () => {
            const r = await uploadWorkshopMediaAction(fd);
            e.target.value = "";
            if (r.ok) {
              onUploaded(r.url);
              setMsg("تم رفع الصورة.");
            } else {
              setMsg(r.message);
            }
          });
        }}
      />
      {msg ? (
        <p
          className={`text-xs ${msg.includes("تعذّر") || msg.includes("غير") || msg.includes("يتجاوز") || msg.includes("يُقبل") || msg.includes("مُعدّ") ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}
          role="status"
        >
          {msg}
        </p>
      ) : null}
    </div>
  );
}
