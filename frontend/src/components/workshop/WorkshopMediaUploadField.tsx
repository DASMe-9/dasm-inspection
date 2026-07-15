"use client";

import { useRef, useState, useTransition } from "react";
import { uploadWorkshopMediaAction } from "@/app/actions/workshop-media";
import type { WorkshopMediaKind } from "@/lib/cloudinary/workshop-media-kinds";

export function WorkshopMediaUploadField({
  workshopId,
  workshopSlug,
  kind,
  label,
  value,
  onUploaded,
  /** زر فقط بدون معاينة مكررة — المعاينة تكون في غلاف/شعار الصفحة. */
  buttonOnly = false,
  /** ضع false إذا كان الحقل المخفي موجوداً داخل نموذج آخر. */
  includeHidden = true,
  className,
}: {
  workshopId: string;
  workshopSlug: string;
  kind: WorkshopMediaKind;
  label: string;
  value: string;
  onUploaded: (url: string) => void;
  buttonOnly?: boolean;
  includeHidden?: boolean;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const fieldName = kind === "logo" ? "logo_url" : "cover_url";
  const buttonLabel = pending
    ? "جاري الرفع…"
    : value
      ? kind === "logo"
        ? "تغيير الشعار"
        : "تغيير الغلاف"
      : kind === "logo"
        ? "اختيار شعار"
        : "اختيار غلاف";

  function pickFile() {
    inputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
  }

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept="image/jpeg,image/png,image/webp,image/gif"
      className="sr-only"
      aria-label={label}
      disabled={pending}
      onChange={onFileChange}
    />
  );

  const statusMsg = msg ? (
    <p
      className={`text-xs ${
        msg.includes("تعذّر") ||
        msg.includes("غير") ||
        msg.includes("يتجاوز") ||
        msg.includes("يُقبل") ||
        msg.includes("مُعدّ")
          ? "text-red-600 dark:text-red-400"
          : "text-emerald-700 dark:text-emerald-400"
      }`}
      role="status"
    >
      {msg}
    </p>
  ) : null;

  if (buttonOnly) {
    return (
      <div className={className ?? "space-y-1"}>
        {includeHidden ? (
          <input type="hidden" name={fieldName} value={value} />
        ) : null}
        {fileInput}
        <button
          type="button"
          disabled={pending}
          onClick={pickFile}
          className="rounded-lg bg-[#1E74E8] px-3 py-1.5 text-xs font-semibold text-white shadow-sm disabled:opacity-50"
        >
          {buttonLabel}
        </button>
        {statusMsg}
      </div>
    );
  }

  return (
    <div className={`block space-y-2 ${className ?? ""}`}>
      <span className="text-sm text-slate-600 dark:text-slate-400">{label}</span>
      {includeHidden ? (
        <input type="hidden" name={fieldName} value={value} />
      ) : null}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-600 dark:bg-slate-800/60">
        <p className="flex-1 text-xs text-slate-500 dark:text-slate-400">
          من جهازك — يُحفظ في مجلد الورشة على التخزين السحابي
        </p>
        {fileInput}
        <button
          type="button"
          disabled={pending}
          onClick={pickFile}
          className="shrink-0 rounded-lg bg-[#1E74E8] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {buttonLabel}
        </button>
      </div>
      {statusMsg}
    </div>
  );
}
