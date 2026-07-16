import { StudioPostCard, type StudioPostCardData } from "@/components/studio/posts/post-card";
import { EmptyPosts } from "./empty-posts";

type PostGridProps = {
  posts: StudioPostCardData[];
  username: string;
};

export function PostGrid({ posts, username }: PostGridProps) {
  if (posts.length === 0) {
    return <EmptyPosts />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-4 2xl:grid-cols-3">
      {posts.map((post) => (
        <StudioPostCard key={post.id} post={post} username={username} />
      ))}
    </div>
  );
}
