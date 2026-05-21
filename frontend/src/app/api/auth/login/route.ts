import { NextRequest, NextResponse } from "next/server";

const DASM_API =
  process.env.DASM_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.dasm.com.sa";

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { message: "بيانات تسجيل الدخول غير صالحة" },
      { status: 400 }
    );
  }

  const res = await fetch(`${normalizeBaseUrl(DASM_API)}/api/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const body = await res.json().catch(() => ({}));

  return NextResponse.json(body, { status: res.status });
}
