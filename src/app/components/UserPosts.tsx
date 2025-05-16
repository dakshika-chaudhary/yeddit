
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
import toast from 'react-hot-toast';
import { IPost } from '../../../types/postTypes';
export const dynamic = 'force-dynamic';
export default function UserPosts({ userId }: { userId: string }) {
    const [posts, setPosts] = useState<IPost[]>([]);
    const [editingPostId, setEditingPostId] = useState<string|null>(null);
    const [editedData, setEditedData] = useState<{ title: string; description: string }>({ title: '', description: '' });
    const [page, setPage] = useState(1);
    const postsPerPage = 5;

    useEffect(() => {
        async function fetchPosts() {
            const userPosts = await getUserPosts(userId);
            setPosts(userPosts);
        }
        fetchPosts();
    }, [userId]);

    const startEditing = (post:IPost) => {
        setEditingPostId(post._id.toString());
        setEditedData({ title: post.title, description: post.description });
    };

    const savePost = async (postId: string) => {
        const updatedPost = await updatePost(postId, editedData);
        if (updatedPost) {
            const updatedPosts = await getUserPosts(userId);
            setPosts(updatedPosts || []);
            setEditingPostId(null);
        } else {
            toast.error('Failed to update post');
        }
    };

    const deletePost = async (postId: string) => {
        const confirm = window.confirm("Are you sure you want to delete this post?");
        if (confirm) {
            try {
                const res = await DeletePost(postId);
                if (res?.success) {
                    const remainingPosts = await getUserPosts(userId);
                    toast.success("Post deleted successfully");
                    setPosts(remainingPosts || []);
                } else {
                    toast.error("Failed to delete post");
                }
            } catch (error) {
                toast.error(`Error deleting post ${error}`);
            }
        }
    };

    const handleChange = (e:  React.ChangeEvent<HTMLInputElement>) => {
        setEditedData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    };

    const getYoutubeEmbedUrl = (youtubeCode: string) => {
        return youtubeCode ? `https://www.youtube.com/embed/${youtubeCode}` : null;
    };

    const paginatedPosts = posts.slice((page - 1) * postsPerPage, page * postsPerPage);

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
                paginatedPosts.map((post: IPost) => {
                    const youtubeEmbedUrl = getYoutubeEmbedUrl(post.youtubeCode);
                    return (
                        <Card key={post._id.toString()} sx={{ mb: 3, p: 2 }}>
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
                                            onClick={() => savePost(post._id.toString())}
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
                            <Divider variant="middle" />
                            <CardActions sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <IconButton color="primary" onClick={() => startEditing(post)}>
                                    <EditIcon />
                                </IconButton>
                                <IconButton color="error" onClick={() => deletePost(post._id.toString())}>
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
                    onChange={(event,value) => setPage(value)}
                    
                    color="primary"
                />
                
            </Stack>
        </Container>
    );
}
