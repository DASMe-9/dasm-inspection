type Props = { compact?: boolean };

/** شعار فحص داسم — الرمز الرسمي للعلامة الفرعية + نص «فحص داسم» */
export function InspectionLogo({ compact }: Props) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      {/* الرمز ملوّن (كحلي + أخضر) فلا يوضع مباشرة على الخلفية الداكنة — بلاطة بيضاء */}
      <div
        className="flex shrink-0 items-center justify-center rounded-xl bg-white shadow-md ring-1 ring-white/15"
        style={{ width: compact ? 40 : 52, height: compact ? 40 : 52 }}
        aria-hidden
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/dasm-inspect.svg"
          alt=""
          className={compact ? "h-7 w-7" : "h-9 w-9"}
        />
      </div>
      <div className="min-w-0 leading-tight">
        <p
          className={`whitespace-nowrap font-extrabold text-white ${compact ? "text-sm sm:text-base" : "text-base md:text-lg"}`}
        >
          فحص داسم
        </p>
        <p
          className={`whitespace-nowrap font-medium text-white/70 ${compact ? "hidden text-[10px] sm:block" : "text-xs"}`}
        >
          DASM Vehicle Inspection
        </p>
      </div>
    </div>
  );
}
