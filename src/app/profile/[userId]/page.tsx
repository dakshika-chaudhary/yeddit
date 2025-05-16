

import { getUserSession } from "@/app/actions";
import UserProfile from "./components/UserProfile";

interface ProfilePageProps {
  params: Promise<{
    userId: string;
  }>;
}
export const dynamic = 'force-dynamic';
export default async function ProfilePage({ params }: ProfilePageProps) {
  try {
   
    const resolvedParams = await params;
    
    const { userId } = resolvedParams;

    if (!userId) {
      return <p>User ID is missing!</p>;
    }

   

    
    const user = await getUserSession();

    if (!user) {
      return <p>User not found or not logged in.</p>;
    }



    return <UserProfile user={user} />;
  } catch (error) {
    console.log("Error fetching user data:", error);
    return <p>Error fetching user data. Please try again later.</p>;
  }
}
