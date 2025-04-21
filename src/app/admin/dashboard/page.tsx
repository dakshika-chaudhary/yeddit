import AdminDashboard from "./component/AdminPage";
import { getNewPosts, getUsers,getUserSession} from "@/app/actions";

export default async function AdmineDashboardPage() {
  const result = await getUsers();
  const posts = await getNewPosts();
  const session = await getUserSession();

  if (!result?.success) {
    return <p>Unauthorized</p>; // Or redirect to login
  }

  if(!posts){
    return <p>No posts available.</p>;
  }

  return (
    <div className="max-w-md mx-auto mt-20" >
      
      <AdminDashboard 
      users={result.users}
       posts={posts}
       currentUserID={session?.id || ""}
      />
    </div>
  );
}