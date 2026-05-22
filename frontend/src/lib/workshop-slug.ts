const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** يطابق منطق هجرة Postgres `inspection_slugify_workshop` (للاختبارات والإنشاء من التطبيق). */
export function workshopSlugFromName(name: string, workshopId: string): string {
  let s = name.trim().toLowerCase().replace(/[^a-zA-Z0-9]+/g, "-");
  s = s.replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
  if (s.length < 2) s = "workshop";
  const suffix = workshopId.replace(/-/g, "").slice(0, 8);
  return `${s.slice(0, 48)}-${suffix}`;
}

export function isWorkshopUuid(value: string): boolean {
  return UUID_RE.test(value.trim());
}
