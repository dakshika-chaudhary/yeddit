

'use client';
import { useState, useEffect } from "react";
import { getUserSession, incrementLikes, decrementLikes } from '@/app/actions';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownAltIcon from '@mui/icons-material/ThumbDownAlt';
import { Box, IconButton, Snackbar, Alert,Typography } from "@mui/material";
import { SessionUser } from "../../../types/postTypes";
export const dynamic = 'force-dynamic';
export function SubmitButton({ disabled }: { disabled: boolean }) {
  return (
    <button disabled={disabled} 
    type="submit"
    className="bg-blue-500 text-white p-2 rounded w-full">
       {disabled ? 'Signing up...' : 'Sign Up'}
    </button>
  );
}

export function LoginButton({ disabled }: { disabled: boolean }) {
  return (
    <button disabled={disabled} 
    type="submit"
    className="bg-blue-500 text-white p-2 rounded w-full">
       {disabled ? 'Processing...' : 'Login'}
    </button>
  );
}



export function LikeDislikeButtons({ initialLikes, initialDislikes, postId }: { initialLikes: number, initialDislikes: number, postId: string }) {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null); // Store user session
  const [openSnackbar, setOpenSnackbar] = useState(false); // Snackbar for login prompt

  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
  }, [initialLikes, initialDislikes]);

  useEffect(() => {
    const storedLiked = localStorage.getItem(`liked-${postId}`);
    const storedDisliked = localStorage.getItem(`disliked-${postId}`);
  
    if (storedLiked === "true") setLiked(true);
    if (storedDisliked === "true") setDisliked(true);
  }, [postId]);

  useEffect(() => {
    const fetchUserSession = async () => {
      const userSession = await getUserSession();
      setUser(userSession);
    };

    fetchUserSession();
  }, []);

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      
      <IconButton 
        color={liked ? "error" : "default"}
        onClick={async () => {
          try {
            if (!user) {
              setOpenSnackbar(true); 
              return;
            }

            
            const newData = await incrementLikes(postId);
            if (!newData) {
              
              return;
            }

            setLikes(newData.likes ?? likes);
            setDislikes(newData.dislikes ?? dislikes);
            setLiked(true);
            setDisliked(false);

            localStorage.setItem(`liked-${postId}`, "true");
            localStorage.setItem(`disliked-${postId}`, "false");

         
          } catch (error) {
           console.log(error)
          }
        }}
      >
        <ThumbUpIcon /> 
      </IconButton>
      <Typography variant="body1">{likes}</Typography>

      <IconButton 
        color={disliked ? "error" : "default"}
        onClick={async () => {
          try {
            if (!user) {
              setOpenSnackbar(true); // Show login prompt
              return;
            }

            
            const newData = await decrementLikes(postId);
            if (!newData) {
              
              return;
            }

            setLikes(newData.likes ?? likes);
            setDislikes(newData.dislikes ?? dislikes);
            setDisliked(true);
            setLiked(false);

            localStorage.setItem(`liked-${postId}`, "false");
            localStorage.setItem(`disliked-${postId}`, "true");

           
          } catch (error) {
          console.log(error)
          }
        }}
      >
        <ThumbDownAltIcon />
      </IconButton>
      <Typography variant="body1">{dislikes}</Typography>

      {/* Snackbar for Login Prompt */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="warning" onClose={() => setOpenSnackbar(false)}>
          Please login to like or dislike posts.
        </Alert>
      </Snackbar>
    </Box>
  );
}