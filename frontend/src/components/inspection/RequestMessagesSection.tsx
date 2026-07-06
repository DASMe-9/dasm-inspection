import { sendRequestMessageFormAction } from "@/app/actions/request-messages";
import { SectionCard } from "@/components/shared";
import { getInspectionAuthContext } from "@/lib/auth/inspection-context.server";
import { listMessagesForRequest } from "@/lib/data/request-messages-data";

const STAFF_ROLES = new Set([
  "super_admin",
  "inspection_admin",
  "workshop_owner",
  "workshop_manager",
  "inspector",
  "mechanic",
]);

function senderLabel(role: string | null): string {
  if (!role) return "مستخدم";
  if (STAFF_ROLES.has(role)) return "الورشة";
  return "العميل";
}

export async function RequestMessagesSection({
  requestId,
  ownerId,
}: {
  requestId: string;
  ownerId: string | null;
}) {
  const [messages, ctx] = await Promise.all([
    listMessagesForRequest(requestId),
    getInspectionAuthContext(),
  ]);

  const role = ctx?.inspectionRole ?? null;
  const isStaff = !!role && STAFF_ROLES.has(role);
  const isOwner = !!ctx?.userId && !!ownerId && ctx.userId === ownerId;
  const canPost = isStaff || isOwner;

  // لا نعرض القسم لغير المصرّح لهم إن لم توجد رسائل.
  if (!canPost && messages.length === 0) return null;

  return (
    <SectionCard title="المحادثة مع الورشة">
      {messages.length === 0 ? (
        <p className="text-sm text-gray-500">لا رسائل بعد. ابدأ المحادثة.</p>
      ) : (
        <ul className="space-y-2">
          {messages.map((m) => {
            const mine = !!ctx?.userId && m.senderDasmUserId === ctx.userId;
            const staffMsg = !!m.senderRole && STAFF_ROLES.has(m.senderRole);
            return (
              <li
                key={m.id}
                className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  mine
                    ? "ms-auto bg-violet-600 text-white"
                    : staffMsg
                      ? "bg-indigo-50 text-gray-900"
                      : "bg-gray-100 text-gray-900"
                }`}
              >
                <p className="mb-0.5 text-[11px] opacity-70">
                  {senderLabel(m.senderRole)}
                </p>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
              </li>
            );
          })}
        </ul>
      )}

      {canPost && (
        <form
          action={sendRequestMessageFormAction}
          className="mt-4 flex items-end gap-2 border-t border-gray-100 pt-4"
        >
          <input type="hidden" name="request_id" value={requestId} />
          <textarea
            name="body"
            required
            rows={2}
            maxLength={4000}
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm"
            placeholder="اكتب رسالتك…"
          />
          <button
            type="submit"
            className="rounded-xl bg-[#1E74E8] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#1857b8]"
          >
            إرسال
          </button>
        </form>
      )}
    </SectionCard>
  );
}
