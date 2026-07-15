import { NextRequest, NextResponse } from "next/server";
import { DASM_API_URL } from "@/lib/api/inspection-http-auth";
import {
  setInspectionGatewayCookies,
  setInspectionSessionCookies,
} from "@/lib/cookies/set-inspection-gateway-cookies";
import {
  platformTypeAllowedForInspectionLogin,
  resolveInspectionRoleFromPlatformUser,
} from "@/lib/auth/platform-inspection-role";

const SSO_PLATFORM = "inspection";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

type SsoVerifyUser = {
  id: number | string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  type?: string | null;
  avatar_url?: string | null;
  organization_id?: number | string | null;
};

export async function POST(request: NextRequest) {
  let body: { sso_token?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "بيانات غير صالحة" },
      { status: 400 }
    );
  }

  const ssoToken = body.sso_token?.trim();
  if (!ssoToken) {
    return NextResponse.json(
      { success: false, message: "sso_token مطلوب" },
      { status: 400 }
    );
  }

  const verifyRes = await fetch(
    `${normalizeBaseUrl(DASM_API_URL)}/api/sso/verify`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sso_token: ssoToken,
        platform: SSO_PLATFORM,
      }),
      cache: "no-store",
    }
  );

  const verifyBody = await verifyRes.json().catch(() => ({}));

  if (!verifyRes.ok || !verifyBody?.success) {
    return NextResponse.json(
      {
        success: false,
        message: verifyBody?.message ?? "فشل التحقق من توكن SSO",
      },
      { status: verifyRes.status === 401 ? 401 : 502 }
    );
  }

  const accessToken = verifyBody?.data?.access_token as string | undefined;
  const user = verifyBody?.data?.user as SsoVerifyUser | undefined;

  if (!accessToken || user?.id == null) {
    return NextResponse.json(
      { success: false, message: "استجابة SSO غير مكتملة من المنصّة" },
      { status: 502 }
    );
  }

  const userType = String(user.type ?? "");
  if (!platformTypeAllowedForInspectionLogin(userType)) {
    return NextResponse.json(
      {
        success: false,
        message: "نوع الحساب غير مخوّل لمنصة الفحص",
        code: "forbidden_type",
        user_type: userType || "unknown",
      },
      { status: 403 }
    );
  }

  const inspectionRole = resolveInspectionRoleFromPlatformUser({
    type: userType,
  });

  const res = NextResponse.json({
    success: true,
    data: {
      access_token: accessToken,
      user,
      inspection_role: inspectionRole,
    },
  });

  // Set the protected-layout token cookies in the same server response that
  // completes the one-time exchange. This removes the client-cookie race that
  // could briefly bounce a valid SSO login to /auth/login.
  setInspectionSessionCookies(res, accessToken);
  setInspectionGatewayCookies(res, String(user.id), inspectionRole);

  return res;
}
