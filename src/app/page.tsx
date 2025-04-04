// 'use client'
// import Home from './components/Home';
// import { getNewPosts, getPostsByYesterday, getPostsByWeek, getPostsByMonth, getPopularPosts, getLikedPosts, getPostsByToday } from "@/app/actions";
// import { Button } from '@mui/material';
// import {useState,useEffect} from 'react'

// export default  function HomePage() {
//   const [filter,setFilter] = useState();
//   const [posts, setPosts] = useState([]);

//   useEffect(() => {
//     async function fetchPosts() {
//       let data = [];
//       switch (filter) {
//         case "today":
//           data = await getPostsByToday();
//           break;
//         case "yesterday":
//           data = await getPostsByYesterday();
//           break;
//         case "week":
//           data = await getPostsByWeek();
//           break;
//         case "month":
//           data = await getPostsByMonth();
//           break;
//         case "all":
//           data = await getNewPosts();
//           break;
//         default:
//           data = [];
//       }
//       setPosts(data);
//     }
//     fetchPosts();
//   }, [filter]);
  
//   return (
//     <>
//     <div className="max-w-md mx-auto mt-20" >
//        <div className="mb-6 text-center">
//           {["today", "yesterday", "week", "month", "all"].map((option, index) => (
//             <span key={option} className="flex inline-flex items-center text-blue">
//               <Button
//                 variant="contained"
//                 size="medium"
//                 onClick={() => setFilter(option)}
//                 sx={{
//                   backgroundColor: filter === option ? "red" : "text-gray-700",
//                 }}
//               >
//                 {option.charAt(0).toUpperCase() + option.slice(1)}
//               </Button>
//               {index < 4 && <span className="mx-2 text-gray-400">  </span>}
//             </span>
//           ))}
//         </div>
//       <Home posts={posts} />

//     </div>
//     </>
//   );
// }

"use client";

import Home from "./components/Home";
import {
  getNewPosts,
  getPostsByYesterday,
  getPostsByWeek,
  getPostsByMonth,
  getPostsByToday,
} from "@/app/actions";
import { Button } from "@mui/material";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [filter, setFilter] = useState("today"); // Default filter
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    async function fetchPosts() {
      let data = [];
      switch (filter) {
        case "today":
          data = await getPostsByToday();
          break;
        case "yesterday":
          data = await getPostsByYesterday();
          break;
        case "week":
          data = await getPostsByWeek();
          break;
        case "month":
          data = await getPostsByMonth();
          break;
        case "all":
          data = await getNewPosts();
          break;
        default:
          data = [];
      }
      setPosts(data);
    }
    fetchPosts();
  }, [filter]);

  return (
    <div className="max-w-md mx-auto mt-20">
      {/* Filter Buttons */}
      <div className="mb-6 text-center">
        {["today", "yesterday", "week", "month", "all"].map((option, index) => (
          <span key={option} className="flex inline-flex items-center text-blue">
            <Button
              variant="contained"
              size="medium"
              onClick={() => setFilter(option)}
              sx={{
                backgroundColor: filter === option ? "red" : "text-gray-700",
              }}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
            {index < 4 && <span className="mx-2 text-gray-400"></span>}
          </span>
        ))}
      </div>

      {/* Home Component with Posts */}
      <Home posts={posts} />
    </div>
  );
}
