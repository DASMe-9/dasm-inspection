import type { ReportItemStatus } from "@/types";

/** بنود افتراضية تُنشأ مع التقرير عند «إرسال للمراجعة» — المصدر الموحّد للقالب قبل أي جدول قوالب لاحق. */
export type DefaultReportItemSeed = {
  section: string;
  label: string;
  status: ReportItemStatus;
  notes?: string;
  sort_order: number;
};

export const DEFAULT_REPORT_ITEMS: readonly DefaultReportItemSeed[] = [
  { section: "المحرك والناقل", label: "مستوى الزيت والتسريبات", status: "pass", sort_order: 0 },
  { section: "المحرك والناقل", label: "أحزمة المحرك (توقيت / دينمو / تكييف)", status: "pass", sort_order: 1 },
  { section: "المحرك والناقل", label: "حالة ناقل الحركة والزيت والاهتزاز", status: "warn", notes: "راجع خلال تجربة قصيرة على الطريق", sort_order: 2 },
  { section: "الكهرباء والتحذيرات", label: "أضواء لوحة القيادة (فحص OBD إن وجد)", status: "warn", notes: "سجّل أي أكواد أو تحذيرات ثابتة", sort_order: 3 },
  { section: "الهيكل والطلاء", label: "الهيكل الخارجي والصدأ والدهان والحواف", status: "pass", sort_order: 4 },
  { section: "الفرامل والتعليق", label: "أقراص ووسادات أمامية وخلفية", status: "fail", notes: "يُقيَّم وفق عمق وتشققات وفق دليل الشركة المصنعة", sort_order: 5 },
  { section: "الفرامل والتعليق", label: "تعليق ومساعدات وروابط وأذرعة", status: "pass", sort_order: 6 },
  { section: "الإطارات والعجلات", label: "عمق المداس والضغط وجنوط / موازنة", status: "pass", sort_order: 7 },
  { section: "الداخلية والسلامة", label: "الوسائد والأحزمة وأقفال الأبواب", status: "pass", sort_order: 8 },
  { section: "الزجاج والرؤية", label: "زجاج أمامي / مرايا / مسّاحات", status: "na", notes: "صنف كـ لا ينطبق إن لم تُختبر قطع الزجاج", sort_order: 9 },
];
