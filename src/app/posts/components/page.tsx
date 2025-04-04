'use client'

import { useState, useActionState } from "react";
import { createPost } from "@/app/actions";
import { Button, Typography, TextField, Container, Paper } from "@mui/material";
import { useRouter } from "next/navigation";

export function PostForm({ userId }: { userId: any }) {
  const router = useRouter();
  const [state, formAction, disabled] = useActionState(createPost, {});

  return (
    <Container maxWidth="sm">
      <Paper elevation={8} sx={{ padding: 4, marginTop: 6, marginBottom: 6, borderRadius: 2 }}>
        <Typography variant="h4" component="h2">
          Create a Post
        </Typography>
        <form
          action={async (event: any) => {
            const post = await formAction(event);
            console.log(event)
            console.log("post to be created is",post)
            
            router.push(`/users/${userId}`);
          }}
        >
    
          <input type="hidden" name="userId" value={userId} />

          <br />
          <div className="flex items-center gap-2">
            <TextField
              id="youtubecode"
              label="YouTube Link"
              variant="outlined"
              name="youtubecode"
              required
              fullWidth
            />
          </div>

          <p className="text-red-500">{state?.error}</p>

          <Button variant="contained" disabled={disabled} className="mb-4" type="submit" >
            Add Post
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
