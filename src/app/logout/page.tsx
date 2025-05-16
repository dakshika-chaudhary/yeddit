"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "../actions"; 
import toast from "react-hot-toast";
export const dynamic = 'force-dynamic';
export default function LogoutButton() {
    const router = useRouter();
  
    const handleLogout = async () => {
      const response = await logoutUser();
      if (response.success) {
        toast.success("Logged out successfully!");
        router.push("/login"); // Redirect after logout
      } else {
        alert("Logout failed. Try again!");
      }
    };
    return <button onClick={handleLogout}>Logout</button>;
}