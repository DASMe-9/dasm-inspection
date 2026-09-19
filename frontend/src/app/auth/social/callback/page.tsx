"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2, LockKeyhole } from "lucide-react";

import { AuthCard, AuthShell } from "@/components/auth/AuthShell";
import { PUBLIC_BRAND } from "@/components/public-site";
import {
  exchangeSocialCode,
  readStashedReturn,
  clearStashedReturn,
} from "@/lib/auth/inspection-social-auth";

const BACK_BTN =
  "mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] text-sm font-bold text-white transition hover:bg-white/10";

function SocialCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<"working" | "denied" | "error">("working");
  const [message, setMessage] = useState("");
  const [deniedType, setDeniedType] = useState("");
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    const code = searchParams.get("code") ?? "";
    const status = searchParams.get("status") ?? "";
    const reason = searchParams.get("reason") ?? "";

    if (status === "error" || (!code && status !== "ok")) {
      setMessage(
        reason === "oauth_denied"
          ? "تم إلغاء تسجيل الدخول عبر Google."
          : "تعذّر إكمال تسجيل الدخول عبر Google. حاول مرة أخرى.",
      );
      setPhase("error");
      return;
    }

    void (async () => {
      const result = await exchangeSocialCode(code);
      if (result.ok) {
        const back = readStashedReturn();
        clearStashedReturn();
        router.replace(back);
        return;
      }
      if (result.denied) {
        setDeniedType(result.denied);
        setPhase("denied");
        return;
      }
      setMessage(result.error || "تعذّر إكمال تسجيل الدخول.");
      setPhase("error");
    })();
  }, [router, searchParams]);

  return (
    <AuthShell>
      <AuthCard>
        {phase === "working" && (
          <div className="flex flex-col items-center gap-4 py-6 text-white/75" role="status">
            <Loader2 className="h-8 w-8 animate-spin" style={{ color: PUBLIC_BRAND.green }} aria-hidden />
            <p>جارٍ إكمال تسجيل الدخول…</p>
          </div>
        )}

        {phase === "denied" && (
          <div className="text-center">
            <span className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/10 text-red-300">
              <LockKeyhole className="h-8 w-8" aria-hidden />
            </span>
            <h1 className="text-xl font-extrabold">غير مخوّل</h1>
            <p className="mt-2 text-sm leading-7 text-white/60">
              حسابك ({deniedType || "unknown"}) لا يملك صلاحية دخول منصة فحص داسم.
              <br />
              تواصل مع إدارة داسم لتفعيل الصلاحية.
            </p>
            <button type="button" onClick={() => router.replace("/auth/login")} className={BACK_BTN}>
              العودة لتسجيل الدخول
            </button>
          </div>
        )}

        {phase === "error" && (
          <div>
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 p-3.5 text-sm text-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{message}</span>
            </div>
            <button type="button" onClick={() => router.replace("/auth/login")} className={BACK_BTN}>
              العودة لتسجيل الدخول
            </button>
          </div>
        )}
      </AuthCard>
    </AuthShell>
  );
}

export default function SocialCallbackPage() {
  return (
    <Suspense fallback={null}>
      <SocialCallbackInner />
    </Suspense>
  );
}
