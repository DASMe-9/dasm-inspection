export const MEASUREMENT_ID = "G-0W5317TLNM";
export const SERVICE = "inspection";
const HOSTS = new Set(["inspect.dasm.com.sa", "inspection.dasm.com.sa"]);
const ROUTES = new Set(["/", "/about", "/privacy", "/terms", "/workshops"]);

/** Only fixed route labels leave the browser; never query strings or identifiers. */
export function safeAnalyticsPage(hostname: string, pathname: string | null) {
  if (!HOSTS.has(hostname) || !pathname) return null;
  const path = pathname.split(/[?#]/, 1)[0].replace(/\/$/, "") || "/";
  const route = ROUTES.has(path) ? path : new RegExp("^/workshops/(?!apply$)[^/]+$").test(path) ? "/workshops/:slug" : null;
  return route ? { page_location: `https://${hostname}${route}`, page_title: "داسم الفحص", dasm_service: SERVICE } : null;
}

export function safeReferrer(referrer: string) {
  try {
    const url = new URL(referrer);
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : "";
  } catch { return ""; }
}

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  "ga-disable-G-0W5317TLNM"?: boolean;
};
let initialized = false;
let lastPath: string | null = null;

export function disableServiceAnalytics() {
  (window as AnalyticsWindow)["ga-disable-G-0W5317TLNM"] = true;
}

export function updateServiceAnalytics(pathname: string | null) {
  const target = window as AnalyticsWindow;
  const optedOut = (window.navigator as Navigator & { globalPrivacyControl?: boolean })?.globalPrivacyControl === true;
  const page = optedOut ? null : safeAnalyticsPage(window.location.hostname, pathname);
  if (!page) {
    disableServiceAnalytics();
    lastPath = null;
    return;
  }
  // An unexpected second installation is not a reason to send duplicate events.
  if (!initialized && document.querySelector('script[src*="googletagmanager.com/"]')) return;
  const context = { ...page, page_referrer: safeReferrer(document.referrer) };
  target["ga-disable-G-0W5317TLNM"] = false;
  if (!initialized) {
    target.dataLayer = target.dataLayer || [];
    // Preserve the Arguments queue shape used by the canonical Google tag snippet.
    // eslint-disable-next-line prefer-rest-params
    target.gtag = function () { target.dataLayer!.push(arguments); };
    target.gtag("consent", "default", { ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    target.gtag("set", context);
    target.gtag("js", new Date());
    target.gtag("config", MEASUREMENT_ID, { ...context, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false });
    const script = document.createElement("script");
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
    document.head.appendChild(script);
    initialized = true;
  } else {
    target.gtag?.("set", context);
  }
  if (lastPath !== pathname) {
    target.gtag?.("event", "page_view", { ...context, send_to: MEASUREMENT_ID });
    lastPath = pathname;
  }
}
