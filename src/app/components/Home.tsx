'use client';
import * as React from 'react';

import { useState, useEffect, useRef } from 'react';

import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import { CardContent } from '@mui/material';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { red } from '@mui/material/colors';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { getUserSession } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Container from '@mui/material/Container';
import Image from 'next/image';

import Box from '@mui/material/Box';

import { LikeDislikeButtons } from '@/app/components/button';
import { SessionUser } from '../../../types/postTypes';
import { Postss } from '../../../types/postTypes';

export const dynamic = 'force-dynamic';
export default function Home({ posts=[] }: { posts: Postss[] }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [page, setPage] = useState(1);
  const postsPerPage = 6;
  const router = useRouter();
  const [textColor, setTextColor] = useState('black');
  const [imageColor] = useState('black');
  const [open, setOpen] = useState(false);
  console.log(open)
  const [PopupMessage, setPopupMessage] = useState('');
  console.log(PopupMessage)
  const loadMoreRef = useRef(null);

  useEffect(() => {
    async function fetchUser() {
      const sessionUser = await getUserSession();
      if (!sessionUser) setOpen(true);
      setUser(sessionUser);
    }
    fetchUser();
  }, []);

  const handleCommentClick = (postId: string) => {
    if (!user) {
      setPopupMessage("You need to log in to comment on posts.");
      setTimeout(() => setOpen(true), 100);
      return;
    }
    router.push(`/media/${postId}`);
  };

  const openPost = (postId: string) => {
    router.push(`/media/${postId}`);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) =>
            prev < Math.ceil(posts.length / postsPerPage) ? prev + 1 : prev
          );
        }
      },
      {
        threshold: 1.0,
      }
    );
  
    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }
  
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [posts]);
  

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Container maxWidth="lg">
        <h4 className="font-bold mb-4 text-center">Posts</h4>
        <ul className="space-y-16">
          {(posts?.length ?? 0) > 0 ? (
            posts
              .slice(0, page * postsPerPage)
              .map((post) => (
                <li key={post._id} className="border rounded-lg shadow-md p-4 bg-white">
                  <Card sx={{ maxWidth: '100%' }}>
                    <CardHeader
                      avatar={<Avatar sx={{ bgcolor: red[500] }} />}
                      action={<IconButton><MoreVertIcon /></IconButton>}
                     
                      subheader={post.createdAt ? new Date(post.createdAt).toISOString() : "Date unknown"}

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

                    <div className="px-4 pb-3 flex justify-between items-center">
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1" sx={{ p: 2 }}>
                          {post.readBy?.length || 0} views
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {post._id && (
                            <LikeDislikeButtons
                              initialLikes={post.likes?.length ?? 0}
                              initialDislikes={post.dislikes?.length ?? 0}
                              postId={post._id}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="body1"
                          sx={{ p: 2, cursor: 'pointer' }}
                          onClick={() => handleCommentClick(post._id)}
                        >
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

        
        <div ref={loadMoreRef} style={{ height: 1 }} />

       {/* // Optional: Loading message */}
        {page < Math.ceil(posts.length / postsPerPage) && (
          <Typography sx={{color:red}}>Loading more posts...</Typography>
        )}
      </Container>

     
    </div>
  );
}
