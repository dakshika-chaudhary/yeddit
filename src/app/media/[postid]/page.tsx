

'use client'

import { useState, useEffect, useRef } from 'react';
import { getSpecificPosts } from "@/app/actions";
import { useParams } from 'next/navigation';
import { LikeDislikeButtons } from '@/app/components/button';
import { getUserSession,addComment } from '@/app/actions';
import  Container  from '@mui/material/Container';
import { Paper,Box ,TextField ,Button,Typography, Avatar } from "@mui/material";
import { red } from "@mui/material/colors";

interface Comment {
  _id: string;
  user: string;
  text: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title: string;
  description: string;
  youtubeCode?: string;
  likes: string[];
  dislikes: string[];
  readBy: string[]; 
  comments: Comment[];
}


export default function MediaSpecificPost() {
  const [post, setPost] = useState<Post | null>(null);
  const [newComment,setNewComment] = useState("");
  const params = useParams();
  const postId = params.postid as string;
  const fetchedOnce = useRef(false);

  useEffect(() => {
    async function fetchPost() {
      if (!postId || fetchedOnce.current) return;
      fetchedOnce.current = true;

      const session = await getUserSession();
      if (!session || !session.id) {
        console.log("User is not logged in or missing ID");
        return;
      }

      const userId = session.id.toString(); // ✅ Convert userId to string

      if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
        console.error("Invalid User ID format:", userId);
        return;
      }

      console.log("Fetching post with:", { postId, userId });

      try {
        const response = await getSpecificPosts(postId, userId);
        console.log("Fetched post data:", response);

        if (!response || response.error) {
          console.log("Error fetching post:", response.error || "No post found");
          setPost(null);
          return;
        }

        setPost(response);
      } catch (error: any) {
        console.error("Error fetching post:", error);
        setPost(null);
      }
    }

    fetchPost();
  }, [postId]);

const handleAddComment = async () => {
 
  if (!newComment || !post) return;

  try {
    const session = await getUserSession();
    if (!session || !session.id) {
      console.log("User is not logged in.");
      return;
    }

    const userId = session.id.toString();

    const updatedComment = await addComment(postId, userId, newComment);

    if (!updatedComment ) {
      console.log("Failed to add comment");
      return;
    }

    setPost((prev) => {
      if (!prev) return null; 

      return {
        ...prev,
        comments: [
          ...prev.comments,
          {
            _id: updatedComment._id,
            user: updatedComment.user?.toString() || "Unknown User",
            text: updatedComment.text || "",
            createdAt: updatedComment.createdAt
              ? new Date(updatedComment.createdAt).toISOString()
              : null,
          },
        ],
      };
    });

    setNewComment("");
  } catch (error: any) {
    console.error("Error adding comment:", error);
  }
};

  const getYouTubeEmbedUrl = (youtubeCode: string | undefined) =>
    youtubeCode ? `https://www.youtube.com/embed/${youtubeCode}` : null;

  return (
    <div className="p-5">
     <Container maxWidth="lg" className='border-black'>
      {post ? (
        <div className="p-3 border rounded-lg shadow-md">
          <h2 className=" text-xl font-bold  text-center">{post.title}</h2>
          {post.youtubeCode ? (
            <iframe
              width="560"
              height="315"
              src={getYouTubeEmbedUrl(post.youtubeCode)!}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            ></iframe>
          ) : (
            <p>No YouTube video available.</p>
          )}
          <p className="text-gray-700">{post.description}</p>
          {<p> {post.readBy?.length || 0} views</p>}
        </div>
      ) : (
        <p>No post available.</p>
      )}
        
      {postId && post && (
        <LikeDislikeButtons
          initialLikes={post.likes?.length ?? 0}
          initialDislikes={post.dislikes?.length ?? 0}
         
          postId={postId}
        />
      )}
      
      <Box mt={2}  sx={{display:"flex"}}>
      <TextField
      fullWidth
      label="Write a comment..."
      variant="outlined"
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      
    />
    <Button variant="contained" onClick={handleAddComment} sx={{ml:1}}>Add Comment</Button>
       
        </Box>
        <Box>
      <Typography variant="h5" fontWeight="bold">
    Comments
  </Typography>
        {/* {post?.comments.length ? ( */}
        {post?.comments?.length ? (
       post.comments.map((comment) => (
        <Paper key={comment._id} sx={{ mt: 2, p: 2, borderRadius: 2 }}>
         <Box sx={{display:"flex"}}><Avatar sx={{ bgcolor: red[500]  }} aria-label="user">
        {comment.user?.charAt(0).toUpperCase() || "U"}
      </Avatar>
       <Typography variant="body1"  sx={{p:1}}>{comment.user}</Typography></Box>
       <Typography variant="body2" fontStyle={'italic'} sx={{p:1}}>
          {comment.text}
        </Typography>
        <Typography variant="caption" color="gray">
          {new Date(comment.createdAt).toLocaleString()}
        </Typography>
        </Paper>
   
  ))
) : (
  <Typography color="textSecondary">No comments yet.</Typography>
)}
    </Box> 

      </Container>
    </div>
  );
}
