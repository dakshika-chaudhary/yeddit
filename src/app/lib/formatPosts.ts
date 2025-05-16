// import { Postss } from "../../../types/postTypes";
// // lib/formatPosts.ts
// export function formatPosts(posts: any[]): Postss[] {
//     return posts.map(post => ({
//       _id: post._id.toString(),
//       userId: post.userId?._id?.toString() || post.userId.toString(),
//       title: post.title?.title?.toString() || post.title.toString(),
//       username: post.userId?.username || "Unknown",
//       createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
//       updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
//       description: post.description
//         ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
//         : "",
//       thumbnail: post.thumbnail || (post.youtubeCode
//         ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
//         : null),
//       readBy: post.readBy?.map((id: any) => id.toString()) || [],
//       likes: post.likes ? post.likes.map((like: any) => like.userId?.toString?.() || like.toString()) : [],
//       dislikes: post.dislikes ? post.dislikes.map((dislike: any) => dislike.userId?.toString?.() || dislike.toString()) : [],
//       comments: post.comments
//         ?.map((comment: any) => ({
//           _id: comment._id.toString(),
//           userId: comment.user?._id?.toString() || "Unknown",
//           username: comment.user?.username || "Anonymous",
//           text: comment.text,
//           createdAt: comment.createdAt?.toISOString?.() || null,
//         })) || [],
//     }));
//   }
  