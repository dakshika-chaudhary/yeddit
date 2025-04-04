
import { getUserSession } from "@/app/actions";
// import UserProfile from "@/app/components/UserProfile";
import UserProfile from "./components/page";

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const { userId } = params;
  
  // Fetch user data based on the userId
  const user = await getUserSession(userId);


  if (!user) {
    return <p>User not found or not logged in.</p>;
  }
  console.log("user is",user)

  return <UserProfile user={user} />;
}
