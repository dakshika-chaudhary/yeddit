

"use client";

import { Container, Card, CardContent, Typography, Avatar, Box, Skeleton } from "@mui/material";
import UserPosts from "@/app/components/UserPosts";
import Link from "@mui/material";
import {Grid} from "@mui/material";


export default function UserProfile({ 
  user 
}: { 
  user: { id: string; name: string; email: string } | null 
}) {
  if (!user) return <Typography>Loading user profile...</Typography>;

  console.log("Frontend received user:", user);

  return (
   
<Grid container spacing={2}>
  
<Grid item xs={4}>
    <Card 
      sx={{ 
        mt: 8,
        mb:4,
        ml:6, 
        p: 2, 
        borderRadius: 3, 
        boxShadow: 3, 
        textAlign: "center", 
        backgroundColor: "white"
      }}
    >
      <CardContent>
        {/* User Avatar (First letter of username) */}
        <Avatar 
          sx={{ 
            width: 80, 
            height: 80, 
            mx: "auto", 
            bgcolor: "primary.main", 
            fontSize: 32 
          }}
        >
          {user.name ? user.name.charAt(0).toUpperCase() : "?"}
        </Avatar>

        <Box mt={2}>
          <Typography variant="h5" fontWeight="bold">
            {user.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user.email}
          </Typography>
          
        </Box>
        {/* <Link href="/"></Link> */}
       
      </CardContent>
    </Card>

</Grid>

<Grid item xs={7}>
    <Card 
      sx={{ 
        mt: 8,
        mb:4, 
        p: 2, 
        borderRadius: 3, 
        boxShadow: 3, 
        textAlign: "center", 
        backgroundColor: "white",
        height: "90vh",
        overflowY: "auto"
      }}
    >
      <CardContent>
    <UserPosts userId = {user.id}/>
    </CardContent></Card></Grid>
    </Grid>
 
  );
}
