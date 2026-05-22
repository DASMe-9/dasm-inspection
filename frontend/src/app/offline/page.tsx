import Link from "next/link";

export const metadata = {
  title: "غير متصل — داسم الفحص",
};

export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-[#0c1f3d] text-white"
      dir="rtl"
    >
      <p className="text-2xl font-bold">لا اتصال بالإنترنت</p>
      <p className="text-sm text-slate-300 max-w-md">
        يمكنك إعادة فتح لوحة الورشة عند عودة الشبكة. الصفحات التي زرتها مؤخراً قد
        تظهر من الذاكرة المؤقتة.
      </p>
      <Link
        href="/workshop"
        className="mt-2 rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
      >
        لوحة الورشة
      </Link>
    </div>
  );
}
