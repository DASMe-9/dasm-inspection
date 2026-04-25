"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const DASM_API = process.env.NEXT_PUBLIC_API_URL || "https://api.dasm.com.sa";
const ALLOWED_TYPES = ["admin", "super_admin"];

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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]   = useState("");
  const [pw, setPw]         = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy]     = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [denied, setDenied] = useState<any>(null);

  if (denied) return <AccessDenied type={denied.type} />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res  = await fetch(`${DASM_API}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.message ?? "تعذّر تسجيل الدخول");
      const token = body.data?.access_token ?? body.access_token;
      const user  = body.data?.user ?? body.user;
      if (!token || !user) throw new Error("استجابة غير متوقعة من الخادم");
      if (!ALLOWED_TYPES.includes(user.type)) { setDenied(user); return; }
      // حفظ التوكن في cookie + localStorage ليتوافق مع middleware المنصة
      document.cookie = `dasm_access_token=${token}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
      document.cookie = `inspection_token=${token}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`;
      localStorage.setItem("inspection_user", JSON.stringify(user));
      router.replace("/");
    } catch (err: any) {
      setError(err?.message || "تعذّر تسجيل الدخول");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(145deg, #020509 0%, #060d1a 50%, #0a1020 100%)" }}>

      {/* ── يسار: نموذج ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "2rem 2.5rem" }}>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #6366f1, #4f46e5)", fontSize: 22, color: "white" }}>
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
              style={{ width: "100%", padding: "0.9rem", borderRadius: 12, fontWeight: 700, fontSize: "1rem", color: "white", background: busy ? "rgba(99,102,241,0.35)" : "linear-gradient(135deg, #6366f1, #4f46e5)", border: "none", cursor: busy ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", opacity: busy ? 0.7 : 1 }}
            >
              {busy
                ? <><svg style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} fill="none" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>جارٍ التحقق...</>
                : <>دخول ←</>}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
            <a href="https://www.dasm.com.sa" style={{ color: "rgba(255,255,255,0.15)", fontSize: "0.8125rem", textDecoration: "none" }}>← العودة لمنصة داسم</a>
          </div>
        </div>
      </div>

      {/* ── يمين: لوحة الهوية (desktop) ── */}
      <div
        className="inspection-brand"
        style={{ width: "45%", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: "3rem 2.5rem", gap: "1.5rem", background: "linear-gradient(145deg, #020307 0%, #060d1a 55%, #0a1020 100%)", display: "none", borderRight: "1px solid rgba(99,102,241,0.08)" }}
      >
        <div style={{ width: 88, height: 88, borderRadius: 22, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #6366f1, #4f46e5)", fontSize: 44 }}>
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
