import type { InspectionDetail } from "@/app/lib/types";

interface RejectionInfoBlockProps {
  inspection: InspectionDetail;
}

/**
 * Render a rejected inspection's rejection reason + invalid fields.
 *
 * `invalidFields` arrives from WP as rich-text HTML (`<ul><li>…</li></ul>`) authored
 * by our own `rejectionFieldsToHtml` — a regex allowlist sanitizes it to the four
 * tags it should ever contain before rendering, as a safety net against manual edits.
 */
function sanitizeRejectionHtml(html: string): string {
  // Keep only <ul>, </ul>, <li>, </li> tags
  return html.replace(/<(?!\/?(?:ul|li))[^>]*>/gi, "");
}

export default function RejectionInfoBlock({
  inspection,
}: RejectionInfoBlockProps) {
  if (inspection.inspectionStatus !== "rejected") return null;
  if (!inspection.invalidFields && !inspection.rejectionReason) return null;

  const showFields = Boolean(inspection.invalidFields);
  const showReason = Boolean(inspection.rejectionReason?.trim());

  return (
    <section aria-label="Rejection details" className="space-y-3 rounded-xl bg-card p-4 shadow-[0_1px_4rem_#09a9a719,0_.25rem_2rem_#00000007]">
      <h2 className="font-heading text-sm font-bold text-foreground">
        Reasons for rejection
      </h2>

      {showFields && (
        <div
          className="prose prose-sm list-disc pl-5 text-sm text-foreground"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{
            __html: sanitizeRejectionHtml(inspection.invalidFields ?? ""),
          }}
        />
      )}

      {showReason && (
        <p className="whitespace-pre-wrap text-sm text-foreground">
          {inspection.rejectionReason}
        </p>
      )}
    </section>
  );
}
