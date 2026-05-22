"use server";

import { revalidatePath } from "next/cache";
import { requireAdminClient } from "@/lib/supabase/admin";

export type WorkshopApplicationResult =
  | { ok: true; applicationId: string }
  | { ok: false; message: string };

export async function submitWorkshopApplicationAction(
  formData: FormData
): Promise<WorkshopApplicationResult> {
  const workshopName = String(formData.get("workshop_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim() || null;
  const dasmUserId = String(formData.get("dasm_user_id") ?? "").trim() || null;
  const commercialRegistration =
    String(formData.get("commercial_registration") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  if (!workshopName || !city || !contactName || !phone) {
    return {
      ok: false,
      message: "اسم الورشة، المدينة، اسم المسؤول، والجوال مطلوبة.",
    };
  }

  if (phone.length < 9) {
    return { ok: false, message: "رقم الجوال غير صالح." };
  }

  const sb = requireAdminClient();
  const { data, error } = await sb
    .from("inspection_workshop_applications")
    .insert({
      workshop_name: workshopName,
      city,
      contact_name: contactName,
      phone,
      email,
      dasm_user_id: dasmUserId,
      commercial_registration: commercialRegistration,
      notes,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "تعذّر إرسال الطلب." };
  }

  revalidatePath("/workshops");
  revalidatePath("/workshops/apply");

  return { ok: true, applicationId: data.id as string };
}
