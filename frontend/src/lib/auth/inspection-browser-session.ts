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

type InspectionBrowserSessionOptions = {
  /**
   * SSO sets the token cookies atomically in the server response before the
   * client navigates. Other browser-only login flows still need to write them.
   */
  writeTokenCookies?: boolean;
};

const SESSION_MAX_AGE_SEC = 60 * 60 * 8;

export function setInspectionBrowserSession(
  token: string,
  user: InspectionSessionUser,
  options: InspectionBrowserSessionOptions = {}
): void {
  if (typeof window === "undefined") return;

  if (options.writeTokenCookies !== false) {
    const maxAge = SESSION_MAX_AGE_SEC;
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    const encoded = encodeURIComponent(token);

    document.cookie = `dasm_access_token=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
    document.cookie = `inspection_token=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
  }
  localStorage.setItem("inspection_user", JSON.stringify(user));
}
