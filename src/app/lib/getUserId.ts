
// import { cookies } from "next/headers";
// import { getUserSession } from "../actions";

// export async function getUserIdFromRequest(): Promise<string | null> {
//   const cookieStore = await cookies();
//   const sessionToken = cookieStore.get("session")?.value||"";
  
//   if (!sessionToken) {
    
//     return null;
//   }

//   const sessionData = await getUserSession();
//   if (!sessionData) {
   
//     return null;
//   }


//   return sessionData?.id || null;
// }

// import { cookies } from "next/headers";
// import { getUserSession } from "../actions";

// export const dynamic = 'force-dynamic';

// export async function getUserIdFromRequest(): Promise<string | null> {
//   try {
//     // Get cookies from the request headers
//     const cookieStore = await cookies();

//     // Fetch the session token from cookies
//     const sessionToken = cookieStore.get("session")?.value || "";

//     // If no session token is found, return null
//     if (!sessionToken) {
//       console.log("No session token found.");
//       return null;
//     }

//     // Get the user session based on the session token
//     const sessionData = await getUserSession();

//     // If no session data is found, return null
//     if (!sessionData) {
//       console.log("No session data found.");
//       return null;
//     }
 
//     // Return the user id from the session data
//     return sessionData.id || null;

//   } catch (error) {
//     console.error("Error in getUserIdFromRequest:", error);
//     return null; // Return null in case of error
//   }
// }

import { cookies } from "next/headers";
import { getUserSession } from "../actions";

export const dynamic = 'force-dynamic';

export async function getUserIdFromRequest(): Promise<string | null> {
  try {
    // Await the cookies() Promise to get the actual cookie store
    const cookieStore = await cookies(); // ✅ Await cookies here

    // Fetch the session token from cookies
    const sessionToken = cookieStore.get("session")?.value;

    // If no session token is found, return null
    if (!sessionToken) {
      console.log("No session token found.");
      return null;
    }

    // Get the user session based on the session token
    const sessionData = await getUserSession();

    // If no session data is found, return null
    if (!sessionData) {
      console.log("No session data found.");
      return null;
    }

    // Return the user id from the session data
    return sessionData.id || null;
  } catch (error) {
    console.error("Error in getUserIdFromRequest:", error);
    return null; // Return null in case of error
  }
}
