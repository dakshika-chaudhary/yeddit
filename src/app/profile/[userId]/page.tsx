import { getUserDetails, getUserSession } from "@/app/actions";
// import UserProfile from "@/app/components/UserProfile";
import UserProfile from "./components/UserProfile";
import { getUserIdFromRequest } from "@/app/lib/getUserId";
import AdminDashboard from "@/app/admin/dashboard/component/AdminPage";
import { useRouter } from 'next/router';

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  if (!params) {
    console.log(" No params received!");
  } else {
    console.log(" Params found:", params);
  }
  const { userId } =  params;
  console.log("User ID in ProfilePage:", userId);
 
  // Fetch user data based on the userId
  const user = await getUserSession();

  if (!user) {
    return <p>User not found or not logged in.</p>;
  }

  console.log("user is",user)

  return <UserProfile user={user} />
};

