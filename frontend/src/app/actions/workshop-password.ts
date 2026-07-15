"use server";

import { DASM_API_URL } from "@/lib/api/inspection-http-auth";
import { getInspectionBearerToken } from "@/lib/auth/inspection-session-token.server";

export type ChangePasswordResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

export async function changeWorkshopAccountPasswordAction(
  formData: FormData
): Promise<ChangePasswordResult> {
  const currentPassword = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");
  // Core يتطلّب password_confirmation — نطابقه تلقائياً دون حقل تأكيد في الواجهة.
  const passwordConfirmation = password;

  if (password.length < 8) {
    return { ok: false, message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل." };
  }
  if (!currentPassword.trim()) {
    return { ok: false, message: "أدخل كلمة المرور الحالية." };
  }

  const token = await getInspectionBearerToken();
  if (!token) {
    return { ok: false, message: "انتهت الجلسة — سجّل الدخول من جديد." };
  }

  try {
    const res = await fetch(`${DASM_API_URL}/api/user/password`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        current_password: currentPassword,
        password,
        password_confirmation: passwordConfirmation,
      }),
      cache: "no-store",
    });

    const data = (await res.json().catch(() => null)) as {
      success?: boolean;
      message?: string;
      code?: string;
    } | null;

    if (!res.ok) {
      return {
        ok: false,
        message:
          data?.message?.trim() ||
          (res.status === 401
            ? "انتهت الجلسة — سجّل الدخول من جديد."
            : "تعذّر تحديث كلمة المرور."),
      };
    }

    return {
      ok: true,
      message: data?.message?.trim() || "تم تحديث كلمة المرور.",
    };
  } catch {
    return { ok: false, message: "تعذّر الاتصال بخدمة الحساب. حاول لاحقاً." };
  }
}

export async function requestWorkshopPasswordResetAction(): Promise<ChangePasswordResult> {
  const token = await getInspectionBearerToken();
  if (!token) {
    return { ok: false, message: "انتهت الجلسة — سجّل الدخول من جديد." };
  }

  try {
    const profileRes = await fetch(`${DASM_API_URL}/api/user/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });
    if (!profileRes.ok) {
      return { ok: false, message: "تعذّر قراءة بريد الحساب لإرسال رابط الاستعادة." };
    }
    const profileJson = (await profileRes.json()) as {
      data?: { email?: string };
      email?: string;
    };
    const email =
      profileJson?.data?.email?.trim() || profileJson?.email?.trim() || "";
    if (!email) {
      return {
        ok: false,
        message: "لا يوجد بريد مرتبط بالحساب لإرسال رابط استعادة كلمة المرور.",
      };
    }

    const res = await fetch(`${DASM_API_URL}/api/forgot-password`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
      cache: "no-store",
    });
    const data = (await res.json().catch(() => null)) as {
      message?: string;
      success?: boolean;
    } | null;

    if (!res.ok) {
      return {
        ok: false,
        message: data?.message?.trim() || "تعذّر إرسال رابط استعادة كلمة المرور.",
      };
    }

    return {
      ok: true,
      message:
        data?.message?.trim() ||
        "إن وُجد الحساب، سيصلك رابط استعادة كلمة المرور على بريدك.",
    };
  } catch {
    return { ok: false, message: "تعذّر الاتصال بخدمة الحساب. حاول لاحقاً." };
  }
}
