"use client";

import {
  Container,
  Card,
  CardContent,
  Typography,
  Avatar,
  Box,
  Grid,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import UserPosts from "@/app/components/UserPosts";

export default function UserProfile({
  user,
}: {
  user: { id: string; name: string; email: string ; role:string} | null;
}) {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  if (!user) return <Typography>Loading user profile...</Typography>;

  console.log("Frontend received user:", user);

  return (
    <Grid
      container
      spacing={2}
      sx={{ mt: 4, px: isSmallScreen ? 2 : 6 }}
      justifyContent="center"
    >
      {/* Profile Info */}
      <Grid item xs={12} md={4}>
        <Card
          sx={{
            p: 2,
            borderRadius: 3,
            boxShadow: 3,
            textAlign: "center",
            backgroundColor: "white",
          }}
        >
          <CardContent>
            <Avatar
              sx={{
                width: isSmallScreen ? 60 : 80,
                height: isSmallScreen ? 60 : 80,
                mx: "auto",
                bgcolor: "primary.main",
                fontSize: isSmallScreen ? 24 : 32,
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "?"}
            </Avatar>

            <Box mt={2}>
              <Typography variant="h5" fontWeight="bold" fontSize={isSmallScreen ? "1.2rem" : "1.5rem"}>
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      {/* User Posts */}
      <Grid item xs={12} md={7}>
        <Card
          sx={{
            p: 2,
            borderRadius: 3,
            boxShadow: 3,
            textAlign: "center",
            backgroundColor: "white",
            height: isSmallScreen ? "auto" : "90vh",
            overflowY: "auto",
          }}
        >
          <CardContent>
            <UserPosts userId={user.id} />
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}