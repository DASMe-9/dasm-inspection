export default function RequestsLoading() {
  return (
    <div className="space-y-4 animate-pulse" dir="rtl" aria-busy="true">
      <div className="h-8 w-40 rounded-lg bg-gray-200" />
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-10 w-full bg-gray-100 rounded-lg" />
        <div className="h-10 w-full bg-gray-100 rounded-lg" />
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
        <div className="h-24 w-full bg-gray-100 rounded-xl" />
        <div className="h-24 w-full bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}
