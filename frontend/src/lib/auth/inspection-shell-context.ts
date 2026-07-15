/** بيانات القشرة (navbar + ترحيب) — تُمرَّر من الخادم إلى AppShell. */
export type InspectionShellContext = {
  /** اسم الشخص (first + last) */
  personDisplayName: string;
  email: string | null;
  userCode: string | null;
  /** المنطقة من التسجيل */
  areaLabel: string | null;
  /** المدينة من التسجيل أو الورشة */
  city: string | null;
  /** ملف الشخص على منصة داسم الأم */
  coreProfileUrl: string;
  /** إعدادات الورشة (كانت ملف الورشة) — مالك/مدير ورشة */
  workshopProfileHref: string | null;
  /** الصفحة العامة للورشة على inspect */
  workshopPublicHref: string | null;
  /** ترحيب الورشة — يظهر لمالك/مدير الورشة فقط */
  workshopWelcome: {
    workshopId: string;
    workshopName: string;
  } | null;
};
