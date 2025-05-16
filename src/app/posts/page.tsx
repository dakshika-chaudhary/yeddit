
"use client";
import { useEffect, useState } from "react";
import  {PostForm } from "./components/posts";
import { getUserSession, logoutUser } from "../actions";
import { useRouter } from "next/navigation";
import Container from "@mui/material/Container";
import Link from "next/link";
import { Button } from "@mui/material";

export const dynamic = 'force-dynamic';
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



  return (
    <div className="max-w-3xl mx-auto p-4">
      <Container maxWidth="sm"  className="p-4" component="div">
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
          <Button variant="contained" className="mt-4" onClick={handleLogout}>
            Logout
          </Button>
        )}
      </Container>
    </div>
  );
}
