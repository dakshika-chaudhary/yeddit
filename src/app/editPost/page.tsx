import { getPost} from "../actions";
import EditPost from "../users/[userId]/components/page";

export default async function PostEditor({ postId }: { postId: string }) {
  const post = await getPost(postId);
  if(!post){console.log("No post found here")}
  console.log("post is ",post)
  
  return <EditPost post={post} />;
}