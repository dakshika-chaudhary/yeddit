
import MostViewed from './components/MostViewed'
import { getPopularPosts } from '../actions';

export default async function MostViewedPage() {
  const posts = await getPopularPosts();
  return (
    <div className="max-w-md mx-auto mt-20" >
      
      <MostViewed posts={posts} />
    </div>
  );
}