import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

/** مسار قديم — يُحوّل إلى مركز ملف الورشة الجديد. */
export default async function WorkshopSettingsRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = sp.workshop_id ? `?workshop_id=${sp.workshop_id}` : "";
  redirect(`/workshop/profile${q}`);
}
