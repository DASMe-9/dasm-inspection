"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Award,
  BadgeCheck,
  Building2,
  ClipboardList,
  Clock,
  ExternalLink,
  GraduationCap,
  Images,
  LogIn,
  Mail,
  MapPin,
  Phone,
  Sparkles,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { WorkshopPricingBadges } from "@/components/inspection/WorkshopPricingBadges";
import { SectionCard } from "@/components/shared";
import type { WorkshopPublicProfile } from "@/lib/workshop-public-profile";
import type { WorkshopEducationalVideo } from "@/types";
import { TOKENS } from "@/lib/theme";

const HARAJ_LABELS: Record<string, string> = {
  haraj_live: "حراج مباشر",
  instant: "سوق فوري",
  delayed: "سوق مؤجّل",
  fixed: "سعر ثابت",
  rejected: "غير مؤهل",
};

type TabId = "home" | "gallery" | "repairs" | "education";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "الرئيسية", icon: Sparkles },
  { id: "gallery", label: "صور الورشة", icon: Images },
  { id: "repairs", label: "أعمال الإصلاح", icon: Wrench },
  { id: "education", label: "تثقيفي", icon: GraduationCap },
];

function toVideoEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
      return url;
    }
  } catch {
    return null;
  }
  return null;
}

function MediaGrid({ urls, emptyLabel }: { urls: string[]; emptyLabel: string }) {
  if (urls.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center text-sm text-gray-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {urls.map((url) => (
        <a
          key={url}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-gray-100 bg-gray-100"
        >
          <img
            src={url}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </a>
      ))}
    </div>
  );
}

function VideoGrid({
  videos,
  emptyLabel,
}: {
  videos: WorkshopEducationalVideo[];
  emptyLabel: string;
}) {
  if (videos.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-16 text-center text-sm text-gray-400">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {videos.map((video) => {
        const embed = toVideoEmbedUrl(video.videoUrl);
        const isDirect = embed && /\.(mp4|webm|mov)(\?|$)/i.test(embed);

        return (
          <article
            key={video.id}
            className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
          >
            <div className="aspect-video bg-gray-900">
              {embed ? (
                isDirect ? (
                  <video
                    src={embed}
                    controls
                    className="h-full w-full object-cover"
                    poster={video.thumbnailUrl}
                  />
                ) : (
                  <iframe
                    src={embed}
                    title={video.title}
                    className="h-full w-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                )
              ) : video.thumbnailUrl ? (
                <a href={video.videoUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </a>
              ) : (
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full items-center justify-center text-sm text-white/80 hover:text-white"
                >
                  مشاهدة الفيديو
                  <ExternalLink className="mr-1 h-4 w-4" aria-hidden />
                </a>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-bold text-gray-900">{video.title}</h3>
              {video.description && (
                <p className="mt-1 text-sm text-gray-600">{video.description}</p>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export function WorkshopPublicProfileView({
  profile,
}: {
  profile: WorkshopPublicProfile;
}) {
  const { primary, accent, secondary } = TOKENS.colors.roles.workshop;
  const [tab, setTab] = useState<TabId>("home");

  const hasShowcase =
    profile.galleryUrls.length > 0 ||
    profile.repairShowcaseUrls.length > 0 ||
    profile.educationalVideos.length > 0;

  return (
    <div className="space-y-8" dir="rtl">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
        <Link href="/workshops" className="inline-flex min-h-11 items-center font-medium transition hover:text-[#1E74E8]">
          الورش
        </Link>
        <span className="text-gray-300">/</span>
        <span className="truncate font-semibold text-gray-900">{profile.name}</span>
      </nav>

      <section
        className="relative overflow-hidden rounded-3xl border border-violet-100/90 bg-gradient-to-bl from-white via-violet-50/40 to-white shadow-sm ring-1 ring-violet-100/70"
        aria-labelledby="workshop-public-title"
      >
        {profile.coverUrl && (
          <div
            className="h-36 w-full bg-cover bg-center md:h-44"
            style={{ backgroundImage: `url(${profile.coverUrl})` }}
            role="img"
            aria-label={`غلاف ${profile.name}`}
          />
        )}
        <div className="relative p-6 md:p-8">
          <div
            className="pointer-events-none absolute -left-24 top-0 h-40 w-40 rounded-full opacity-35 blur-3xl"
            style={{ background: `radial-gradient(circle, ${primary}55, transparent 70%)` }}
          />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex min-w-0 flex-1 gap-4">
              {profile.logoUrl ? (
                <img
                  src={profile.logoUrl}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-2xl border border-white object-cover shadow-md"
                />
              ) : (
                <span
                  className="mt-1 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-white shadow-md"
                  style={{ background: `linear-gradient(135deg, ${primary}, ${accent})` }}
                >
                  <Building2 className="h-7 w-7" aria-hidden />
                </span>
              )}
              <div className="min-w-0">
                <h1
                  id="workshop-public-title"
                  className="text-2xl font-bold text-gray-900 md:text-3xl"
                >
                  {profile.name}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
                  <MapPin className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
                  {profile.city}
                </p>
                {profile.ratingSummary && (
                  <p className="mt-2 flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden />
                      {profile.ratingSummary.average}
                    </span>
                    <span className="text-gray-500">
                      ({profile.ratingSummary.count} تقييم)
                    </span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto md:flex-col md:items-stretch">
              <Link
                href={`/auth/login?returnTo=${encodeURIComponent("/requests")}`}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-gray-800"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                تسجيل الدخول لطلب فحص
              </Link>
              <Link
                href="/workshops/apply"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 bg-white px-5 py-3 text-sm font-semibold shadow-sm transition hover:bg-violet-50"
                style={{ borderColor: primary, color: primary }}
              >
                <ClipboardList className="h-4 w-4" aria-hidden />
                انضم كورشة شريكة
              </Link>
            </div>
          </div>

          <div className="relative mt-4 flex flex-wrap gap-2">
            {profile.isVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-900 ring-1 ring-emerald-100">
                <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                معتمد في منظومة داسم
              </span>
            ) : (
              <span className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-100">
                قيد اعتماد داسم — التفاصيل محدودة
              </span>
            )}
            {profile.isFeatured && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-900 ring-1 ring-violet-200">
                <Award className="h-3.5 w-3.5" aria-hidden />
                {profile.featuredProgramLabel ?? "برنامج مميز"}
              </span>
            )}
            {profile.stats.approvedInspectionCount > 0 && (
              <span
                className="inline-flex rounded-full bg-white/90 px-3 py-1 text-xs font-medium ring-1 ring-gray-100"
                style={{ color: secondary }}
              >
                {profile.stats.approvedInspectionCount} فحص معتمد
              </span>
            )}
          </div>

          {profile.description && (
            <p className="relative mt-4 max-w-3xl text-sm leading-relaxed text-gray-700">
              {profile.description}
            </p>
          )}
        </div>
      </section>

      {hasShowcase && (
        <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-100 bg-white p-2 shadow-sm">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                tab === id
                  ? "bg-violet-700 text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "gallery" && (
        <SectionCard title="صور الورشة">
          <MediaGrid urls={profile.galleryUrls} emptyLabel="لم تُضف صور للورشة بعد." />
        </SectionCard>
      )}

      {tab === "repairs" && (
        <SectionCard title="أعمال الإصلاح">
          <MediaGrid
            urls={profile.repairShowcaseUrls}
            emptyLabel="لم تُضف صور إصلاح بعد."
          />
        </SectionCard>
      )}

      {tab === "education" && (
        <SectionCard title="محتوى تثقيفي">
          <VideoGrid
            videos={profile.educationalVideos}
            emptyLabel="لم تُضف فيديوهات تثقيفية بعد."
          />
        </SectionCard>
      )}

      {tab === "home" && (
        <>
          {profile.pricing && (
            <SectionCard title="أسعار الفحص (تقديرية)">
              <p className="mb-3 text-xs text-gray-600">
                الأسعار المرجعية قبل تأكيد الورشة؛ قد تختلف حسب المركبة والمنطقة.
              </p>
              <WorkshopPricingBadges pricing={profile.pricing} />
            </SectionCard>
          )}

          {profile.stats.recentInspections.length > 0 && (
            <SectionCard title="سجل الفحوصات المعتمدة">
              <p className="mb-4 text-xs text-gray-500">
                عينة من آخر الفحوصات المنجزة — بدون بيانات شخصية للعملاء.
              </p>
              <ul className="space-y-3">
                {profile.stats.recentInspections.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm"
                  >
                    <span className="font-medium text-gray-900">{item.vehicleLabel}</span>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600">
                      {item.finalScore != null && (
                        <span>الدرجة: {item.finalScore}</span>
                      )}
                      {item.harajPath && (
                        <span>{HARAJ_LABELS[item.harajPath] ?? item.harajPath}</span>
                      )}
                      <span>
                        {new Date(item.approvedAt).toLocaleDateString("ar-SA")}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </SectionCard>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <SectionCard title="جهات الاتصال">
              {!profile.isVerified ? (
                <p className="text-sm text-gray-600">
                  تُعرض بيانات الاتصال بعد اعتماد الورشة في منظومة داسم.
                </p>
              ) : (
                <ul className="space-y-4 text-sm">
                  {profile.phone && (
                    <li className="flex gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[#1E74E8]"
                        aria-hidden
                      >
                        <Phone className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-medium text-gray-500">هاتف</p>
                        <a
                          href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                          className="inline-flex min-h-11 items-center font-semibold text-gray-900 hover:text-[#1E74E8]"
                        >
                          {profile.phone}
                        </a>
                      </div>
                    </li>
                  )}
                  {profile.whatsapp && (
                    <li className="flex gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                        WA
                      </span>
                      <div>
                        <p className="text-xs font-medium text-gray-500">واتساب</p>
                        <a
                          href={`https://wa.me/${profile.whatsapp.replace(/\D/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex min-h-11 items-center gap-1 font-semibold text-gray-900 hover:text-emerald-700"
                        >
                          {profile.whatsapp}
                          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                      </div>
                    </li>
                  )}
                  {profile.email && (
                    <li className="flex gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-[#1E74E8]"
                        aria-hidden
                      >
                        <Mail className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-gray-500">بريد</p>
                        <a
                          href={`mailto:${profile.email}`}
                          className="inline-flex min-h-11 items-center break-all font-semibold text-gray-900 hover:text-[#1E74E8]"
                        >
                          {profile.email}
                        </a>
                      </div>
                    </li>
                  )}
                  {profile.instagram && (
                    <li className="flex gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-pink-600 text-xs font-bold"
                        aria-hidden
                      >
                        IG
                      </span>
                      <div>
                        <p className="text-xs font-medium text-gray-500">إنستغرام</p>
                        <span className="font-semibold text-gray-900">{profile.instagram}</span>
                      </div>
                    </li>
                  )}
                  {profile.workingHours && (
                    <li className="flex gap-3">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600"
                        aria-hidden
                      >
                        <Clock className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs font-medium text-gray-500">ساعات العمل</p>
                        <p className="font-semibold text-gray-900">{profile.workingHours}</p>
                      </div>
                    </li>
                  )}
                  {profile.mapLink && (
                    <li>
                      <a
                        href={profile.mapLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-[#1E74E8] hover:underline"
                      >
                        <MapPin className="h-4 w-4" aria-hidden />
                        الموقع / GPS
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                      </a>
                    </li>
                  )}
                  {!profile.phone &&
                    !profile.email &&
                    !profile.whatsapp &&
                    !profile.instagram && (
                      <p className="text-sm text-gray-600">لا توجد جهات اتصال منشورة حالياً.</p>
                    )}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="الفريق الميداني">
              {profile.inspectors.length === 0 ? (
                <p className="text-sm text-gray-600">لا مفتشين مرتبطين بهذه الورشة حالياً.</p>
              ) : (
                <ul className="space-y-3">
                  {profile.inspectors.map((i) => (
                    <li
                      key={i.id}
                      className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/50 px-3 py-2.5 font-medium text-gray-900"
                    >
                      <Users className="h-4 w-4 text-violet-600" aria-hidden />
                      {i.fullName}
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-violet-200 bg-violet-50/30 px-4 py-3 text-sm text-gray-700">
        <span>لطلب فحص أو متابعة طلباتك سجّل الدخول بحساب داسم.</span>
        <Link
          href="/auth/login"
          className="inline-flex min-h-11 items-center gap-1 font-semibold transition hover:opacity-90"
          style={{ color: primary }}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          الدخول
        </Link>
      </div>
    </div>
  );
}
