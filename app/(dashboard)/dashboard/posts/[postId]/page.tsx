import { redirect } from "next/navigation";

// Former single post management; uploads are managed in the gallery now.
export default function LegacyPostPage() {
  redirect("/dashboard/gallery");
}
