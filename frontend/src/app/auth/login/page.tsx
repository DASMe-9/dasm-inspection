"use client";

import { Shield, Wrench } from "lucide-react";

const DASM_URL = process.env.NEXT_PUBLIC_DASM_URL || "https://dasm.com.sa";

export default function LoginPage() {
  const handleLoginViaDasm = () => {
    const callbackUrl = `${window.location.origin}/auth/callback`;
    const returnUrl = encodeURIComponent(callbackUrl);
    window.location.href = `${DASM_URL}/auth/sso?platform=inspection&return_url=${returnUrl}`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center mb-4">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">داسم فحص</h1>
          <p className="text-sm text-gray-500 mt-1">
            الفحص الفني للمركبات عبر الورش المعتمدة
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 mb-5">
          <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-blue-900">
              تسجيل دخول موحد مع داسم
            </p>
            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
              حسابك في داسم يتيح لك استخدام كل الخدمات
            </p>
          </div>
        </div>

        <button
          onClick={handleLoginViaDasm}
          className="w-full h-11 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2"
        >
          <Shield className="w-4 h-4" />
          تسجيل الدخول عبر داسم
        </button>

        <p className="text-xs text-center text-gray-500 pt-4">
          ما عندك حساب في داسم؟{" "}
          <a
            href={`${DASM_URL}/auth/register`}
            className="text-indigo-600 font-medium hover:underline"
          >
            سجل الآن
          </a>
        </p>
      </div>
    </div>
  );
}
