
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LikeDislikeButtons } from '@/app/components/button';
import { getUserSession, addComment, deletedPost, deleteComment } from '@/app/actions';
import Container from '@mui/material/Container';
import { Paper, Box, TextField, Button, Typography, Avatar } from '@mui/material';
import { red } from '@mui/material/colors';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import toast from 'react-hot-toast';

interface Comment {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
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

export default function MediaSpecificPost({ post }: { post: Post }) {
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const router = useRouter();
  const postId = post._id;

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const session = await getUserSession();
      if (!session || !session.id) {
        toast.error('You must be logged in to comment.');
        return;
      }

      const userId = session.id.toString();
      const result = await addComment(postId, userId, newComment);

      if (!result?.success || !result.comment) {
        toast.error('Failed to add comment.');
        return;
      }

      setComments((prev) => [
        {
          _id: result.comment._id,
          user: {
            _id: result.comment.user._id,
            name: result.comment.user.name || 'Anonymous',
          },
          text: result.comment.text,
          createdAt: result.comment.createdAt
            ? new Date(result.comment.createdAt).toISOString()
            : '',
        },
        ...prev,
      ]);

      setNewComment('');
      toast.success('Comment added!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Something went wrong.');
    }
  };

  const performPostDeletion = async(postId: string) => {
    const confirm = window.confirm("Are you sure you want to delete this post?");
    if(confirm) {
      try {
        const res = await deletedPost(postId);
        if (res?.success) {
          toast.success("Post deleted successfully");
          router.push('/'); // Redirect after deletion
        } else {
          toast.error("Failed to delete post");
        }
      } catch (error) {
        console.error('Error deleting post:', error);
        toast.error('Something went wrong.');
      }
    }
  }

  if (!post) {
    return <p>No post available.</p>;
  }

//   const performCommentDeletion = async(postId:string,commentId: string) => {
//     const confirm = window.confirm("Are you sure you want to delete this comment?");
//     if(confirm){
//       try{
//         const res = await deleteComment(postId, commentId);
//         if(res?.success){
//           setComments((prev) => prev.filter(comment => comment._id !== commentId));
//           toast.success("Comment deleted successfully");
//       }
//       else{
//         toast.error("Failed to delete comment");
//       }
//     }
//     catch(error){
//       console.error('Error deleting comment:', error);
//       toast.error('Something went wrong.');
//     }
//   }
// }
const performCommentDeletion = async (commentId: string) => {
  const confirmDelete = window.confirm('Are you sure you want to delete this comment?');
  if (!confirmDelete) return;

  const res = await deleteComment(postId, commentId);
  if (res.success) {
    setComments(prev => prev.filter(comment => comment._id !== commentId));
    toast.success(res.message);
  } else {
    toast.error(res.message);
  }
};
  return (
    <Container maxWidth="lg" className="border-black p-5">
      <div className="p-3 border rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-center">{post.title}</h2>
        {post.youtubeCode ? (
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${post.youtubeCode}`}
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

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography>{post.readBy?.length || 0} views</Typography>
          <IconButton color="error" onClick={() => performPostDeletion(post._id)}>
            <DeleteIcon />
          </IconButton>
        </Box>
      </div>

      <LikeDislikeButtons
        initialLikes={post.likes?.length ?? 0}
        initialDislikes={post.dislikes?.length ?? 0}
        postId={postId}
      />

      {/* Comment Input */}
      <Box mt={3} sx={{ display: 'flex' }}>
        <TextField
          fullWidth
          label="Write a comment..."
          variant="outlined"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
        />
        <Button variant="contained" onClick={handleAddComment} sx={{ ml: 1 }}>
          Add Comment
        </Button>
      </Box>

      {/* Comments Section */}
      <Box mt={4}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Comments
        </Typography>
        {comments.length > 0 ? (
          comments.map((comment) => (
            <Paper key={comment._id} sx={{ mt: 2, p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: red[500], mr: 2 }}>
                  {comment.user.name?.charAt(0).toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="body1">{comment.user.name}</Typography>
              </Box>
              <Typography variant="body2" sx={{ mt: 1 }}>
                {comment.text}
              </Typography>
             <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
              <Typography variant="caption" color="textSecondary">
              {new Date(comment.createdAt).toISOString()}
              </Typography>
              <IconButton
                                      sx={{ marginright:14 }}
                                 color="error" 
                                 onClick={() => performCommentDeletion(comment._id)}>
                                                  <DeleteIcon  />
                                              </IconButton>
              </Box> 
            </Paper>
          ))
        ) : (
          <Typography color="textSecondary">No comments yet.</Typography>
        )}
      </Box>
    </Container>
  );
}
