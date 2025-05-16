'use client';

import { useEffect, useState } from 'react';
import { getPost, updatePost, DeletePost } from '@/app/actions';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import { useParams } from 'next/navigation';
import { SanitizedPostss } from '../../../../../types/postTypes';

export const dynamic = 'force-dynamic';
export default function EditPost() {
  // { postId }: { postId: string }
  const { postId } = useParams() as { postId: string };
  const [post, setPost] = useState<SanitizedPostss|null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ title: '', description: '' });

  useEffect(() => {
    async function fetchPost() {
      const fetchedPost = await getPost(postId);
      if (fetchedPost) {
        setPost(fetchedPost);
        setEditedData({ title: fetchedPost.title, description: fetchedPost.description });
      }
    }
    fetchPost();
  }, [postId]);

  const startEditing = () => {
    setIsEditing(true);
  };

  const savePost = async () => {
    const updatedPost = await updatePost(postId, editedData);
    if (updatedPost) {
      setPost(updatedPost);
      setIsEditing(false);
    }
  };

  const deletePost = async () => {
    const deleted = await DeletePost(postId);
    if (deleted) {
      setPost(null); 
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditedData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (!post) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Typography>No post found.</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography fontWeight="bold" gutterBottom>
        Edit Your Post
      </Typography>

      <Card sx={{ mb: 3, p: 2 }}>
        <CardContent>
          {isEditing ? (
            <>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={editedData.title}
                onChange={handleChange}
                variant="outlined"
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={editedData.description}
                onChange={handleChange}
                variant="outlined"
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <Button variant="contained" color="primary" onClick={savePost}>
                Save
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h4">{post.title}</Typography>
              <Typography variant="body2" color="text.secondary">
                {post.description}
              </Typography>
            </>
          )}
        </CardContent>
        <Divider variant="middle" />
        <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <IconButton color="primary" onClick={startEditing}>
            <EditIcon />
          </IconButton>
          <IconButton color="error" onClick={deletePost}>
            <DeleteIcon />
          </IconButton>
        </CardActions>
      </Card>
    </Container>
  );
}
