"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadInspectionAttachmentAction } from "@/app/actions/inspection-workflow";

export function AttachmentUploader({ requestId }: { requestId: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="mt-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="sr-only"
        aria-label="اختر ملفاً للرفع"
        disabled={pending}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const fd = new FormData();
          fd.set("file", file);
          startTransition(async () => {
            const r = await uploadInspectionAttachmentAction(requestId, fd);
            e.target.value = "";
            if (r.ok) router.refresh();
            else alert(r.message);
          });
        }}
      />
      <button
        type="button"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
        className="w-full min-h-[48px] rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-3 text-sm font-medium text-indigo-800 transition hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-50"
      >
        {pending ? "جاري الرفع…" : "+ رفع صورة أو PDF (حتى 8 ميغابايت)"}
      </button>
    </div>
  );
}
