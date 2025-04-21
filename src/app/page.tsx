

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

export default async function HomePage({ searchParams }: { searchParams: { filter?: string } }) {
  let filter = searchParams?.filter?.toLowerCase() || "today";
  
  let posts = [];

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
      posts = await getNewPosts();
      break;
    default:
      posts = await getPostsByToday();
      filter="today";
      break;
  }

  //to avoid displaying the button in which posts are not available
  let originalFilter = filter;

  if(posts.length === 0){
    posts = await getPostsByYesterday();
    if (posts.length > 0) {
      filter = "yesterday";
  }
  else{
    posts = await getPostsByWeek();
    if (posts.length > 0) {
      filter = "week";
  }
  else {
    posts = await getPostsByMonth();
    if (posts.length > 0) {
      filter="month";
    }
    else {
      posts = await getNewPosts();
      filter = "all";
    }
  }
}
  }
  

  if(originalFilter !== filter){
    redirect(`/?filter=${filter}`);
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-10">
      <Box sx={{ p: 4, display: "flex", gap: 2, justifyContent: "center" }}>
        {["Today", "Yesterday", "Week", "Month", "All"].map((option) => {
          const optionLower = option.toLowerCase(); // Convert for comparison
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
