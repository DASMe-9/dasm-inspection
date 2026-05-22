import type { InspectionRequest } from "@/types";

/** تاريخ التقويم لطلب ميداني (يوم واحد YYYY-MM-DD). */
export function fieldJobCalendarDate(
  request: Pick<
    InspectionRequest,
    "fieldScheduledAt" | "dispatchedAt" | "createdAt"
  >
): string {
  const raw =
    request.fieldScheduledAt ?? request.dispatchedAt ?? request.createdAt;
  return raw.slice(0, 10);
}

export function hasFieldMapCoordinates(
  request: Pick<InspectionRequest, "fieldServiceLat" | "fieldServiceLng">
): boolean {
  return (
    request.fieldServiceLat != null &&
    request.fieldServiceLng != null &&
    Number.isFinite(request.fieldServiceLat) &&
    Number.isFinite(request.fieldServiceLng)
  );
}

export function openStreetMapSearchUrl(query: string): string {
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(query)}`;
}

export function openStreetMapPinUrl(lat: number, lng: number): string {
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=16/${lat}/${lng}`;
}

export function openStreetMapEmbedUrl(lat: number, lng: number): string {
  const pad = 0.02;
  const bbox = `${lng - pad},${lat - pad},${lng + pad},${lat + pad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat},${lng}`;
}

/** أيام متتالية من اليوم (محلي) بصيغة YYYY-MM-DD. */
export function calendarDayRange(start: Date, count: number): string[] {
  const days: string[] = [];
  const d = new Date(start);
  d.setHours(12, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const copy = new Date(d);
    copy.setDate(d.getDate() + i);
    days.push(copy.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}

export function groupFieldJobsByDay(
  requests: InspectionRequest[]
): Map<string, InspectionRequest[]> {
  const map = new Map<string, InspectionRequest[]>();
  for (const r of requests) {
    const key = fieldJobCalendarDate(r);
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  }
  return map;
}
