"use client";

import { Download, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "dasm_workshop_pwa_install_dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandaloneDisplay(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS Safari
    ("standalone" in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

export function WorkshopInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (isStandaloneDisplay()) return;
    try {
      if (sessionStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setHidden(false);

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
    setHidden(true);
    setDeferred(null);
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }, [deferred, dismiss]);

  if (hidden || isStandaloneDisplay()) return null;

  return (
    <div
      className="mb-4 flex flex-col gap-3 rounded-xl border border-violet-200 bg-violet-50/90 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
      role="region"
      aria-label="تثبيت تطبيق الورشة"
    >
      <div className="min-w-0">
        <p className="text-sm font-bold text-violet-900">ثبّت لوحة الورشة</p>
        <p className="text-xs text-[#1857b8]/90 mt-0.5">
          افتح الطلبات والميداني من الشاشة الرئيسية — يعمل كتطبيق على الجوال.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {deferred ? (
          <button
            type="button"
            onClick={() => void install()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#1E74E8] px-3 py-2 text-xs font-semibold text-white hover:bg-violet-600"
          >
            <Download className="h-4 w-4" aria-hidden />
            تثبيت
          </button>
        ) : (
          <span className="text-xs text-[#1E74E8]">
            من قائمة المتصفح: «إضافة إلى الشاشة الرئيسية»
          </span>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="rounded-lg p-2 text-[#1E74E8] hover:bg-violet-100"
          aria-label="إخفاء"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
