import { PUBLIC_BRAND } from "./brand-tokens";

type Props = { compact?: boolean };

/** شعار مبسّط بأسلوب سداسي (مرجع MVPI) */
export function InspectionLogo({ compact }: Props) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      <div
        className="relative flex shrink-0 items-center justify-center rounded-xl shadow-md ring-1 ring-white/15"
        style={{
          width: compact ? 40 : 52,
          height: compact ? 40 : 52,
          background: `linear-gradient(145deg, ${PUBLIC_BRAND.green} 0%, ${PUBLIC_BRAND.greenDark} 100%)`,
        }}
        aria-hidden
      >
        <svg
          viewBox="0 0 32 32"
          className={compact ? "h-6 w-6" : "h-8 w-8"}
          fill="none"
        >
          <path
            d="M6 20h20l-2.5-8H8.5L6 20z"
            fill={PUBLIC_BRAND.navyDeep}
            opacity="0.9"
          />
          <circle cx="10" cy="22" r="2.5" fill={PUBLIC_BRAND.navyDeep} />
          <circle cx="22" cy="22" r="2.5" fill={PUBLIC_BRAND.navyDeep} />
          <path
            d="M9 12h14"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
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
