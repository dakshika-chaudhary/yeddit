'use client'
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { CardContent } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useState, useEffect } from 'react';
import { getNewPosts, getLikedPosts, getPostsByToday, getPostsByYesterday, getPostsByMonth, getPostsByWeek, getPopularPosts, getUserSession, getPost } from '@/app/actions';
import { redirect, useRouter } from 'next/navigation';
import Pagination from '@mui/material/Pagination';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Image from 'next/image';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from 'next/link';
import { LikeDislikeButtons } from '@/app/components/button';
import Modal from '@mui/material/Modal';

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
  thumbnail?: string;
  createdAt: string;
}

export default function NewPosts({posts}) {
//   const [posts, setPosts] = useState<any>([]);
  const [filter, setFilter] = useState("today");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(1);
  const postsPerPage = 6;
  const router = useRouter();
  const [textColor, setTextColor] = useState('black');
  const [imageColor, setImageColor] = useState('black');
  const [open, setOpen] = useState(false); // Login modal state
  const [popupMessage, setPopupMessage] = useState(""); // Popup message state
  const [commentsOpen, setCommentsOpen] = useState(false); // State for opening comments
 
 

  useEffect(() => {
    async function fetchUser() {
      const sessionUser = await getUserSession();
      console.log("Fetched user:", sessionUser); 
      if (!sessionUser) {
        console.log("User not found");
        setOpen(true); // Show login modal if no user found
      }
      setUser(sessionUser);
      

    }
    fetchUser();
  }, []);

  const handleCommentClick = (postId: string) => {
    if (!user) {
      setPopupMessage("You need to log in to comment on posts.");
      // setOpen(true); // Show login popup
      setTimeout(() => setOpen(true), 100);
      return;
    }

    // Proceed with opening comments if logged in
    setCommentsOpen(true);
    router.push(`/media/${postId}`);
    console.log("Opening comments for post:", postId);
  };



  const openPost = (postid: any) => {
    console.log("Opened the post of:", postid);
    router.push(`/media/${postid}`);
  };

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Container maxWidth="lg">
        <h4 className="font-bold mb-4 text-center">Posts</h4>

        <ul className="space-y-16">
       
 {
          posts.length > 0 ? (
            posts
              .slice((page - 1) * postsPerPage, page * postsPerPage)
              .map((post) => (
                <li key={post._id} className="border rounded-lg shadow-md p-4 bg-white">
                  <Card sx={{ maxWidth: '100%' }}>
                    <CardHeader
                      avatar={<Avatar sx={{ bgcolor: red[500] }}></Avatar>}
                      action={
                        <IconButton aria-label="settings">
                          <MoreVertIcon />
                        </IconButton>
                      }
                      subheader={new Date(post.createdAt).toLocaleString()}
                    />

                    <Typography
                      variant="h5"
                      sx={{ ml: 2, color: textColor }}
                      onClick={() => openPost(post._id)}
                      onMouseEnter={() => setTextColor('red')}
                      onMouseLeave={() => setTextColor('black')}
                    >
                      {post.title}
                    </Typography>

                    <CardContent>
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
                    </CardContent>

                    {/* Thumbnail Image */}
                    {post.thumbnail && (
                      <Box
                        sx={{
                          width: 600,
                          height: 300,
                          borderRadius: 2,
                          overflow: 'hidden',
                          transition: 'all 0.2s',
                          filter: imageColor === 'black' ? 'none' : 'grayscale(20%) brightness(75%)',
                          '&:hover': {
                            filter: 'grayscale(20%) brightness(75%)',
                          },
                        }}
                      >
                        <Image
                          src={post.thumbnail}
                          alt="YouTube Thumbnail"
                          width={600}
                          height={300}
                          className="rounded-lg transition-all duration-300 hover:grayscale hover:brightness-75"
                          onClick={() => openPost(post._id)}
                        />
                      </Box>
                    )}

                    {/* Post Stats */}
                    <div className="px-4 pb-3 flex justify-between items-center">
                      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="body1" sx={{ p: 2 }}>
                          {post.readBy?.length || 0} views
                        </Typography>

                        <Box sx={{ display: "flex", alignItems: "center" }}>

                          {post._id && post &&(
                            <LikeDislikeButtons
                           
                              initialLikes={post.likes?.length ?? 0}
                              initialDislikes={post.dislikes?.length ?? 0}
                              postId={post._id}
                            />
                          )}
                       
                        </Box>
                        <Typography variant="body1" sx={{ p: 2 }} onClick={() => handleCommentClick(post._id)}>
                        {post.comments?.length || 0} comments
                        </Typography>
                      </Box>
                    </div>
                  </Card>
                </li>
              ))
          ) : (
            <Typography variant="h6" className="text-center mt-4">
              No posts available
            </Typography>
          )}
        
        </ul>

        {/* Pagination */}
        <Stack spacing={2} alignItems="center">
          <Pagination
            count={Math.ceil(posts.length / postsPerPage)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Stack>
      </Container>

      {/* Login Modal */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <Box sx={{ ...modalStyle }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {popupMessage}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              router.push('/login');
              setOpen(false);
            }}
          >
            Log In
          </Button>
        </Box>
      </Modal>
    </div>
  );
}

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
};
