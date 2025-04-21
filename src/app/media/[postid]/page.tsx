
import MediaSpecificPost from './components/page';
import { getSpecificPosts } from '@/app/actions';
import { getUserSession } from '@/app/actions';

export default async function MediaPage({params}) {

  const { postid } = await params;
  const session = await getUserSession();
  const userId = session?.id?.toString()||"";

  let post = null;
  if (postid && userId) {
    post = await getSpecificPosts(postid, userId);
    post = JSON.parse(JSON.stringify(post));
  }
  
  return (
    <div className="max-w-md mx-auto mt-20" >
      
      <MediaSpecificPost post={post} />
    </div>
  );
}