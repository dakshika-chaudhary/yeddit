


"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TablePagination, TableRow,
  IconButton, Button, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField
} from "@mui/material";
import { red } from "@mui/material/colors";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import Avatar from "@mui/material/Avatar";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import Image from "next/image";
import { toast } from "react-hot-toast";


import {
  deletedPost,
  deletedUser,
  makeUserAdmin,
  makeUserNormal,
  addNewUser,
  updateUserInfo
} from "@/app/actions";

export default function AdminDashboard({
  users,
  posts,
  currentUserID,
}: {
  users: any[];
  posts: any[];
  currentUserID: string;
}) {
  const postsPerPage = 6;
  const router = useRouter();

  const [page, setPage] = useState(1);
  const [textColor, setTextColor] = useState("black");
  const [userList, setUserList] = useState(users);
  const [postList, setPostList] = useState(posts);
  const loadMoreRef = useRef(null);
  const [alert, setAlert] = useState<{
    type: "error" | "warning" | "success";
    text: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "user",password:"" });
  const [editingUser, setEditingUser] = useState<any>(null);

  const openPost = (postId: string) => {
    router.push(`/media/${postId}`);
  };

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setPage((prev) =>
          prev < Math.ceil(posts.length / postsPerPage) ? prev + 1 : prev
        );
      }
    }, { threshold: 0.1 });

    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [posts.length]);

  const performDeletion = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      const res = await deletedUser(userId);
      if (res?.success) {
        setUserList(userList.filter((user) => user._id !== userId));
        toast.success("User deleted successfully");
      } else toast.error("Failed to delete user");
    }
  };

  const performPostDeletion = async (postId: string) => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      const res = await deletedPost(postId);
      if (res?.success) {
        setPostList(postList.filter((post) => post._id !== postId));
        toast.success("Post deleted successfully");
      } else toast.error("Failed to delete post");
    }
  };

  const handleModalOpen = (user = null) => {
    if (user && user.name && user.email && user.role) {
      setFormData({ name: user.name, email: user.email, role: user.role,password:"" });
      setEditingUser(user);
    } else {
      setFormData({ name: "", email: "", role: "user",password:"" });
      setEditingUser(null);
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleFormChange = (e: any) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };
  const handleFormSubmit = async () => {
    try {
      if (editingUser) {
        const res = await updateUserInfo({ userId: editingUser._id, ...formData })
        if(res.success){
          const updatedUsers = userList.map((u) =>
            u._id === editingUser._id ? res.user : u
        );
          setUserList(updatedUsers);
          toast.success("User updated!");
          handleModalClose();
        }
        else {
          toast.error(res.message || "Failed to update user");
        }
       
      } else {
        const res = await addNewUser(formData);
        if (res.success) {
          toast.success("User added!");
          setUserList((prev) => [...prev, res.user]);
          handleModalClose();
        } else {
          toast.error(res.message);
        }
      }
    } catch (err) {
      console.error("Error in handleFormSubmit:", err);
      toast.error("Something went wrong.");
    }
  };
  

  const columns = [
    { id: "name", label: "Name", minWidth: 100 },
    { id: "email", label: "Email", minWidth: 170 },
    { id: "role", label: "Role", minWidth: 100 },
    { id: "edit", label: "Edit", minWidth: 50 }, 
    { id: "delete", label: "Delete", minWidth: 50 },
  ];

  return (
    <Box sx={{ padding: 4 }} className="bg-gray-100 min-h-screen">
      <Typography variant="h4" className="font-bold mb-6 text-center">
        Admin Dashboard
      </Typography>

      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button variant="contained" onClick={() => handleModalOpen()}>
          Add New User
        </Button>
      </Box>

      {alert && (
        <Box sx={{ position: "fixed", bottom: 100, right: 20, zIndex: 9999 }}>
          <Alert severity={alert.type} sx={{ mb: 3, width: "100%" }}>
            {alert.text}
          </Alert>
        </Box>
      )}

      {/* Users Table */}
      <Box sx={{ mb: 8 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Users
        </Typography>
        <Paper sx={{ width: "100%" }}>
          <TableContainer sx={{ maxHeight: 440 }}>
            <Table stickyHeader aria-label="users table">
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell key={column.id} align="center">
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {userList.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell align="center">{user.name}</TableCell>
                    <TableCell align="center">{user.email}</TableCell>
                    <TableCell align="center">
                      {user.role}
                      {user._id !== currentUserID && (
                        <>
                          {user.role !== "admin" ? (
                            <Button
                              onClick={async () => {
                                const res = await makeUserAdmin(user._id);
                                if (res.success) {
                                  toast.success("User is now admin");
                                  setUserList((prev) =>
                                    prev.map((u) =>
                                      u._id === user._id ? { ...u, role: "admin" } : u
                                    )
                                  );
                                } else toast.error(res.message);
                              }}
                            >
                              Make Admin
                            </Button>
                          ) : (
                            <Button
                              onClick={async () => {
                                const res = await makeUserNormal(user._id);
                                if (res.success) {
                                  toast.success("User is now normal user");
                                  setUserList((prev) =>
                                    prev.map((u) =>
                                      u._id === user._id ? { ...u, role: "user" } : u
                                    )
                                  );
                                } else toast.error(res.message);
                              }}
                            >
                              Make User
                            </Button>
                          )}
                        </>
                      )}
                    </TableCell>
                    <TableCell align="center">
  <IconButton color="primary" onClick={() => handleModalOpen(user)}>
    <EditIcon />
  </IconButton>
</TableCell>
                    <TableCell align="center">
                      <IconButton color="error" onClick={() => performDeletion(user._id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Box>

      {/* Posts Section */}
      <Box>
        <Typography variant="h5" sx={{ mb: 2 }}>
          Posts
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {postList.slice(0, page * postsPerPage).map((post) => (
            <Card key={post._id} sx={{ maxWidth: "100%", mx: "auto", p: 2 }}>
              <CardHeader
                avatar={<Avatar sx={{ bgcolor: red[500] }}>{post.author?.[0]}</Avatar>}
                title={post.author}
                subheader={new Date(post.createdAt).toISOString()}
              />
              <Typography
                variant="h6"
                onClick={() => openPost(post._id)}
                onMouseEnter={() => setTextColor("red")}
                onMouseLeave={() => setTextColor("black")}
                sx={{ ml: 2, color: textColor, cursor: "pointer" }}
              >
                {post.title}
              </Typography>
              <CardContent>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    WebkitLineClamp: 4,
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
                    overflow: "hidden",
                    mx: "auto",
                    "&:hover": {
                      filter: "grayscale(20%) brightness(75%)",
                    },
                  }}
                >
                  <Image
                    src={post.thumbnail}
                    alt="Post Thumbnail"
                    width={600}
                    height={300}
                    style={{ borderRadius: "0.5rem", cursor: "pointer" }}
                    onClick={() => openPost(post._id)}
                  />
                </Box>
              )}
              <Box sx={{ display: "flex", justifyContent: "space-between", px: 2, py: 1 }}>
                <Typography>{post.readBy?.length || 0} views</Typography>
                <IconButton color="error" onClick={() => performPostDeletion(post._id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Card>
          ))}
          <div ref={loadMoreRef}></div>
        </Box>
      </Box>

      {/* Add/Edit User Modal */}
      <Dialog open={modalOpen} onClose={handleModalClose}>
        <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent>
          <TextField
            name="name"
            label="Name"
            fullWidth
            margin="dense"
            value={formData.name}
            onChange={handleFormChange}
          />
          <TextField
            name="email"
            label="Email"
            fullWidth
            margin="dense"
            value={formData.email}
            onChange={handleFormChange}
          />
          <TextField
  margin="dense"
  label="Password"
  name="password"
  type="password"
  fullWidth
  variant="outlined"
  value={formData.password}
  onChange={handleFormChange}
/>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose}>Cancel</Button>
          <Button variant="contained" onClick={handleFormSubmit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
