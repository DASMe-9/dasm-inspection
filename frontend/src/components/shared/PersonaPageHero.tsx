import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export type PersonaHeroVariant = "customer" | "workshop" | "inspector" | "neutral";

type HeroAction = {
  href: string;
  label: string;
  primary?: boolean;
};

type HeroStat = {
  label: string;
  value: string;
};

type Props = {
  variant?: PersonaHeroVariant;
  eyebrow: string;
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: HeroAction[];
  stats?: HeroStat[];
};

const ACCENT_BAR =
  "pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1E74E8_0%,#2FBF4E_100%)]";

export function PersonaPageHero({
  variant = "neutral",
  eyebrow,
  title,
  description,
  icon: Icon,
  actions = [],
  stats = [],
}: Props) {
  const eyebrowTone =
    variant === "customer"
      ? "text-sky-300"
      : variant === "inspector"
        ? "text-emerald-300"
        : "text-sky-300";

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,#0B1E3A_0%,#12294a_100%)] p-6 shadow-md md:p-8"
      aria-labelledby="persona-page-hero-title"
    >
      <div className={ACCENT_BAR} aria-hidden />
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <p className={`text-xs font-semibold ${eyebrowTone}`}>{eyebrow}</p>
          <h1
            id="persona-page-hero-title"
            className="mt-1 flex items-center gap-2 text-2xl font-bold text-white md:text-3xl"
          >
            {Icon ? <Icon className="h-7 w-7 shrink-0 text-[#2FBF4E]" aria-hidden /> : null}
            {title}
          </h1>
          {description ? (
            <p className="mt-2 text-sm leading-relaxed text-slate-300 md:text-base">
              {description}
            </p>
          ) : null}
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-2 md:justify-end">
            {actions.map((action) => (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={
                  action.primary
                    ? "inline-flex items-center justify-center rounded-xl bg-[linear-gradient(135deg,#1E74E8_0%,#2FBF4E_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90"
                    : "inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {stats.length > 0 ? (
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5"
            >
              <dt className="text-[11px] text-slate-400">{stat.label}</dt>
              <dd className="mt-0.5 text-lg font-bold text-white">{stat.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </section>
  );
}
