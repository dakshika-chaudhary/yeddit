

import NewPost from './components/NewPost'
import { getNewPosts } from '../actions';

import { Postss } from '../../../types/postTypes'; 
export const dynamic = 'force-dynamic';
export default async function NewPostsPage() {
 
  const { posts }: { posts: Postss[] } = await getNewPosts();
  return (
    <div className="max-w-md mx-auto mt-20">
      <NewPost posts={posts} />
    </div>
  );
}

