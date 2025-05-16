"use client"
import { useParams } from 'next/navigation';
import UserPosts from '@/app/components/UserPosts'

import { Container } from '@mui/material';
export const dynamic = 'force-dynamic';
export default function UserPage(){
     const params = useParams();
        const userId = params?.userId as string;
       
        
        if (!userId) {
            return <p className="text-red-500">User ID is missing.</p>;
        }
    
   return(
    <div>
         <Container maxWidth="lg">
       
        <div><UserPosts userId={userId}/></div>
        </Container>
    </div>
   )
}
