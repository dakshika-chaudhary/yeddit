

import NewPost from './components/NewPost'
import { getNewPosts } from '../actions';

export default async function NewPostsPage() {
  const posts = await getNewPosts();
  return (
    <div className="max-w-md mx-auto mt-20" >
      
      <NewPost posts={posts} />
    </div>
  );
}