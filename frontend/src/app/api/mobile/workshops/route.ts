import { NextResponse } from "next/server";
import { listMobileWorkshops } from "@/lib/api/mobile-inspection-http";

// يقرأ من قاعدة الخدمات وقت الطلب. بدون هذا يُصيَّر المسار ثابتاً وقت البناء
// (GET بلا مدخلات ديناميكية) فتتجمّد قائمة الورش على لقطة آخر نشر ولا تعكس
// أي تحديث في قاعدة البيانات إلا بإعادة نشر. Cache-Control أدناه يبقي تخفيف
// الحمل على الحافة (حتى دقيقتين) وهو كافٍ لقائمة عامة.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/mobile/workshops
 *
 * دليل الورش المعتمدة للتطبيق (Bearer اختياري — القائمة عامة).
 */
export async function GET() {
  const workshops = await listMobileWorkshops();
  return NextResponse.json(
    { workshops },
    { headers: { "Cache-Control": "public, max-age=120" } }
  );
}
