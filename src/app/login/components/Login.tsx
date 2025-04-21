"use client";

import { LoginButton } from "@/app/components/button";
import { useActionState } from "react";
import { loginUser } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Container from "@mui/material/Container";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import { toast } from "react-hot-toast";

export function Login() {
  const router = useRouter();

  const initialState: any = {
    message: "",
    errors: { email: [], password: [] },
  };

  const [state, formAction, pending] = useActionState<any>(loginUser, initialState);

  // Redirect to /posts if login is successful
  useEffect(() => {
    if (state.redirect) {
      toast.success("Login successful!");
      router.push(state.redirect);
    }
  }, [state.redirect, router]);

  useEffect(() => {
    console.log("Stored loginId:", localStorage.getItem("loginId"));
   
  }, []);

  return (
    <Container maxWidth="sm">
      <Paper elevation={8} sx={{ padding: 4, marginTop: 6,marginBottom:6, borderRadius: 2 }}>
        <Typography variant="h4" align="center" fontWeight="bold" gutterBottom>
          Login
        </Typography>
        <Box component="form" action={formAction} sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Email Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                required
                error={state.errors.email.length > 0}
                helperText={state.errors.email.length > 0 ? state.errors.email[0] : ""}
              />
            </Grid>

            {/* Password Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Password"
                type="password"
                name="password"
                required
                error={state.errors.password.length > 0}
                helperText={state.errors.password.length > 0 ? state.errors.password[0] : ""}
              />
            </Grid>

            {/* Login Button */}
            <Grid item xs={12} sx={{ display: "flex", justifyContent: "center" }}>
            <Button type="submit" variant="contained" disabled={pending}>
             Login
            </Button>
            </Grid>

            {/* Success Message */}
            {state.message && (
              <Grid item xs={12}>
                <Typography color="success.main" align="center">
                  {state.message}
                 
                </Typography>
              </Grid>
            )}

            

<Grid item xs={12} sx={{ textAlign: "center", mt: 2 }}>
              <Typography variant="body2">
                Don't have an account? <a href="/signUp" style={{ color: "#1976d2", textDecoration: "none" }}>Sign up</a>
              </Typography>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}
