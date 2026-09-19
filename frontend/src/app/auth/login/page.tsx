"use client";

import { useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  CarFront,
  Eye,
  EyeOff,
  FileCheck2,
  Loader2,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { AuthCard, AuthShell } from "@/components/auth/AuthShell";
import { SocialLoginButtons } from "@/components/auth/SocialLoginButtons";
import { PUBLIC_BRAND } from "@/components/public-site";
import { platformTypeAllowedForInspectionLogin } from "@/lib/auth/platform-inspection-role";
import { setInspectionBrowserSession } from "@/lib/auth/inspection-browser-session";
import {
  startGoogleRedirectLogin,
  loginWithApple,
} from "@/lib/auth/inspection-social-auth";

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
    <AuthShell>
      <AuthCard>
        <div className="text-center">
          <span className="mx-auto mb-5 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/25 bg-red-500/10 text-red-300">
            <LockKeyhole className="h-8 w-8" aria-hidden />
          </span>
          <h1 className="text-xl font-extrabold">غير مخوّل</h1>
          <p className="mt-2 text-sm leading-7 text-white/60">
            حسابك ({type}) لا يملك صلاحية دخول منصة فحص داسم.
            <br />
            تواصل مع إدارة داسم لتفعيل الصلاحية.
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.clear();
              } catch {
                /* التخزين غير متاح */
              }
              window.location.href = "/auth/login";
            }}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-xl border border-white/20 bg-white/[0.06] text-sm font-bold text-white transition hover:bg-white/10"
          >
            العودة لتسجيل الدخول
          </button>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

function sanitizeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.includes("://")) {
    return "/dashboard";
  }
  if (raw === "/") return "/dashboard";
  return raw;
}

const FEATURES = [
  { Icon: ShieldCheck, text: "فحص شامل موثّق عبر الورش المعتمدة" },
  { Icon: FileCheck2, text: "تقارير فنية فورية مع الصور والبيانات" },
  { Icon: CarFront, text: "سجل فني موثّق دائم لكل مركبة" },
];

function BrandAside() {
  return (
    <div className="max-w-md">
      <h2 className="text-balance text-4xl font-black leading-[1.25] tracking-tight">
        الفحص الفني
        <span className="block" style={{ color: PUBLIC_BRAND.green }}>
          للمركبات الرقمي
        </span>
      </h2>
      <p className="mt-4 text-base leading-8 text-white/70">
        بوابة الورش المعتمدة وفريق الفحص وعملاء داسم — طلبات، تقارير، وسجل فني موثّق في مكان واحد.
      </p>
      <ul className="mt-8 space-y-3">
        {FEATURES.map(({ Icon, text }) => (
          <li
            key={text}
            className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.055] p-3.5"
          >
            <span
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"
              style={{ color: PUBLIC_BRAND.green }}
            >
              <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="text-sm font-semibold text-white/80">{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const INPUT =
  "h-12 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 text-base text-white placeholder:text-white/35 transition focus:border-[#2CCB66] focus:outline-none focus:ring-2 focus:ring-[#2CCB66]/30";

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
      // إغلاق نافذة Apple يرمي خطأً أيضاً؛ نعرض رسالة هادئة بدل الصمت.
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
      // كوكيز dasm_access_token + inspection_token (يقرؤها middleware) + inspection_user.
      setInspectionBrowserSession(token, user);
      router.replace(returnTo);
    } catch (err: unknown) {
      setError(messageFromUnknown(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell aside={<BrandAside />}>
      <AuthCard>
        <h1 className="text-2xl font-extrabold sm:text-3xl">تسجيل الدخول</h1>
        <p className="mb-6 mt-1.5 text-sm text-white/60">
          منصة الفحص الفني للمركبات — للورش والفريق والعملاء.
        </p>

        <SocialLoginButtons
          onGoogle={onGoogle}
          onApple={() => void onApple()}
          busy={socialBusy}
          disabled={busy}
        />

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="login-email" className="mb-1.5 block text-sm font-semibold text-white/80">
              البريد الإلكتروني
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              dir="ltr"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@dasm.com.sa"
              className={`${INPUT} text-left`}
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="login-password" className="block text-sm font-semibold text-white/80">
                كلمة المرور
              </label>
              <a
                href="https://www.dasm.com.sa/auth/forgot-password"
                className="text-xs font-semibold hover:underline"
                style={{ color: PUBLIC_BRAND.green }}
              >
                نسيت كلمة المرور؟
              </a>
            </div>
            <div className="relative">
              <input
                id="login-password"
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                dir="ltr"
                required
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="••••••••"
                className={`${INPUT} pr-12 text-left`}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                aria-pressed={showPw}
                className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/45 transition hover:text-white"
              >
                {showPw ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              aria-live="polite"
              className="flex items-start gap-2.5 rounded-xl border border-red-400/30 bg-red-500/10 p-3.5 text-sm text-red-200"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !!socialBusy}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-base font-extrabold text-white shadow-[0_14px_38px_rgba(44,203,102,0.24)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
            style={{ background: PUBLIC_BRAND.green }}
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                جارٍ التحقق…
              </>
            ) : (
              "دخول"
            )}
          </button>
        </form>
      </AuthCard>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageInner />
    </Suspense>
  );
}
