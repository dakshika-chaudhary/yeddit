
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

import { toast } from "react-hot-toast";
import NewPosts from "@/app/newPosts/components/NewPost";

import {
 
  deletedUser,
  makeUserAdmin,
  makeUserNormal,
  addNewUser,
  updateUserInfo,
} from "@/app/actions";

import { Postss } from "../../../../../types/postTypes";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  password?: string;
}


export const dynamic = 'force-dynamic';
export default function AdminDashboard({
  users,
  posts,
  currentUserID,
}: {
  users: User[];    
  posts: Postss[];
  currentUserID: string;
}) {
  const postsPerPage = 6;
  const router = useRouter();

  const [page,setPage] = useState(1);
   console.log(page)
 

  const [userList, setUserList] = useState<User[]>(users);
  

  const loadMoreRef = useRef(null);
  const [alert] = useState<{
    type: "error" | "warning" | "success";
    text: string;
  } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "user",
    password: "",
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const openPage = (postId: string) => {
    router.push(`/media/${postId}`);
  };
  console.log(openPage)
 

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) =>
            prev < Math.ceil(posts.length / postsPerPage) ? prev + 1 : prev
          );
        }
      },
      { threshold: 0.1 }
    );

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
        
        setUserList(userList.filter((user) => user && user._id !== userId));
        toast.success("User deleted successfully");
      } else {
        toast.error("Failed to delete user");
      }
    }
  };
  


  const handleModalOpen = (user: User | null) => {
    if (user && user.name && user.email && user.role) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        password: "",
      });
      setEditingUser(user);
    } else {
      setFormData({ name: "", email: "", role: "user", password: "" });
      setEditingUser(null);
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleFormChange = (e:  React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };


  const handleFormSubmit = async () => {
    try {
      if (editingUser) {
        const updatedData = {
          userId: editingUser._id,
          ...formData,
        };
        const res = await updateUserInfo(updatedData);
        if (res.success) {
          const updatedUsers = userList.map((u) =>
            u._id === editingUser._id ? res.user : u
          ).filter((user): user is User => user !== undefined); // Ensure no undefined values are added
          setUserList(updatedUsers);
          toast.success("User updated!");
          handleModalClose();
        } else {
          toast.error(res.message || "Failed to update user");
        }
      } else {
        const res = await addNewUser(formData);
        if (res.success) {
          toast.success("User added!");
          
          setUserList((prev) => [...prev, res.user].filter((user): user is User => user !== undefined)); 
          handleModalClose();
        } else {
          toast.error(res.message || "Failed to add user");
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
        <Button variant="contained" onClick={() => handleModalOpen(null)}>
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
                                      u._id === user._id
                                        ? { ...u, role: "admin" }
                                        : u
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
                                      u._id === user._id
                                        ? { ...u, role: "user" }
                                        : u
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
                      <IconButton
                        color="primary"
                        onClick={() => handleModalOpen(user)}
                      >
                        <EditIcon />
                      </IconButton>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="error"
                        onClick={() => performDeletion(user._id)}
                      >
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


<NewPosts posts={posts as Postss[]} />


{/* <NewPosts posts={postList as unknown  as Postss[]} /> */}
      {/* Modal for User Form */}
      <Dialog open={modalOpen} onClose={handleModalClose}>
        <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            name="name"
            label="Name"
            variant="outlined"
            value={formData.name}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="email"
            label="Email"
            variant="outlined"
            value={formData.email}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="role"
            label="Role"
            variant="outlined"
            value={formData.role}
            onChange={handleFormChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="password"
            label="Password"
            variant="outlined"
            type="password"
            value={formData.password}
            onChange={handleFormChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleModalClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleFormSubmit} color="primary">
            {editingUser ? "Save Changes" : "Add User"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box> 

  );
}

