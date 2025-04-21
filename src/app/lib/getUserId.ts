
import { cookies } from "next/headers";
import { getUserSession } from "../actions"; // Adjust this import to match your session logic

export async function getUserIdFromRequest(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value || "";
  
  if (!sessionToken) {
    console.log("No session token found.");
    return null;
  }

  const sessionData = await getUserSession();
  if (!sessionData) {
    console.log("Session data not found for token:", sessionToken);
    return null;
  }

  console.log("session Token is reached for findin Profile",sessionToken)
  return sessionData?.id || null;
}


