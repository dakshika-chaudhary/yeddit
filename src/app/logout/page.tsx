"use client";

import { useRouter } from "next/navigation";
import { logoutUser } from "../actions"; 

export default function LogoutButton() {
    const router = useRouter();
  
    const handleLogout = async () => {
      const response = await logoutUser();
      if (response.success) {
        router.push("/login"); // Redirect after logout
      } else {
        alert("Logout failed. Try again!");
      }
    };
    return <button onClick={handleLogout}>Logout</button>;
}