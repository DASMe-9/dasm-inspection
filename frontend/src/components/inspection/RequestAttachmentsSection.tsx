import Link from "next/link";
import { SectionCard, EmptyState } from "@/components/shared";
import { getAttachmentsWithSignedUrls } from "@/lib/data/inspection";
import { AttachmentUploader } from "./AttachmentUploader";

export async function RequestAttachmentsSection({
  requestId,
  canUpload,
}: {
  requestId: string;
  canUpload: boolean;
}) {
  const items = await getAttachmentsWithSignedUrls(requestId);

  return (
    <SectionCard title="المرفقات">
      {items.length === 0 ? (
        <EmptyState
          title="لا مرفقات بعد"
          description="ارفع صوراً للأضرار أو تقرير PDF لدعم الفحص."
        />
      ) : (
        <ul className="space-y-2 text-sm">
          {items.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5"
            >
              <span className="font-medium text-gray-800 truncate max-w-[min(100%,14rem)]">
                {a.fileName}
              </span>
              {a.signedUrl ? (
                <Link
                  href={a.signedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-indigo-600 font-medium hover:underline min-h-[44px] inline-flex items-center"
                >
                  فتح / تحميل
                </Link>
              ) : (
                <span className="text-xs text-amber-700">رابط مؤقت غير متاح</span>
              )}
            </li>
          ))}
        </ul>
      )}
      {canUpload && <AttachmentUploader requestId={requestId} />}
    </SectionCard>
  );
}
