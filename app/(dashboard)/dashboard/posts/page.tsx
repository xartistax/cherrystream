import { redirect } from "next/navigation";

// Former post management; uploads are managed in the gallery now.
export default function LegacyPostsPage() {
  redirect("/dashboard/gallery");
}
