import "server-only";

import { sendEmail } from "@/lib/email/send";
import { getAppUrl, verifyEmailEmail } from "@/lib/email/templates";
import { createEmailToken } from "@/lib/email/tokens";

/** Not a server action on purpose: it must not be callable from the client with an arbitrary address. */
export async function sendVerificationEmail(email: string): Promise<void> {
  const token = await createEmailToken("verify-email", email);

  await sendEmail({
    to: email,
    ...verifyEmailEmail(getAppUrl(`/verify-email/${token}`)),
  });
}
