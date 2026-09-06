"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { saveWorkshopShowcaseAction } from "@/app/actions/workshop-management";
import type { WorkshopEducationalVideo } from "@/types";
import {
  isOptimizableWorkshopImageUrl,
  WORKSHOP_SHOWCASE_LIMITS,
} from "@/lib/workshop-showcase";

type Props = {
  workshopId: string;
  workshopSlug: string;
  galleryUrls: string[];
  repairShowcaseUrls: string[];
  educationalVideos: WorkshopEducationalVideo[];
};

function moveItem<T>(list: T[], index: number, direction: -1 | 1): T[] {
  const next = [...list];
  const target = index + direction;
  if (target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

function UrlListEditor({
  title,
  hint,
  items,
  onChange,
  max,
  addLabel,
}: {
  title: string;
  hint: string;
  items: string[];
  onChange: (next: string[]) => void;
  max: number;
  addLabel: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const url = draft.trim();
    if (!url) return;
    if (items.length >= max) return;
    onChange([...items, url]);
    setDraft("");
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div>
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          dir="ltr"
          placeholder="https://..."
          className="min-w-0 flex-1 rounded-lg border px-3 py-2 text-left text-sm"
        />
        <button
          type="button"
          onClick={add}
          disabled={items.length >= max}
          className="inline-flex items-center justify-center gap-1 rounded-lg bg-violet-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {addLabel}
        </button>
      </div>

      <p className="text-[11px] text-slate-400 dark:text-slate-500">
        {items.length} / {max} — الصور عبر رابط (Cloudinary أو أي استضافة صور)
      </p>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500">
          لا توجد صور بعد
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"
            >
              <Image
                src={url}
                alt=""
                width={48}
                height={48}
                sizes="48px"
                unoptimized={!isOptimizableWorkshopImageUrl(url)}
                className="h-12 w-12 shrink-0 rounded-lg object-cover"
              />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                dir="ltr"
                className="min-w-0 flex-1 truncate text-xs text-violet-700 hover:underline dark:text-violet-300"
              >
                {url}
              </a>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => onChange(moveItem(items, index, -1))}
                  disabled={index === 0}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-30"
                  aria-label="تحريك لأعلى"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(moveItem(items, index, 1))}
                  disabled={index === items.length - 1}
                  className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-30"
                  aria-label="تحريك لأسفل"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onChange(items.filter((_, i) => i !== index))}
                  className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function emptyVideo(): WorkshopEducationalVideo {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
  };
}

function VideoListEditor({
  items,
  onChange,
}: {
  items: WorkshopEducationalVideo[];
  onChange: (next: WorkshopEducationalVideo[]) => void;
}) {
  const add = () => {
    if (items.length >= WORKSHOP_SHOWCASE_LIMITS.videos) return;
    onChange([...items, emptyVideo()]);
  };

  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-800/50">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">تثقيفي — إصلاحات مميزة بالفيديو</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            فيديوهات قصيرة تشرح إصلاحات مميزة (يوتيوب أو رابط مباشر) — تظهر في السوق الكبير وملف الورشة.
          </p>
        </div>
        <button
          type="button"
          onClick={add}
          disabled={items.length >= WORKSHOP_SHOWCASE_LIMITS.videos}
          className="inline-flex items-center gap-1 rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-800 disabled:opacity-50 dark:border-violet-800 dark:bg-slate-900 dark:text-violet-200"
        >
          <Plus className="h-4 w-4" />
          إضافة فيديو
        </button>
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-300 bg-white px-3 py-6 text-center text-xs text-slate-400 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-500">
          أضف فيديو تثقيفي لتمييز ورشتك
        </p>
      ) : (
        <ul className="space-y-4">
          {items.map((video, index) => (
            <li
              key={video.id}
              className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">فيديو {index + 1}</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => onChange(moveItem(items, index, -1))}
                    disabled={index === 0}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(moveItem(items, index, 1))}
                    disabled={index === items.length - 1}
                    className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange(items.filter((v) => v.id !== video.id))}
                    className="rounded p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <label className="block">
                <span className="text-xs text-slate-600 dark:text-slate-400">عنوان الفيديو *</span>
                <input
                  value={video.title}
                  onChange={(e) =>
                    onChange(
                      items.map((v) =>
                        v.id === video.id ? { ...v, title: e.target.value } : v
                      )
                    )
                  }
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="مثال: إصلاح علبة الفيوس الكامل"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600 dark:text-slate-400">وصف قصير</span>
                <textarea
                  value={video.description ?? ""}
                  onChange={(e) =>
                    onChange(
                      items.map((v) =>
                        v.id === video.id
                          ? { ...v, description: e.target.value }
                          : v
                      )
                    )
                  }
                  className="mt-1 min-h-[64px] w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600 dark:text-slate-400">رابط الفيديو *</span>
                <input
                  value={video.videoUrl}
                  onChange={(e) =>
                    onChange(
                      items.map((v) =>
                        v.id === video.id ? { ...v, videoUrl: e.target.value } : v
                      )
                    )
                  }
                  dir="ltr"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="https://youtube.com/watch?v=..."
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-600 dark:text-slate-400">صورة مصغّرة (اختياري)</span>
                <input
                  value={video.thumbnailUrl ?? ""}
                  onChange={(e) =>
                    onChange(
                      items.map((v) =>
                        v.id === video.id
                          ? { ...v, thumbnailUrl: e.target.value }
                          : v
                      )
                    )
                  }
                  dir="ltr"
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  placeholder="https://..."
                />
              </label>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WorkshopShowcaseEditor({
  workshopId,
  workshopSlug,
  galleryUrls: initialGallery,
  repairShowcaseUrls: initialRepairs,
  educationalVideos: initialVideos,
}: Props) {
  const [galleryUrls, setGalleryUrls] = useState(initialGallery);
  const [repairShowcaseUrls, setRepairShowcaseUrls] = useState(initialRepairs);
  const [educationalVideos, setEducationalVideos] = useState(initialVideos);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const payload = useMemo(
    () => ({
      gallery_urls_json: JSON.stringify(galleryUrls),
      repair_showcase_urls_json: JSON.stringify(repairShowcaseUrls),
      educational_videos_json: JSON.stringify(
        educationalVideos.map((video, index) => ({
          id: video.id,
          title: video.title,
          description: video.description ?? null,
          video_url: video.videoUrl,
          thumbnail_url: video.thumbnailUrl ?? null,
          sort_order: index,
        }))
      ),
    }),
    [galleryUrls, repairShowcaseUrls, educationalVideos]
  );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h2 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">معرض الورشة والمحتوى التثقيفي</h2>
      <p className="mb-5 text-sm text-slate-500 dark:text-slate-400">
        يظهر في <strong>السوق الكبير</strong> على dasm.com.sa وفي ملف الورشة العام — مثل معرض
        سيارات المعرض لكن بصور الورشة وإصلاحاتها وفيديوهاتها.
      </p>

      <form
        className="space-y-5"
        action={(fd) => {
          setMessage(null);
          fd.set("gallery_urls_json", payload.gallery_urls_json);
          fd.set("repair_showcase_urls_json", payload.repair_showcase_urls_json);
          fd.set("educational_videos_json", payload.educational_videos_json);
          startTransition(async () => {
            const result = await saveWorkshopShowcaseAction(fd);
            setMessage(result.ok ? "تم حفظ المعرض والفيديوهات." : result.message);
          });
        }}
      >
        <input type="hidden" name="workshop_id" value={workshopId} />
        <input type="hidden" name="workshop_slug" value={workshopSlug} />
        <input type="hidden" name="gallery_urls_json" value={payload.gallery_urls_json} />
        <input
          type="hidden"
          name="repair_showcase_urls_json"
          value={payload.repair_showcase_urls_json}
        />
        <input
          type="hidden"
          name="educational_videos_json"
          value={payload.educational_videos_json}
        />

        <UrlListEditor
          title="صور الورشة"
          hint="صور المنشأة، المعدات، فريق العمل، أو واجهة الورشة."
          items={galleryUrls}
          onChange={setGalleryUrls}
          max={WORKSHOP_SHOWCASE_LIMITS.gallery}
          addLabel="إضافة صورة"
        />

        <UrlListEditor
          title="أعمال الإصلاح"
          hint="قبل/بعد الإصلاح أو أثناء العمل — لإظهار خبرة الورشة."
          items={repairShowcaseUrls}
          onChange={setRepairShowcaseUrls}
          max={WORKSHOP_SHOWCASE_LIMITS.repairs}
          addLabel="إضافة صورة إصلاح"
        />

        <VideoListEditor items={educationalVideos} onChange={setEducationalVideos} />

        <div>
          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? "جاري الحفظ…" : "حفظ المعرض والفيديوهات"}
          </button>
          {message && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400" role="status">
              {message}
            </p>
          )}
        </div>
      </form>
    </section>
  );
}
