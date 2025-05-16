

import { getUserSession, getSpecificPosts } from "@/app/actions";
import MediaSpecificPost from "./components/MediaSpecificPost";
import { SanitizedPostss, PageProps } from "../../../../types/postTypes";


export const dynamic = "force-dynamic";


export default async function MediaPage({ params }: PageProps) {
  
  const { postid } = await params;

  
  const session = await getUserSession();
  const userId = session?.id?.toString() || "";

  if (!postid || !userId) {
    return <p>No post found.</p>;
  }

  const fetchedPost = await getSpecificPosts(postid, userId);

  if (!fetchedPost) {
    return <p>No post found.</p>;
  }

  const sanitizedPost: SanitizedPostss = JSON.parse(JSON.stringify(fetchedPost));

  return (
    <div className="max-w-md mx-auto mt-20">
      <MediaSpecificPost post={sanitizedPost} />
    </div>
  );
}
