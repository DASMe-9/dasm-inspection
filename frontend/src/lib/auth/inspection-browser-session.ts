/** Client-side session cookies + localStorage after login or SSO. */

export type InspectionSessionUser = {
  id: number | string;
  email?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  type?: string | null;
  avatar_url?: string | null;
  organization_id?: number | string | null;
};

const SESSION_MAX_AGE_SEC = 60 * 60 * 8;

export function setInspectionBrowserSession(
  token: string,
  user: InspectionSessionUser
): void {
  if (typeof window === "undefined") return;

  const maxAge = SESSION_MAX_AGE_SEC;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  const encoded = encodeURIComponent(token);

  document.cookie = `dasm_access_token=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  document.cookie = `inspection_token=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  localStorage.setItem("inspection_user", JSON.stringify(user));
}
