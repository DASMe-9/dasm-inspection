"use client";

export function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12" dir="rtl">
      <div className="animate-spin w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full" />
      <span className="sr-only">جاري التحميل</span>
    </div>
  );
}
