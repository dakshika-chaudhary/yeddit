
// import MostViewed from './components/MostViewed';
// import {
//   getPopularPostsByYesterday,
//   getPopularPostsByWeek,
//   getPopularPostsByMonth,
//   getPopularPostsByToday,
//   getPopularPosts,
// } from "@/app/actions";
// import { Box, Button } from "@mui/material";
// import Link from "next/link";
// import { redirect } from "next/navigation";
// import { Postss } from '../../../types/postTypes';

// export const dynamic = 'force-dynamic';

// // ✅ Correctly typed as plain object, not URLSearchParams
// export default async function MostViewedPage({
//   searchParams,
// }: {
//   searchParams?: { filter?: string };
// }) {
//   const filter = searchParams?.filter;
//   const filterLower = filter?.toLowerCase() || "today";

//   let posts: Postss[] = [];

//   switch (filterLower) {
//     case "today":
//       posts = await getPopularPostsByToday();
//       break;
//     case "yesterday":
//       posts = await getPopularPostsByYesterday();
//       break;
//     case "week":
//       posts = await getPopularPostsByWeek();
//       break;
//     case "month":
//       posts = await getPopularPostsByMonth();
//       break;
//     case "all":
//       posts = await getPopularPosts();
//       break;
//     default:
//       posts = await getPopularPostsByToday();
//       break;
//   }

//   // Fallback redirection if no posts found
//   if (posts.length === 0) {
//     const fallbackOptions = [
//       { posts: await getPopularPostsByYesterday(), label: "yesterday" },
//       { posts: await getPopularPostsByWeek(), label: "week" },
//       { posts: await getPopularPostsByMonth(), label: "month" },
//       { posts: await getPopularPosts(), label: "all" },
//     ];

//     for (const fallback of fallbackOptions) {
//       if (fallback.posts.length > 0) {
//         redirect(`/mostViewed?filter=${fallback.label}`);
//       }
//     }
//   }

//   return (
//     <div className="max-w-md mx-auto mt-20 p-10">
//       <Box sx={{ p: 4, display: "flex", gap: 2, justifyContent: "center" }}>
//         {["Today", "Yesterday", "Week", "Month", "All"].map((option) => {
//           const optionLower = option.toLowerCase();
//           return (
//             <Link key={option} href={`/mostViewed?filter=${optionLower}`} passHref>
//               <Button
//                 variant={filterLower === optionLower ? "contained" : "outlined"}
//                 color="primary"
//               >
//                 {option}
//               </Button>
//             </Link>
//           );
//         })}
//       </Box>
//       <MostViewed posts={posts} />
//     </div>
//   );
// }

// import MostViewed from './components/MostViewed';
// import { getPopularPosts } from '../actions';
// import { Box, Button } from "@mui/material";

// import {
//   getPopularPostsByYesterday,
//   getPopularPostsByWeek,
//   getPopularPostsByMonth,
//   getPopularPostsByToday,
// } from "@/app/actions";
// import Link from "next/link";
// import { redirect } from "next/navigation";

// import { Postss } from '../../../types/postTypes';

// // interface MostViewedPageProps {
// //   searchParams: Promise<{ filter?: string }>;
// // }

// interface MostViewedPageProps {
//   searchParams: { filter?: string };
// }
// export const dynamic = 'force-dynamic';
// export default async function MostViewedPage({ searchParams }: MostViewedPageProps) {
//   const filter  =  searchParams?.filter; 
//   const filterLower = filter?.toLowerCase() || "today";

//   let posts: Postss[] = [];

//   switch (filterLower) {
//     case "today":
//       posts = await getPopularPostsByToday();
//       break;
//     case "yesterday":
//       posts = await getPopularPostsByYesterday();
//       break;
//     case "week":
//       posts = await getPopularPostsByWeek();
//       break;
//     case "month":
//       posts = await getPopularPostsByMonth();
//       break;
//     case "all":
//       posts = await getPopularPosts();
//       break;
//     default:
//       posts = await getPopularPostsByToday();
//       break;
//   }

//   if (posts.length === 0) {
//     posts = await getPopularPostsByYesterday();
//     if (posts.length > 0) {
//       redirect(`/mostViewed?filter=yesterday`);
//     } else {
//       posts = await getPopularPostsByWeek();
//       if (posts.length > 0) {
//         redirect(`/mostViewed?filter=week`);
//       } else {
//         posts = await getPopularPostsByMonth();
//         if (posts.length > 0) {
//           redirect(`/mostViewed?filter=month`);
//         } else {
//           posts = await getPopularPosts();
//           redirect(`/mostViewed?filter=all`);
//         }
//       }
//     }
//   }

//   return (
//     <div className="max-w-md mx-auto mt-20 p-10">
//       <Box sx={{ p: 4, display: "flex", gap: 2, justifyContent: "center" }}>
//         {["Today", "Yesterday", "Week", "Month", "All"].map((option) => {
//           const optionLower = option.toLowerCase();
//           return (
//             <Link key={option} href={`/mostViewed?filter=${optionLower}`} passHref>
//               <Button
//                 variant={filterLower === optionLower ? "contained" : "outlined"}
//                 color="primary"
//               >
//                 {option}
//               </Button>
//             </Link>
//           );
//         })}
//       </Box>
//       <MostViewed posts={posts} />
//     </div>
//   );
// }




import {
  getPopularPosts,
  getPopularPostsByYesterday,
  getPopularPostsByWeek,
  getPopularPostsByMonth,
  getPopularPostsByToday,
} from "@/app/actions";
import { Box, Button } from "@mui/material";
import Link from "next/link";
import { redirect } from "next/navigation";
import MostViewed from "./components/MostViewed"; // Adjust the import path as necessary
import { Postss } from "types/postTypes";
// Ensure you're importing from the same file

interface HomePageProps {
  //searchParams: { filter?: string };
  searchParams: Promise<{ filter?: string }>;
}
export const dynamic = 'force-dynamic';

export default async function MostViewedPageProps({ searchParams }: HomePageProps) {

  
  let filter = (await searchParams)?.filter?.toLowerCase() || "today";
  let posts: Postss[] = [];

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
      const newPosts = await getPopularPosts();
      posts = newPosts; 
      // Make sure this is a Post[] array
      break;
    default:
      posts = await getPopularPostsByToday();
      filter = "today";
      break;
  }

  // To avoid displaying the button if no posts are available, check and update filter
  const originalFilter = filter;

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
          const newPosts = await getPopularPosts();
          posts = newPosts; 
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
         <MostViewed posts={posts} />
     
    </div>
  );
}

