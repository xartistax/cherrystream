import type { ReportReason } from "@/generated/prisma/enums";

export const reportReasons: Array<{ value: ReportReason; label: string }> = [
  { value: "MINOR", label: "Person wirkt minderjährig" },
  { value: "NON_CONSENSUAL", label: "Inhalte ohne Einwilligung der gezeigten Person" },
  { value: "FAKE_PROFILE", label: "Fake-Profil oder fremde Fotos" },
  { value: "ILLEGAL_CONTENT", label: "Illegale Inhalte" },
  { value: "SPAM_SCAM", label: "Spam oder Betrug" },
  { value: "OTHER", label: "Anderes" },
];

export const reportReasonLabels = Object.fromEntries(reportReasons.map((reason) => [reason.value, reason.label])) as Record<ReportReason, string>;

/** Reasons that must be handled first; the admin queue sorts and highlights them. */
export const urgentReportReasons: ReportReason[] = ["MINOR", "NON_CONSENSUAL"];
