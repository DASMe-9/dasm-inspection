"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  exchangeSocialCode,
  readStashedReturn,
  clearStashedReturn,
} from "@/lib/auth/inspection-social-auth";

const SHELL: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(145deg, #071428 0%, #0c1f3d 50%, #132a4a 100%)",
  padding: "1.5rem",
};

const CARD: React.CSSProperties = {
  maxWidth: 400,
  width: "100%",
  textAlign: "center",
  padding: "2.5rem",
  borderRadius: 20,
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(99,102,241,0.15)",
};

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
    <div dir="rtl" style={SHELL}>
      <div style={CARD}>
        {phase === "working" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", color: "rgba(255,255,255,0.7)" }}>
            <svg style={{ width: 32, height: 32, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
              <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="#8dc63f" strokeWidth="4" />
              <path style={{ opacity: 0.75 }} fill="#8dc63f" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p style={{ margin: 0 }}>جارٍ إكمال تسجيل الدخول…</p>
          </div>
        )}

        {phase === "denied" && (
          <>
            <h2 style={{ margin: "0 0 0.5rem", color: "white", fontWeight: 700, fontSize: "1.125rem" }}>غير مخوّل</h2>
            <p style={{ margin: "0 0 1.5rem", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.6 }}>
              حسابك ({deniedType || "unknown"}) لا يملك صلاحية دخول منصة فحص داسم.<br />
              تواصل مع إدارة داسم لتفعيل الصلاحية.
            </p>
            <button onClick={() => router.replace("/auth/login")} style={btnStyle}>العودة لتسجيل الدخول</button>
          </>
        )}

        {phase === "error" && (
          <>
            <p style={{ margin: "0 0 1.5rem", color: "#fca5a5", fontSize: "0.9rem", lineHeight: 1.6 }}>{message}</p>
            <button onClick={() => router.replace("/auth/login")} style={btnStyle}>العودة لتسجيل الدخول</button>
          </>
        )}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "0.75rem 1.5rem",
  borderRadius: 12,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  color: "rgba(255,255,255,0.6)",
  cursor: "pointer",
  fontSize: "0.875rem",
};

export default function SocialCallbackPage() {
  return (
    <Suspense fallback={null}>
      <SocialCallbackInner />
    </Suspense>
  );
}
