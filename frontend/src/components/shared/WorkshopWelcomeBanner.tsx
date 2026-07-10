import { Mail, MapPin, Hash } from "lucide-react";
import type { InspectionShellContext } from "@/lib/auth/inspection-shell-context";

type Props = Pick<
  InspectionShellContext,
  "workshopWelcome" | "email" | "userCode" | "areaLabel" | "city"
>;

export function WorkshopWelcomeBanner({
  workshopWelcome,
  email,
  userCode,
  areaLabel,
  city,
}: Props) {
  if (!workshopWelcome) return null;

  const meta: { icon: typeof Mail; label: string; value: string; dir?: "ltr" }[] =
    [];
  if (email) {
    meta.push({ icon: Mail, label: "البريد", value: email, dir: "ltr" });
  }
  if (userCode) {
    meta.push({ icon: Hash, label: "الكود", value: userCode, dir: "ltr" });
  }
  if (areaLabel || city) {
    const location = [areaLabel, city].filter(Boolean).join(" · ");
    meta.push({ icon: MapPin, label: "الموقع", value: location });
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-[linear-gradient(135deg,#0B1E3A_0%,#12294a_100%)] px-5 py-5 shadow-md dark:border-white/10 md:px-6"
      dir="rtl"
      aria-labelledby="workshop-welcome-title"
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#1E74E8_0%,#2FBF4E_100%)]"
        aria-hidden
      />
      <p className="text-xs font-semibold text-sky-300">مرحباً بك</p>
      <h2
        id="workshop-welcome-title"
        className="mt-1 text-xl font-bold text-white md:text-2xl"
      >
        أهلاً ورشة:{" "}
        <span className="text-[#2FBF4E]">{workshopWelcome.workshopName}</span>
      </h2>

      {meta.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:gap-y-2">
          {meta.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.label}
                className="flex items-center gap-2 text-sm text-slate-200"
              >
                <Icon className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
                <span className="text-slate-400">{item.label}:</span>
                <span className="font-medium text-white" dir={item.dir}>
                  {item.value}
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
