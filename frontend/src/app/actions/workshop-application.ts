"use server";

import { revalidatePath } from "next/cache";
import { resolveDasmUserId } from "@/lib/auth/resolve-dasm-user-id.server";
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
  const fromSession = (await resolveDasmUserId())?.trim() || null;
  const fromForm = String(formData.get("dasm_user_id") ?? "").trim() || null;
  const dasmUserId = fromSession ?? fromForm;
  const inviteToken = String(formData.get("invite_token") ?? "").trim() || null;
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
  let ownerUserId = dasmUserId;

  if (inviteToken) {
    const { data: invite, error: inviteError } = await sb
      .from("inspection_workshop_invites")
      .select(
        "id, status, expires_at, dasm_user_id, workshop_name, city, contact_name, phone, email"
      )
      .eq("token", inviteToken)
      .maybeSingle();

    if (inviteError || !invite) {
      return { ok: false, message: "رابط الدعوة غير صالح." };
    }
    if (invite.status !== "pending") {
      return { ok: false, message: "انتهت صلاحية هذه الدعوة أو استُخدمت مسبقاً." };
    }
    if (new Date(String(invite.expires_at)) < new Date()) {
      await sb
        .from("inspection_workshop_invites")
        .update({ status: "expired" })
        .eq("id", invite.id);
      return { ok: false, message: "انتهت صلاحية رابط الدعوة." };
    }
    ownerUserId =
      dasmUserId ||
      String(invite.dasm_user_id ?? "").trim() ||
      null;
    if (!ownerUserId) {
      return {
        ok: false,
        message: "سجّل الدخول بحساب داسم أولاً لإكمال الدعوة.",
      };
    }
  }

  const { data, error } = await sb
    .from("inspection_workshop_applications")
    .insert({
      workshop_name: workshopName,
      city,
      contact_name: contactName,
      phone,
      email,
      dasm_user_id: ownerUserId,
      commercial_registration: commercialRegistration,
      notes,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? "تعذّر إرسال الطلب." };
  }

  if (inviteToken) {
    await sb
      .from("inspection_workshop_invites")
      .update({
        status: "redeemed",
        redeemed_at: new Date().toISOString(),
        application_id: data.id,
        dasm_user_id: ownerUserId,
      })
      .eq("token", inviteToken)
      .eq("status", "pending");
  }

  revalidatePath("/workshops");
  revalidatePath("/workshops/apply");
  revalidatePath("/settings");

  return { ok: true, applicationId: data.id as string };
}
