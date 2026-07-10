import { redirect } from "next/navigation";

type Props = { searchParams: Promise<{ workshop_id?: string }> };

/** مسار قديم — يُحوّل إلى مركز السمعة مع تبويب المتابعين. */
export default async function WorkshopFollowersRedirectPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  if (sp.workshop_id) params.set("workshop_id", sp.workshop_id);
  params.set("tab", "followers");
  redirect(`/workshop/reputation?${params.toString()}`);
}
