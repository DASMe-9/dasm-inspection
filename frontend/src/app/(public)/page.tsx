import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PublicHomeHero, PublicHomeSections } from "@/components/public-site";

export const dynamic = "force-dynamic";

/** الصفحة الرئيسية العامة — MVPI-style. المستخدم المسجّل يُوجَّه للوحة التحكم. */
export default async function PublicHomePage() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get("dasm_access_token")?.value ??
    cookieStore.get("inspection_token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return (
    <>
      <PublicHomeHero />
      <PublicHomeSections />
    </>
  );
}
