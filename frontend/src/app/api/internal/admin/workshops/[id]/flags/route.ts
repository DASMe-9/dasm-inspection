import { NextRequest, NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * POST /api/internal/admin/workshops/[id]/flags
 *
 * كتابة إدارية مُنطاقة (اتجاه الكتابة المعتمد في «منصّة المزوّدين»): لوحة مسؤول Core
 * تنادي هذه النقطة لتغيير أعلام عرض الورشة فقط — والريبو يكتب صفّه بنفسه (ملكية
 * كاتب-واحد؛ Core لا يكتب قاعدة أجنبية مباشرة). محروسة بنفس التوكن الداخلي المشترك
 * (`DASM_INSPECTION_INTERNAL_PULL_TOKEN`) — نفس حارس مسار resync.
 *
 * allowlist صارمة: is_verified / is_featured / featured_program_label فقط.
 * لا تمسّ أي بيانات مالية أو تشغيلية أو حسّاسة.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const expected = process.env.DASM_INSPECTION_INTERNAL_PULL_TOKEN?.trim();
  if (!expected) {
    return NextResponse.json(
      { ok: false, message: "internal token not configured on inspection" },
      { status: 503 }
    );
  }

  const provided = request.headers.get("X-DASM-Internal-Token")?.trim();
  if (!provided || provided !== expected) {
    return NextResponse.json({ ok: false, message: "forbidden" }, { status: 403 });
  }

  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ ok: false, message: "missing workshop id" }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, message: "invalid json body" }, { status: 400 });
  }

  // allowlist صارمة — أعلام العرض فقط، لا أعمدة أخرى تُقبل مهما أُرسل.
  const patch: Record<string, unknown> = {};
  if (typeof body.is_verified === "boolean") {
    patch.is_verified = body.is_verified;
  }
  if (typeof body.is_featured === "boolean") {
    patch.is_featured = body.is_featured;
  }
  if (body.featured_program_label === null || typeof body.featured_program_label === "string") {
    patch.featured_program_label = body.featured_program_label;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { ok: false, message: "no allowed fields to update" },
      { status: 422 }
    );
  }

  const sb = requireAdminClient();
  const { data, error } = await sb
    .from("inspection_workshops")
    .update(patch)
    .eq("id", id)
    .select("id,is_verified,is_featured,featured_program_label")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ ok: false, message: "workshop not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data });
}
