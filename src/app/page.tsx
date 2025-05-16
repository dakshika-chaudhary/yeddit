

import Home from "./components/Home";
import {
  getNewPosts,
  getPostsByYesterday,
  getPostsByWeek,
  getPostsByMonth,
  getPostsByToday,
} from "@/app/actions";
import { Box, Button } from "@mui/material";
import Link from "next/link";
import { redirect } from "next/navigation";

import { Postss } from "../../types/postTypes"; 
// Ensure you're importing from the same file

interface HomePageProps {
  //searchParams: { filter?: string };
  searchParams: Promise<{ filter?: string }>;
}
export const dynamic = 'force-dynamic';

export default async function HomePage({ searchParams }: HomePageProps) {

  
  let filter = (await searchParams)?.filter?.toLowerCase() || "today";
  let posts: Postss[] = [];

  switch (filter) {
    case "today":
      posts = await getPostsByToday();
      break;
    case "yesterday":
      posts = await getPostsByYesterday();
      break;
    case "week":
      posts = await getPostsByWeek();
      break;
    case "month":
      posts = await getPostsByMonth();
      break;
    case "all":
      const newPosts = await getNewPosts();
      posts = newPosts.posts; 
      // Make sure this is a Post[] array
      break;
    default:
      posts = await getPostsByToday();
      filter = "today";
      break;
  }

  // To avoid displaying the button if no posts are available, check and update filter
  const originalFilter = filter;

  if (posts.length === 0) {
    posts = await getPostsByYesterday();
    if (posts.length > 0) {
      filter = "yesterday";
    } else {
      posts = await getPostsByWeek();
      if (posts.length > 0) {
        filter = "week";
      } else {
        posts = await getPostsByMonth();
        if (posts.length > 0) {
          filter = "month";
        } else {
          const newPosts = await getNewPosts();
          posts = newPosts.posts; 
          // Make sure this is a Post[] array
          filter = "all";

        }
      }
    }
  }

  // If the filter was updated, perform a redirect
  if (originalFilter !== filter) {
    redirect(`/?filter=${filter}`);
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-10">
      <Box sx={{ p: 4, display: "flex", gap: 2, justifyContent: "center" }}>
        {["Today", "Yesterday", "Week", "Month", "All"].map((option) => {
          const optionLower = option.toLowerCase(); 
          return (
            <Link key={option} href={`?filter=${optionLower}`} passHref>
              <Button
                variant={filter === optionLower ? "contained" : "outlined"}
                color="primary"
              >
                {option}
              </Button>
            </Link>
          );
        })}
      </Box>
      <Home posts={posts} />
    </div>
  );
}

