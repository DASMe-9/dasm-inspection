"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const DASM_API_URL =
  process.env.NEXT_PUBLIC_DASM_URL || "https://dasm.com.sa";

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const ssoToken = searchParams.get("sso_token");
    const error = searchParams.get("sso_error");

    if (error) {
      setStatus("error");
      setMessage(error === "cancelled" ? "تم إلغاء العملية" : "حدث خطأ");
      return;
    }

    if (!ssoToken) {
      setStatus("error");
      setMessage("لا يوجد توكن");
      return;
    }

    verifySsoToken(ssoToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifySsoToken(ssoToken: string) {
    try {
      const res = await fetch(`${DASM_API_URL}/api/sso/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sso_token: ssoToken,
          platform: "inspection",
        }),
      });

      const data = await res.json();

      if (!data?.success) {
        throw new Error(data?.message || "فشل التحقق");
      }

      // تخزين بيانات المستخدم في cookie + localStorage
      document.cookie = `inspection_token=${ssoToken}; path=/; max-age=${60 * 60 * 8}; SameSite=Lax; Secure`;
      localStorage.setItem("inspection_user", JSON.stringify(data.data.user));

      setStatus("success");
      setTimeout(() => router.push("/"), 800);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setStatus("error");
      setMessage(error.message || "فشل التحقق من التوكن");
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-slate-50 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white border rounded-2xl p-8 text-center shadow-lg">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mx-auto mb-4" />
            <h2 className="font-semibold mb-2">جاري التحقق...</h2>
            <p className="text-sm text-gray-500">
              يتم تسجيل دخولك في داسم فحص
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h2 className="font-semibold mb-2">تم تسجيل الدخول</h2>
            <p className="text-sm text-gray-500">أهلاً بك في داسم فحص</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="font-semibold mb-2">خطأ</h2>
            <p className="text-sm text-gray-500 mb-4">{message}</p>
            <button
              onClick={() => router.push("/auth/login")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
            >
              حاول مرة أخرى
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
