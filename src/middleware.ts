import { NextRequest,NextResponse } from "next/server";
import { cookies } from 'next/headers'
import { decrypt } from '@/app/lib/session';

export async function middleware(request:NextRequest){
    
    const path = request.nextUrl.pathname
    const isPublicPath = path ==="/login" || path === "/signUp";
    const token = request.cookies.get("session")?.value||"";

    if(isPublicPath && token){
        return NextResponse.redirect(new URL('/',request.url));
    }

    if (!isPublicPath && !token) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if(path.startsWith("/admin")){
        const session = await decrypt(token);
        if(!session || session?.role !== "admin"){
            return NextResponse.redirect(new URL("/", request.url));  
        }
    }
     
    return NextResponse.next();
}

export const config = {
    matcher: [
         
        '/login',
        '/profile', 
        '/signUp',
        '/posts',
         '/media/:path*',
        //   '/admin/:path*'
    ], 
  }