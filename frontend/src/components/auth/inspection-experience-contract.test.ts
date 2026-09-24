import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("inspection login and booking experience", () => {
  it("keeps login on the DASM Core proxy and identifies the central account", () => {
    const login = read("src/app/auth/login/page.tsx");
    const shell = read("src/components/auth/AuthShell.tsx");
    const callback = read("src/app/auth/social/callback/page.tsx");

    expect(login).toContain('fetch("/api/auth/login"');
    expect(login).toContain("setInspectionBrowserSession(token, user)");
    expect(login).not.toContain("هوية داسم المركزية");
    expect(shell).not.toContain("الصفحة الرئيسية");
    expect(callback).toContain("router.replace(back)");
  });

  it("shows the same four-stage request journey as the mobile app", () => {
    const form = read("src/components/inspection/NewInspectionRequestForm.tsx");

    for (const label of ["المركبة", "الخدمة", "الورشة", "الإرسال"]) {
      expect(form).toContain(label);
    }
    expect(form).toContain('aria-label="مسار طلب الفحص"');
  });
});
