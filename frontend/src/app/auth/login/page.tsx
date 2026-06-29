"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { platformTypeAllowedForInspectionLogin } from "@/lib/auth/platform-inspection-role";
import {
  startGoogleRedirectLogin,
  loginWithApple,
} from "@/lib/auth/inspection-social-auth";

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? "";

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: object) => void;
        signIn: () => Promise<{ authorization?: { id_token?: string } }>;
      };
    };
  }
}

function loadScript(src: string): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  const current = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
  if (current?.dataset.loaded === "true") return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = current ?? document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    if (!current) document.body.appendChild(script);
  });
}

type LoginDeniedUser = { type: string };

function messageFromUnknown(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return "تعذّر تسجيل الدخول";
}

function AccessDenied({ type }: { type: string }) {
  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(145deg, #020509, #0a1020)", padding: "1.5rem" }}>
      <div style={{ maxWidth: 400, width: "100%", textAlign: "center", padding: "2.5rem", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.15)" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem", background: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)" }}>
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24" stroke="#f87171"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 style={{ margin: "0 0 0.5rem", color: "white", fontWeight: 700, fontSize: "1.125rem" }}>غير مخوّل</h2>
        <p style={{ margin: "0 0 1.5rem", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.6 }}>
          حسابك ({type}) لا يملك صلاحية دخول منصة فحص داسم.<br />
          تواصل مع إدارة داسم لتفعيل الصلاحية.
        </p>
        <button onClick={() => { localStorage.clear(); window.location.href = "/auth/login"; }} style={{ padding: "0.75rem 1.5rem", borderRadius: 12, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: "0.875rem" }}>
          تسجيل خروج
        </button>
      </div>
    </div>
  );
}

function sanitizeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/dashboard";
  }
  if (raw === "/") return "/dashboard";
  return raw;
}

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = sanitizeReturnTo(searchParams.get("returnTo"));
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [denied, setDenied] = useState<LoginDeniedUser | null>(null);
  const [socialBusy, setSocialBusy] = useState<"google" | "apple" | null>(null);

  if (denied) return <AccessDenied type={denied.type} />;

  const onGoogle = () => {
    if (busy || socialBusy) return;
    setError(null);
    setSocialBusy("google");
    // Leaves the SPA for Google's consent screen (Core Socialite redirect flow).
    startGoogleRedirectLogin(returnTo);
  };

  const onApple = async () => {
    if (!appleClientId || busy || socialBusy) return;
    setError(null);
    setSocialBusy("apple");
    try {
      await loadScript(
        "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js",
      );
      if (!window.AppleID) {
        setError("تعذّر تحميل تسجيل الدخول عبر Apple");
        return;
      }
      window.AppleID.auth.init({
        clientId: appleClientId,
        scope: "name email",
        redirectURI: `${window.location.origin}/auth/login`,
        usePopup: true,
      });
      const response = await window.AppleID.auth.signIn();
      const idToken = response.authorization?.id_token;
      if (!idToken) {
        setError("لم يُستلم رمز Apple");
        return;
      }
      const result = await loginWithApple(idToken);
      if (result.ok) {
        router.replace(returnTo);
        return;
      }
      if (result.denied) {
        setDenied({ type: result.denied });
        return;
      }
      setError(result.error || "تعذّر إكمال تسجيل الدخول عبر Apple");
    } catch {
      setError("تعذّر إكمال تسجيل الدخول عبر Apple");
    } finally {
      setSocialBusy(null);
    }
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res  = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? "تعذّر تسجيل الدخول");
      const token = body.data?.access_token ?? body.access_token;
      const user  = body.data?.user ?? body.user;
      if (!token || !user) throw new Error("استجابة غير متوقعة من الخادم");
      const userType = String(user.type ?? "");
      if (!platformTypeAllowedForInspectionLogin(userType)) {
        setDenied({ type: userType || "unknown" });
        return;
      }
      const maxAge = 60 * 60 * 8;
      const secure =
        typeof window !== "undefined" && window.location.protocol === "https:"
          ? "; Secure"
          : "";
      // كوكي يقرأها middleware (Sanctum + تحقق عبر /api/user/profile على Core)
      document.cookie = `dasm_access_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
      document.cookie = `inspection_token=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
      localStorage.setItem("inspection_user", JSON.stringify(user));
      router.replace(returnTo);
    } catch (err: unknown) {
      setError(messageFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(145deg, #071428 0%, #0c1f3d 50%, #132a4a 100%)" }}>

      {/* ── يسار: نموذج ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2rem 2.5rem" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #8dc63f, #5a9a1a)", fontSize: 22, color: "white" }}>
            🔧
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: "white", fontSize: "1rem" }}>داسم فحص</p>
            <p style={{ margin: 0, color: "#a5b4fc", fontSize: "0.75rem" }}>DASM Inspection — نظام داخلي</p>
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ margin: "0 0 0.375rem", fontSize: "1.875rem", fontWeight: 800, color: "white" }}>تسجيل الدخول</h2>
          <p style={{ margin: "0 0 1.75rem", color: "rgba(165,180,252,0.45)", fontSize: "0.9rem" }}>منصة الفحص الفني للمركبات</p>

          {(googleClientId || appleClientId) && (
            <div style={{ marginBottom: "1.25rem" }}>
              <p style={{ margin: "0 0 0.75rem", textAlign: "center", fontSize: "0.75rem", color: "rgba(165,180,252,0.45)" }}>المتابعة عبر</p>
              <div style={{ display: "grid", gridTemplateColumns: googleClientId && appleClientId ? "1fr 1fr" : "1fr", gap: "0.625rem" }}>
                {googleClientId && (
                  <button
                    type="button" onClick={onGoogle} disabled={busy || !!socialBusy}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", height: 46, borderRadius: 12, background: "white", color: "#1f2937", fontWeight: 700, fontSize: "0.875rem", border: "1px solid rgba(255,255,255,0.15)", cursor: busy || socialBusy ? "not-allowed" : "pointer", opacity: busy || socialBusy ? 0.6 : 1 }}
                  >
                    {socialBusy === "google" ? (
                      <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                    )}
                    Google
                  </button>
                )}
                {appleClientId && (
                  <button
                    type="button" onClick={() => void onApple()} disabled={busy || !!socialBusy}
                    style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", height: 46, borderRadius: 12, background: "black", color: "white", fontWeight: 700, fontSize: "0.875rem", border: "1px solid rgba(255,255,255,0.15)", cursor: busy || socialBusy ? "not-allowed" : "pointer", opacity: busy || socialBusy ? 0.6 : 1 }}
                  >
                    {socialBusy === "apple" ? (
                      <svg style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.43-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.936 4.45z" /></svg>
                    )}
                    Apple
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.25rem 0 0" }}>
                <span style={{ flex: 1, height: 1, background: "rgba(99,102,241,0.15)" }} />
                <span style={{ fontSize: "0.75rem", color: "rgba(165,180,252,0.4)" }}>أو</span>
                <span style={{ flex: 1, height: 1, background: "rgba(99,102,241,0.15)" }} />
              </div>
            </div>
          )}

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "rgba(165,180,252,0.6)" }}>البريد الإلكتروني</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@dasm.com.sa"
                style={{ width: "100%", borderRadius: 12, padding: "0.8rem 1rem", fontSize: "0.9375rem", background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(99,102,241,0.25)", color: "white", outline: "none", boxSizing: "border-box" }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", fontSize: "0.875rem", color: "rgba(165,180,252,0.6)" }}>كلمة المرور</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPw ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} required placeholder="••••••••"
                  style={{ width: "100%", borderRadius: 12, padding: "0.8rem 1rem 0.8rem 2.75rem", fontSize: "0.9375rem", background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(99,102,241,0.25)", color: "white", outline: "none", boxSizing: "border-box" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.7)"; e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.1)"; }}
                  onBlur={(e)  => { e.currentTarget.style.borderColor = "rgba(99,102,241,0.25)"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: "absolute", left: "0.875rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "rgba(165,180,252,0.4)", padding: 0 }}>
                  {showPw
                    ? <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                    : <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ borderRadius: 12, padding: "0.75rem 1rem", fontSize: "0.875rem", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)", color: "#fca5a5" }}>{error}</div>
            )}

            <button
              type="submit" disabled={busy}
              style={{ width: "100%", padding: "0.9rem", borderRadius: 12, fontWeight: 700, fontSize: "1rem", color: "white", background: busy ? "rgba(141,198,63,0.35)" : "linear-gradient(135deg, #8dc63f, #5a9a1a)", border: "none", cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: busy ? 0.7 : 1 }}
            >
              {busy
                ? <><svg style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>جارٍ التحقق...</>
                : <>دخول ←</>}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <a href="/" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.8125rem", textDecoration: "none" }}>← الصفحة الرئيسية</a>
            {" · "}
            <a href="https://www.dasm.com.sa" style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.8125rem", textDecoration: "none" }}>منصّة داسم</a>
          </div>
        </div>
      </div>

      {/* ── يمين: لوحة الهوية (desktop) ── */}
      <div
        className="inspection-brand"
        style={{ width: "45%", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "3rem 2.5rem", gap: "1.5rem", background: "linear-gradient(145deg, #071428 0%, #0c1f3d 55%, #132a4a 100%)", display: "none", borderRight: "1px solid rgba(141,198,63,0.15)" }}
      >
        <div style={{ width: 88, height: 88, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #8dc63f, #5a9a1a)", fontSize: 44 }}>
          🔧
        </div>

        <div style={{ textAlign: "center" }}>
          <h1 style={{ margin: "0 0 0.25rem", fontSize: "2rem", fontWeight: 800, color: "white" }}>داسم فحص</h1>
          <p style={{ margin: 0, color: "#a5b4fc", fontSize: "0.8125rem", letterSpacing: "0.05em" }}>DASM INSPECTION — INTERNAL</p>
        </div>

        <svg viewBox="0 0 200 160" style={{ width: 220, height: 176, opacity: 0.9 }}>
          <rect x="20" y="85" width="160" height="45" rx="8" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
          <path d="M40 85 L55 60 L145 60 L160 85" fill="#312e81" stroke="#6366f1" strokeWidth="1.5" />
          <rect x="60" y="63" width="35" height="20" rx="3" fill="#0c0a1e" stroke="#818cf8" strokeWidth="1" />
          <rect x="105" y="63" width="35" height="20" rx="3" fill="#0c0a1e" stroke="#818cf8" strokeWidth="1" />
          <circle cx="55" cy="130" r="14" fill="#0c0a1e" stroke="#6366f1" strokeWidth="2" />
          <circle cx="55" cy="130" r="6" fill="#312e81" />
          <circle cx="145" cy="130" r="14" fill="#0c0a1e" stroke="#6366f1" strokeWidth="2" />
          <circle cx="145" cy="130" r="6" fill="#312e81" />
          <circle cx="160" cy="45" r="20" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1.5" />
          <path d="M153 45 L158 50 L168 40" stroke="#a5b4fc" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="140" y1="55" x2="155" y2="60" stroke="#6366f1" strokeWidth="1" strokeDasharray="3,2" />
        </svg>

        <h2 style={{ textAlign: "center", fontSize: "1.75rem", fontWeight: 800, color: "#a5b4fc", lineHeight: 1.3, margin: "0.25rem 0" }}>
          الفحص الفني<br />
          <span style={{ color: "white" }}>للمركبات الرقمي</span>
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem", width: "100%", maxWidth: 320 }}>
          {[
            { icon: "🔍", text: "فحص شامل موثّق عبر الورش المعتمدة" },
            { icon: "📋", text: "تقارير فنية فورية مع الصور والبيانات" },
            { icon: "🔒", text: "نظام داخلي — فريق داسم فقط" },
          ].map((f) => (
            <div key={f.text} style={{ display: "flex", alignItems: "center", gap: "0.75rem", borderRadius: 12, padding: "0.75rem 1rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(99,102,241,0.1)" }}>
              <span style={{ fontSize: "1.25rem" }}>{f.icon}</span>
              <span style={{ color: "rgba(199,210,254,0.6)", fontSize: "0.875rem" }}>{f.text}</span>
            </div>
          ))}
        </div>

        <p style={{ color: "rgba(79,70,229,0.4)", fontSize: "0.75rem", marginTop: "0.5rem" }}>داسم فحص — منظومة DASM</p>
      </div>

      <style>{`
        @media (min-width: 1024px) { .inspection-brand { display: flex !important; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
