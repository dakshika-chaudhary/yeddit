
'use client'

import { useState } from "react";
import { createPost } from "@/app/actions";  
import { Button, Typography, TextField, Container, Paper, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
export const dynamic = 'force-dynamic';
export function PostForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [youtubecode, setYoutubecode] = useState("");  
  const [error, setError] = useState("");  
  const [loading, setLoading] = useState(false);  

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!youtubecode) {
      setError("YouTube link is required");
      return;
    }

    setError("");  
    setLoading(true);  

    try {
    
      const formData = new FormData();
      formData.append("userId", userId);
      formData.append("youtubecode", youtubecode);

      
      const post = await createPost(null, formData);
      console.log(post)
      
      
      router.push(`/users/${userId}`);
    } catch (err) {
     console.log(err)
      setError("Failed to create post. Please try again.");
    } finally {
      setLoading(false);  
    }
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={8} sx={{ padding: 4, marginTop: 6, marginBottom: 6, borderRadius: 2 }}>
        <Typography variant="h4" component="h2">
          Create a Post
        </Typography>
        <form onSubmit={handleSubmit}>
          <input type="hidden" name="userId" value={userId} />

          <div className="flex items-center gap-2">
            <TextField
              id="youtubecode"
              label="YouTube Link"
              variant="outlined"
              name="youtubecode"
              required
              fullWidth
              value={youtubecode}
              onChange={(e) => setYoutubecode(e.target.value)} 
            />
          </div>

         
          {error && <p className="text-red-500">{error}</p>}

          <Button
            variant="contained"
            disabled={loading}  
            className="mb-4"
            type="submit"
            sx={{ display: 'flex', alignItems: 'center' }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: 'white', marginRight: 2 }} /> : null}
            {loading ? "Loading..." : "Add Post"}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
