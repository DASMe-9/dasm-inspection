export default function WorkshopLoading() {
  return (
    <div className="animate-pulse space-y-5" dir="rtl" aria-label="جارٍ تحميل مركز قيادة الورشة">
      <div className="h-40 rounded-[28px] bg-slate-200 dark:bg-slate-800" />
      <div className="h-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[420px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-[420px] rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}
