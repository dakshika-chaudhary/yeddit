
"use client";
// import { PostForm } from "@/app/components/PostForm";
import { useEffect, useState } from "react";
import { PostForm } from "./components/page";
import { getUserSession, logoutUser } from "../actions";
import { useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Link from "next/link";
import {Button} from "@mui/material";
import { Typography } from "@mui/material";
export default function PostPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchSession() {
      try {
        const session = await getUserSession();
        if (session?.id) {
          setUserId(session.id);
        }
      } catch (error) {
        console.error("Error fetching session:", error);
      }
    }
    fetchSession();
  }, []);

  // Handle logout function
  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await logoutUser();

      // Ensure session cleanup
      localStorage.removeItem("session");
      sessionStorage.removeItem("session");
      setUserId(null);

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  console.log("Stored user in posts page:", userId);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Container maxWidth="sm" align="center" className="p-4">
        {/* <h1 className="text-2xl font-bold"></h1> */}
       
        {!userId ? (
          <p className="text-red-500">
            You must be logged in to create a post.{" "}
            <Link href="/login" className="text-blue-500 underline">
              Login here.
            </Link>
          </p>
        ) : (
          <PostForm userId={userId} />
        )}
        {userId && (
          
          <Button variant="contained" className="mt-4"  onClick={handleLogout}>Logout</Button>
        )}
      </Container>
    </div>
  );
}
