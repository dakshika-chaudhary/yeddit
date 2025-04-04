
// import { getPostWithLikedUsers } from "../actions";

// export default async function PostPage({postId}:{postId:string}){
// console.log(postId)
//     const post = await getPostWithLikedUsers(postId);
//     if(!post){
//         return <div>No post found.</div>;
//     }
//     return (
//         <div>
//             <h1>{post.title}</h1>
//             <p>{post.description}</p>
//             <h3>Users who liked the post</h3>
//             <ul>
//                 {
//                     post.likes.map((user:any)=>(
//                         <li key={user._id}>
//                              {user.name} ({user.email})
//                         </li>
//                     ))
//                 }
//             </ul>
//         </div>
//     )
// }