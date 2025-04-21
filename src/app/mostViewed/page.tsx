

import MostViewed from './components/MostViewed';
import { getPopularPosts } from '../actions';
import { Box, Button } from "@mui/material";
import {
  getPopularPostsByYesterday,
  getPopularPostsByWeek,
  getPopularPostsByMonth,
  getPopularPostsByToday,
} from "@/app/actions";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MostViewedPage({ searchParams }: { searchParams: { filter?: string } }) {
  // let filter = searchParams.filter?.toLowerCase() || "today";
  let filterValue = searchParams?.filter || 'today';
  let filter = filterValue.toLowerCase();
  let posts = [];

  switch (filter) {
    case "today":
      posts = await getPopularPostsByToday();
      break;
    case "yesterday":
      posts = await getPopularPostsByYesterday();
      break;
    case "week":
      posts = await getPopularPostsByWeek();
      break;
    case "month":
      posts = await getPopularPostsByMonth();
      break;
    case "all":
      posts = await getPopularPosts();
      break;
    default:
      posts = await getPopularPostsByToday();
      filter = "today";
      break;
  }

  let originalFilter = filter;

  if (posts.length === 0) {
    posts = await getPopularPostsByYesterday();
    if (posts.length > 0) {
      filter = "yesterday";
    } else {
      posts = await getPopularPostsByWeek();
      if (posts.length > 0) {
        filter = "week";
      } else {
        posts = await getPopularPostsByMonth();
        if (posts.length > 0) {
          filter = "month";
        } else {
          posts = await getPopularPosts();
          filter = "all";
        }
      }
    }
  }

  if(originalFilter!=filter){
    redirect(`/mostViewed?filter=${filter}`)
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
      <MostViewed posts={posts} />
    </div>
  );
}
