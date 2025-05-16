import { NextRequest, NextResponse } from "next/server";
import { decrypt } from '@/app/lib/session';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("session")?.value || "";

  const isPublicPath = path === "/login" || path === "/signUp" || path==="/";

 


  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

 
  if (path.startsWith("/admin")) {
    const session = await decrypt(token);
    if (!session || session?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}


export const config = {
  matcher: [
   
    '/profile',
    '/posts',
   
    '/media/:path*',
    
  ],
};
