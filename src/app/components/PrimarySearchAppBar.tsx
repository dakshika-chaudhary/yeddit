

"use client";
import * as React from "react";
import { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  // InputBase,
  Menu,
  List,
  ListItem,
  Drawer,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";

import AccountCircle from "@mui/icons-material/AccountCircle";
import MoreIcon from "@mui/icons-material/MoreVert";
import Link from "next/link";
import LogoutButton from "../logout/page";




interface UserType {
  _id: string;
  role: string;
  name?: string;
  email?: string;
}

const UserMenuItems = ({ userId, onClose }: {  userId: UserType  | null; onClose: () => void }) => {

    return (
  <Box sx={{ minWidth: 180 }}>
    <List>
      {userId ? (
        <>  {console.log(`role is:${userId.role}`)}
           {userId.role === "admin" ? (
          
              <ListItem onClick={onClose}>
                <Link href="/admin/dashboard"  style={{textDecoration: "none"}}>Admin Dashboard</Link>
              </ListItem>
            ) : (
              console.log(`userId is: ${userId._id}`),
              userId._id ? (
                
                <ListItem onClick={onClose}>
                  <Link href={`/profile/${userId._id}`}  style={{textDecoration: "none"}}>Profile</Link>
                </ListItem>
              ) : null
             
            )}
      
          <ListItem onClick={onClose}>
            <Link href={`/users/${userId._id}` } style={{textDecoration: "none"}}>Your Posts</Link>
          </ListItem>
          <ListItem>
            <LogoutButton />
          </ListItem>
        </>
      ) : (
        <>
          <ListItem onClick={onClose}>
            <Link href="/login" style={{textDecoration: "none"}}>Login</Link>
          </ListItem>
          <ListItem onClick={onClose}>
            <Link href="/signUp" style={{textDecoration: "none"}}>Sign Up</Link>
          </ListItem>
        </>
      )}
    </List>
  </Box>
);
};

export const dynamic = 'force-dynamic';

export default function PrimarySearchAppBar({ userId }: { userId: UserType | null }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState<null | HTMLElement>(null);

  const isMenuOpen = Boolean(anchorEl);
  const isMobileMenuOpen = Boolean(mobileMenuAnchorEl);

  const toggleDrawer = (open: boolean) => () => setMobileOpen(open);
  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMobileMenuOpen = (event: React.MouseEvent<HTMLElement>) => setMobileMenuAnchorEl(event.currentTarget);
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchorEl(null);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
        <Toolbar>
          {/* Mobile Drawer Menu */}
          <IconButton size="large" color="inherit" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>

          {/* App Title */}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
            YEDDIT
          </Typography>

         
          <Box sx={{ display: { xs: "none", md: "flex",color:"white" }, alignItems: "center" }}>
            <Link href="/" style={{  textDecoration: "none",color: "white",marginRight: 16 }}>Home</Link>
            <Link href="/mostViewed" style={{ textDecoration: "none", color: "white",marginRight: 18 }}>Most Viewed</Link>
            <Link href="/newPosts" style={{  textDecoration: "none",color: "white",marginRight: 18 }}>New Posts</Link>
            <IconButton size="large" color="inherit" onClick={handleProfileMenuOpen}>
              <AccountCircle />
            </IconButton>
          </Box>

          {/* Mobile More Menu */}
          <Box sx={{ display: { xs: "flex", md: "none" } }}>
            <IconButton size="large" color="inherit" onClick={handleMobileMenuOpen}>
              <MoreIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Drawer for Mobile Navigation */}
      <Drawer anchor="left" open={mobileOpen} onClose={toggleDrawer(false)}>
        <Box sx={{ width: 250, padding: 2 }}>
          <List>
            <ListItem><Link href="/" style={{textDecoration: "none"}}>Home</Link></ListItem>
            <ListItem><Link href="/mostViewed" style={{textDecoration: "none"}}>Most Viewed</Link></ListItem>
            <ListItem><Link href="/newPosts" style={{textDecoration: "none"}}>New Posts</Link></ListItem>
            <UserMenuItems userId={userId} onClose={toggleDrawer(false)} />
          </List>
        </Box>
      </Drawer>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <UserMenuItems userId={userId} onClose={handleMenuClose} />
      </Menu>

      {/* Mobile Menu */}
      <Menu
        anchorEl={mobileMenuAnchorEl}
        open={isMobileMenuOpen}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <UserMenuItems userId={userId} onClose={handleMenuClose} />
      </Menu>
    </Box>
  );
}
