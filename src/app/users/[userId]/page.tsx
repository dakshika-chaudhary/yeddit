"use client"
import { useParams } from 'next/navigation';
import UserPosts from '@/app/components/UserPosts'
import { updatePost } from '@/app/actions';

import { Container } from '@mui/material';

export default function UserPage(){
     const params = useParams();
        const userId = params?.userId as string;
        console.log("Extracted userId from URL:",params.userId);
        
        if (!userId) {
            return <p className="text-red-500">User ID is missing.</p>;
        }
    console.log("first frontend",params.userId);
   return(
    <div>
         <Container maxWidth="lg">
       
        <div><UserPosts userId={userId}/></div>
        </Container>
    </div>
   )
}
