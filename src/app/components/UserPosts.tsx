

'use client';

import { useEffect, useState } from 'react';
import { getUserPosts, updatePost, DeletePost } from '@/app/actions';
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
import Link from 'next/link';
import { Pagination } from '@mui/material';
import Stack from '@mui/material/Stack';

export default function UserPosts({ userId }: { userId: string }) {
    const [posts, setPosts] = useState<any[]>([]);
    const [editingPostId, setEditingPostId] = useState<any>(null);
    const [editedData, setEditedData] = useState<any>({ title: '', description: '' });
    const [page, setPage] = useState(1);
    const postsPerPage = 5;

    useEffect(() => {
        async function fetchPosts() {
            const userPosts = await getUserPosts(userId);
            setPosts(userPosts);
        }
        fetchPosts();
    }, [userId]);

    const startEditing = (post: any) => {
        setEditingPostId(post._id);
        setEditedData({ title: post.title, description: post.description });
    };

    const savePost = async (postId: any) => {
        const updatedPost = await updatePost(postId, editedData);
        if (updatedPost) {
            const updatedPosts = await getUserPosts(userId);
            setPosts(updatedPosts || []);
            setEditingPostId(null);
        }
    };

    const deletePost = async (postId: any) => {
        const deletedPost = await DeletePost(postId);
        if (deletedPost) {
            const remainingPosts = await getUserPosts(userId);
            setPosts(remainingPosts || []);
        }
    };

    const handleChange = (e: any) => {
        setEditedData((prev: any) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const getYoutubeEmbedUrl = (youtubeCode: string) => {
        return youtubeCode ? `https://www.youtube.com/embed/${youtubeCode}` : null;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Typography fontWeight="bold" gutterBottom>
                Your Posts
            </Typography>
            <Link href="/posts" style={{ textDecoration: 'underline', color: 'red' }}>
    Create New Post
</Link>

            
            {posts.length === 0 ? (
                <Typography color="inherit">No posts found yet.</Typography>
            ) : (
                posts.map((post: any) => {
                    const youtubeEmbedUrl = getYoutubeEmbedUrl(post.youtubeCode);
                    return (
                        <Card key={post._id} sx={{ mb: 3, p: 2 }}>
                            <CardContent>
                                {editingPostId === post._id ? (
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
                                        
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => savePost(post._id)}
                                        >
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="h6">{post.title}</Typography>
                                  
                                        <Typography
                                                            variant="body2"
                                                            sx={{
                                                              color: 'text.secondary',
                                                              display: '-webkit-box',
                                                              WebkitBoxOrient: 'vertical',
                                                              overflow: 'hidden',
                                                              WebkitLineClamp: 5,
                                                            }}
                                                          >
                                                            {post.description}
                                                          </Typography>
                                        {youtubeEmbedUrl ? (
                                            <iframe
                                                width="600"
                                                height="250"
                                                src={youtubeEmbedUrl}
                                                title="YouTube video player"
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            ></iframe>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">
                                                No YouTube video available.
                                            </Typography>
                                        )}
                                    </>
                                )}
                            </CardContent>
                            <Divider variant="middle"  />
                            <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <IconButton color="primary" onClick={() => startEditing(post)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton color="error" onClick={() => deletePost(post._id)}>
                                    <DeleteIcon />
                                </IconButton>
                            </CardActions>
                           
                        </Card>
                    );
                })
            )}
            <Stack spacing={2} alignItems="center">
                  <Pagination 
                  count={Math.ceil(posts.length / postsPerPage)}
                  page={page}
                  // value is basically page number
                  onChange={(event,value)=>setPage(value)}
                  color="primary" 
                  />
                </Stack>
        </Container>
    );
}
