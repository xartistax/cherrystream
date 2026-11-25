import { redirect } from "next/navigation";

type LegacyListPageProps = {
  params: Promise<{
    username: string;
  }>;
};

// Follower lists were public. Favorites are private now, so the lists no longer exist.
export default async function LegacyListPage({ params }: LegacyListPageProps) {
  const { username } = await params;

  redirect(`/profile/${encodeURIComponent(username)}`);
}
