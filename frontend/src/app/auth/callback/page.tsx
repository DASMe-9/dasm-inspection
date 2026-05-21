"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { setInspectionBrowserSession } from "@/lib/auth/inspection-browser-session";
import { buildPostSsoDestination } from "@/lib/auth/resolve-sso-redirect";
import { platformTypeAllowedForInspectionLogin } from "@/lib/auth/platform-inspection-role";

type Status = "loading" | "denied" | "error";

function sanitizeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/auth/login";
  }
  return raw;
}

function AccessDenied({ type }: { type: string }) {
  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #020509, #0a1020)",
        padding: "1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: 400,
          width: "100%",
          textAlign: "center",
          padding: "2.5rem",
          borderRadius: 20,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(99,102,241,0.15)",
        }}
      >
        <h2 style={{ margin: "0 0 0.5rem", color: "white", fontWeight: 700 }}>
          غير مخوّل
        </h2>
        <p style={{ margin: "0 0 1.5rem", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
          حسابك ({type}) لا يملك صلاحية دخول منصة فحص داسم عبر SSO.
        </p>
        <a
          href="https://www.dasm.com.sa/dashboard"
          style={{
            display: "inline-block",
            padding: "0.75rem 1.5rem",
            borderRadius: 12,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            fontSize: "0.875rem",
          }}
        >
          العودة لمنصة داسم
        </a>
      </div>
    </div>
  );
}

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>("loading");
  const [deniedType, setDeniedType] = useState("unknown");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const ssoToken = searchParams.get("sso_token")?.trim();
    const redirectParam = searchParams.get("redirect");
    const returnTo = sanitizeReturnTo(
      searchParams.get("returnTo") ?? searchParams.get("return_url")
    );

    if (!ssoToken) {
      router.replace(
        `/auth/login?authError=1&returnTo=${encodeURIComponent(returnTo)}`
      );
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/auth/sso-callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sso_token: ssoToken }),
        });
        const body = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (res.status === 403 && body?.code === "forbidden_type") {
          setDeniedType(String(body.user_type ?? "unknown"));
          setStatus("denied");
          return;
        }

        if (!res.ok || !body?.success) {
          setStatus("error");
          setErrorMsg(body?.message ?? "تعذّر إكمال تسجيل الدخول");
          setTimeout(() => {
            router.replace(
              `/auth/login?authError=1&returnTo=${encodeURIComponent(returnTo)}`
            );
          }, 1800);
          return;
        }

        const token = body.data?.access_token as string | undefined;
        const user = body.data?.user as Record<string, unknown> | undefined;
        if (!token || !user) {
          setStatus("error");
          setErrorMsg("استجابة غير متوقعة");
          return;
        }

        const userType = String(user.type ?? "");
        if (!platformTypeAllowedForInspectionLogin(userType)) {
          setDeniedType(userType || "unknown");
          setStatus("denied");
          return;
        }

        setInspectionBrowserSession(token, {
          id: user.id as number | string,
          email: user.email as string | null | undefined,
          first_name: user.first_name as string | null | undefined,
          last_name: user.last_name as string | null | undefined,
          phone: user.phone as string | null | undefined,
          type: userType,
          avatar_url: user.avatar_url as string | null | undefined,
          organization_id: user.organization_id as number | string | null | undefined,
        });

        const firstName = String(user.first_name ?? "").trim();
        const lastName = String(user.last_name ?? "").trim();
        const displayName = [firstName, lastName].filter(Boolean).join(" ");

        const destination = buildPostSsoDestination(
          redirectParam,
          { type: userType },
          String(user.id),
          displayName
        );

        router.replace(destination);
      } catch {
        if (cancelled) return;
        setStatus("error");
        setErrorMsg("خطأ في الاتصال بالخادم");
        setTimeout(() => {
          router.replace(
            `/auth/login?authError=1&returnTo=${encodeURIComponent(returnTo)}`
          );
        }, 1800);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (status === "denied") return <AccessDenied type={deniedType} />;

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1rem",
        background: "linear-gradient(145deg, #020509, #0a1020)",
        color: "rgba(255,255,255,0.7)",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          border: "3px solid rgba(99,102,241,0.2)",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p style={{ margin: 0, fontSize: "0.9375rem" }}>
        {status === "error" ? errorMsg : "جارٍ إكمال الدخول من منصة داسم…"}
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={null}>
      <CallbackInner />
    </Suspense>
  );
}
