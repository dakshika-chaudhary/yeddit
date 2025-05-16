
"use client";
import { useActionState } from "react";
import { createUser } from "@/app/actions";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Container from "@mui/material/Container";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import { Button } from "@mui/material";
import toast from "react-hot-toast";

const initialState = {
  message: "",
  errors: { name: [], email: [], password: [] },
  redirect: "",
};
export const dynamic = 'force-dynamic';

export default function Signup() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(createUser, initialState);

  useEffect(() => {
    if (state.redirect) {
      toast.success("Sign up successful!");
      router.push(state.redirect);
    }
  }, [state.redirect, router]);

  return (
    <Container maxWidth="sm">
      <Card sx={{ marginTop: 10, marginBottom: 6, borderRadius: 2, boxShadow: 6 }}>
      <Typography variant="h4" component="h2" align="center">
     SignUp
</Typography>
        <CardContent>
          <Box
            component="form"
            action={formAction}
            display="flex"
            flexDirection="column"
            gap={2}
          >
            <TextField
              fullWidth
              label="Username"
              id="name"
              name="name"
              variant="outlined"
              required
              error={state.errors.name.length > 0}
              helperText={state.errors.name[0] || ""}
            />

            <TextField
              fullWidth
              label="Email"
              id="email"
              name="email"
              type="email"
              variant="outlined"
              required
              error={state.errors.email.length > 0}
              helperText={state.errors.email[0] || ""}
            />

            <TextField
              fullWidth
              label="Password"
              id="password"
              name="password"
              type="password"
              variant="outlined"
              required
              error={state.errors.password.length > 0}
              helperText={state.errors.password[0] || ""}
            />

<label>
    <input type="radio" name="role" value="user" defaultChecked />
    User
  </label>
  

            {state.message && (
              <Typography color="success.main" align="center">
                {state.message}
              </Typography>
            )}

           
            <Button type="submit" variant="contained" disabled={pending}>
              Sign Up
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
