'use server';

import mongoose from 'mongoose';

import { z } from 'zod';
import { IPost ,IUserLean,LoginState,UserType} from '../../types/postTypes';

import { hash,compare } from "bcryptjs";
import { connect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';  
import Post from '@/models/PostModel';
import { createSession } from "@/app/lib/session";
import { cookies } from "next/headers";
import { decrypt } from '@/app/lib/session';
import bcrypt from 'bcryptjs';
import axios from 'axios'

import { Postss } from '../../types/postTypes'; 
import { IUser } from '../../types/postTypes';
   connect();

 

const loginSchema = z.object({
    email: z.string().email({message:'Invalid email'}),
    password: z.string().min(6, { message: "Password must be at least 6 characters" })
})

const schema = z.object({
  name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters long.' })
    .trim(),
  email: z.string().email({ message: 'Please enter a valid email.' }).trim(),
  password: z
    .string()
    .min(8, { message: 'Be at least 8 characters long' })
    .regex(/[a-zA-Z]/, { message: 'Contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Contain at least one number.' })
    .regex(/[^a-zA-Z0-9]/, {
      message: 'Contain at least one special character.',
    })
    .trim(),
    role: z.enum(['user', 'admin']) 
  
});


type CreateUserState = {
  message: string;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    role?: string;
  };
};

export async function createUser( prevState: CreateUserState,formData: FormData) {
  const data = formData as unknown as globalThis.FormData;
  const validatedFields = schema.safeParse({
     name : data.get('name')?.toString(),
     email : data.get('email')?.toString(),
     password : data.get('password')?.toString(),
     role: data.get('role')?.toString() || 'user',
  });
  console.log(prevState);

  if (!validatedFields.success) {
    return { 
      message: "",  
      errors: {
        name: validatedFields.error.flatten().fieldErrors.name || [],
        email: validatedFields.error.flatten().fieldErrors.email || [],
        password: validatedFields.error.flatten().fieldErrors.password || [],
        role: data.get('role')?.toString() || 'user',
      }
    };
  }

  const {name, email, password,role } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return { 
        message: "User already exists. Please login." ,
        errors: {name:[], email: [], password: [] } ,
        redirect: "" 
      };
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await User.create({
       name,
        email,
         password:hashedPassword ,
         role,
        });
        

    const sessionToken = await createSession(newUser._id.toString());
    
   const cookieStore = await cookies();

    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 
      path: "/"
    });
    return { 
      message: "Signup successful!",
      errors: {name:[],email: [], password: []} ,
      redirect: role==='admin'? '/admin/dashboard':"/",};
  } catch (error) {
    console.error('Error creating user:', error);
    return { 
      message: "Signup failed. Please try again.",
      errors: {name:[],email: [], password: []} ,
      redirect: "",
    };
  }
}


export async function loginUser( _prevState: LoginState,formData: FormData) {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  
  const validatedFields = loginSchema.safeParse({ email, password });

  if (!validatedFields.success) {
    return { 
      message: "",  
      errors: {
        email: validatedFields.error.flatten().fieldErrors.email || [],
        password: validatedFields.error.flatten().fieldErrors.password || [],
      } 
    };
  }

  try {
   
    const existingUser = await User.findOne({ email});  
 
    if (!existingUser) {
      return { message: "User not found", errors: { email: [], password: [] } };
    }
    if (!existingUser.password) {
      return { message: "Invalid user data", errors: { email: [], password: [] } };
    }
      
    const isPasswordValid = await compare(password, existingUser.password);
    if (!isPasswordValid) {
      return { message: "Invalid password", errors: { email: [], password: [] } };
    }
    const cookieStore = await cookies(); 
    const sessionToken = await createSession(existingUser._id.toString());

     cookieStore.set('session', sessionToken, { 
      path:'/',
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) 
    });
    
    return { 
      message: "Login successful!",
      redirect: existingUser.role === "admin" ? '/admin/dashboard':"/",
      errors: { email: [], password: [] } 
    };
  } catch (error) {
    console.log("Login error:", error);
    return { 
      message: "Login failed. Please try again.",
       errors: { email: [], password: [] } 
      };
  }
}

interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user" | string; // Add more roles if needed
}

export async function getUserSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value || "";

    if (!sessionToken) {
      console.log("No session token found.");
      return null;
    }

    const sessionData = await decrypt(sessionToken);
   

    if (!sessionData?.userId) {
    
      return null;
    }

    const user = await User.findById(sessionData.userId);
    if (!user) {
      
      return null;
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    };
  } catch (error) {
    console.error("Error in getUserSession:", error);
    throw error;  // Rethrow error to allow higher-level handlers to manage it
  }
}


export async function deletedPost(postId:string){
  try{
    const session = await getUserSession();
    if(!session){
      return {success:false,message:"Unauthorized: Please log in to delete a post."};
    }
    const user = await User.findById(session.id);
    if(!user || user.role !== 'admin'){
      return {success:false,message:"Unauthorized: You don't have permission to delete this post,you are not admin."};
    }
    const deleted = await Post.findByIdAndDelete(postId);
    if (!deleted) {
      return { success: false, message: "Post not found or already deleted." };
    }
     return {success:true,message:"Post deleted successfully"};
    
  }
  catch(error){
    console.log("couldn't delete posts as an admin",error);
    return null
  }
}

export async function deletedUser(userId:string){
  try{
    const session = await getUserSession();

    if(!session){
      return {success:false,message:"Unauthorized: Please log in to delete a user."};
    }

    const user = await User.findById(session.id);

    if(!user || user.role !== 'admin'){
      return {success:false,message:"Unauthorized: You don't have permission to delete the user , you are not admin."};
    }
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return {
        success: false,
        message: "User not found or already deleted.",
      };
    }
    
     return {success:true,message:"User deleted successfully"};
    
  }
  catch(error){
    console.log("couldn't delete posts as an admin",error);
    return null
  }
}

export async function getUsers(){
  try{
    const session = await getUserSession();
    if(!session){
      return {
        success:false,
        message:"Unauthorized: Please log in to delete a user."};
    }
    const user = await User.findById(session.id);
    if(!user || user.role !== 'admin'){
      return {success:false,message:"Unauthorized: You don't have permission to delete the user , you are not admin."};
    }

     const users = await User.find({}).select("id name email role").lean();
     if(!users || users.length==0){
      console.log("No users found in the database.");
      return null;
     }

     const usersPosts = await Post.find({}).populate("userId").lean();
     const requiredUsers = users.filter((user)=>user)


     const formattedUsers = requiredUsers.map((user) => {
     const formattedPosts = usersPosts
        .filter((post) => post.userId?._id?.toString() === (user._id as string).toString())
        .map((post) => ({
          _id: (post._id as string).toString(),
          title: post.title?.title?.toString() || post.title?.toString() || "",
          userId: post.userId?._id?.toString() || "Unknown",
          createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
          updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
          description: post.description
            ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
            : "",
          thumbnail:
            post.thumbnail ||
            (post.youtubeCode
              ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
              : null),
          readBy: Array.isArray(post.readBy)
            ? post.readBy.map((id) => id.toString())
            : [],
          likes: post.likes
            ? post.likes.map((like: { userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString())
            : [],
          dislikes: post.dislikes
            ? post.dislikes.map((dislike:{ userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString())
            : [],
         
           
            
        comments: post.comments?.map((comment: {
            _id: mongoose.Types.ObjectId | string;
            user: mongoose.Types.ObjectId | string | IUser;
            text: string;
            createdAt: Date;
          }) => ({
            _id: comment._id.toString(),
            userId:
              comment.user && typeof comment.user === 'object' && '_id' in comment.user
                ? comment.user._id.toString()
                : comment.user?.toString() || 'Unknown', // Add null or undefined check here
            text: comment.text,
            username:
              comment.user && typeof comment.user === 'object' && 'username' in comment.user
                ? comment.user.username
                : 'Unknown',
            createdAt: comment.createdAt?.toISOString?.() || '',
          })) || [],

        }));

      return {
        _id: (user._id as string).toString(),
        name: user.name || "Unknown",
        email: user.email || "Unknown",
        role: user.role || "Unknown",
        lastSeenAt: user.lastSeenAt ? new Date(user.lastSeenAt).toISOString() : null,
        posts: formattedPosts,
      };
    });

     return {success:true,users:formattedUsers,message:"Users fetched successfully"};

  }
  catch(err){
    console.error("Error fetching users:",err);
  }
}

export async function createPost(prevState:unknown , formData:FormData){
  const session = await getUserSession();
  if (!session) {
    return { error: "Unauthorized: Please log in to create a post." };
  }

  if (!(formData instanceof FormData)) {
    return { error: "Invalid form submission" };
  }
  console.log(prevState);


const youtubeCode = formData.get("youtubecode")?.toString().trim();
const userId = formData.get("userId")?.toString().trim();

  if(!youtubeCode){
    return {
      error:'All fields are required'
    }
  }
 
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([\w-]+)/;
  const matched = youtubeCode.match(regex);
  const newURL = matched ? matched[1]:null;


  if (!newURL) {
    return { error: 'Invalid YouTube URL. Please provide a valid link.' };
}

try{
   const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${newURL}&key=${process.env.YOUTUBE_API_KEY}`)
  
 

   if(!response.data.items.length){
    return { error: "YouTube video not found. Please check the URL." };
   }

   const videoData = response.data.items[0].snippet;
   const title = videoData.title;
   const description = videoData.description;

    const thumbnailURL = `https://img.youtube.com/vi/${newURL}/maxresdefault.jpg`;



    const newPost = await Post.create({ 
            title,
            description,
            youtubeCode: newURL,
            thumbnail: thumbnailURL,
            userId,
          });

   return { _id: newPost._id.toString(),message: "✅ Post created successfully" };
}


catch(error){

  console.log("Error creating post:", error);
  return { error: "Failed to create post" };
}
}


export async function logoutUser() {
  try {
    
     const cookieStore = await  cookies();
     
     cookieStore.set("session", "", { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0), 
        path:"/"
       
        
     });
   
     return { success: true, redirect: "/login" };
  } catch (error) {
     console.error("Logout error:", error);
     return { success: false, error: "Logout failed" };
  }
}

export async function getNewPosts(): Promise<{ posts: Postss[] }> {
  try {
    const allposts = await Post.find().sort({ createdAt: -1 }).lean();
    if (!allposts || allposts.length === 0) {
      
      return { posts: [] };
    }
    const formattedPosts = allposts.map(post => ({
      _id: (post._id as string).toString(),
      userId: post.userId?._id?.toString() || post.userId.toString(),
      title: post.title?.title?.toString() || post.title.toString(),
      username: post.userId?.username || "Unknown",
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      description: post.description ? post.description.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '') : "",
      thumbnail: post.thumbnail || (post.youtubeCode ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg` : null),
      readBy: Array.isArray(post.readBy) ? post.readBy.map(id => id.toString()) : [],
      likes: post.likes ? post.likes.map((like: { userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString()) : [],
      dislikes: post.dislikes ? post.dislikes.map((dislike: { userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString()) : [],
      
      comments: post.comments?.map((comment: {
        _id: mongoose.Types.ObjectId | string;
        user: mongoose.Types.ObjectId | string | IUser | undefined;
        text: string;
        createdAt: Date;
      }) => ({
        _id: comment._id.toString(),
      
        userId:
        comment.user && typeof comment.user === 'object' && '_id' in comment.user
          ? comment.user._id.toString()
          : typeof comment.user === 'string'
            ? comment.user
            : 'Unknown',
        text: comment.text,
        username: typeof comment.user === 'object' && 'username' in comment.user
          ? comment.user.username
          : 'Unknown',
        createdAt: comment.createdAt?.toISOString?.() || '',
      })) || [],
      
    }));

    return { posts: formattedPosts };
  } catch (error) {
    console.log("Error fetching posts:", error);
    return { posts: [] };
  }
}

type FormattedPost = {
  _id: string;
  title: string;
  userId: string | mongoose.Types.ObjectId;
  createdAt: string | null;
  updatedAt: string | null;
  likes: string[];
  dislikes: string[];
  readBy: string[];
  description: string;
  youtubeCode: string;
  thumbnail?: string;
  comments: {
    _id: string;
    user: {
      _id: string;
      name: string;
    };
    text: string;
    createdAt: string | null;
  }[];
};

interface PopulatedComment {
  _id: string;
  user: {
    _id: string;
    name: string;
  };
  text: string;
  createdAt: string | null;
}



export async function getSpecificPosts(
  postid?: string,
  userId?: string
): Promise<FormattedPost | { error: string }> {
  try {
    // console.log("Fetching post with:", { postid, userId });

    if (!postid || !userId) {
      return { error: "Post ID and User ID are required" };
    }

    if (!postid.match(/^[0-9a-fA-F]{24}$/)) {
      return { error: "Invalid Post ID format" };
    }

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return { error: "Invalid User ID format" };
    }

    const postObjectId = new mongoose.Types.ObjectId(postid);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const post = await Post.findById(postObjectId)
      .populate("userId", "_id name")
      .populate("comments.userId", "_id name")
      .lean<IPost>();

    if (!post) {
      return { error: "Post not found" };
    }

    await Post.updateOne(
      { _id: postObjectId },
      { $addToSet: { readBy: userObjectId } }
    );

    const formattedPost: FormattedPost = {
      _id: post._id.toString(),
      title: post.title || "",
      userId: (post.userId as mongoose.Types.ObjectId | { _id: string })._id.toString(),
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      likes: post.likes?.map(like =>
        typeof like.userId === "object"
          ? like.userId._id?.toString?.() || ""
          : like.userId?.toString?.() || ""
      ) || [],
      dislikes: post.dislikes?.map(dislike =>
        typeof dislike.userId === "object"
          ? dislike.userId._id?.toString?.() || ""
          : dislike.userId?.toString?.() || ""
      ) || [],
      readBy: post.readBy?.map(id =>
        typeof id === "object" ? id._id?.toString?.() || "" : id?.toString?.() || ""
      ) || [],
      description: post.description || "",
      youtubeCode: post.youtubeCode || "",
      thumbnail: post.thumbnail,
      comments: (post.comments || []).map(comment => {
  const user = comment.user;
  const userId =
    typeof user === "object" && user !== null && "_id" in user
      ? user._id.toString()
      : typeof user === "string"
        ? user
        : "Unknown";

  const userName =
    typeof user === "object" && user !== null && "name" in user
      ? user.name
      : "Anonymous";

  return {
    _id: comment._id.toString(),
    user: {
      _id: userId,
      name: userName,
    },
    text: comment.text || "",
    createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : null,
  };
}) as PopulatedComment[]

    };

    return formattedPost;
  } catch (error) {
    console.error("Error fetching post:", error);
    return { error: "Failed to fetch post" };
  }
}



export async function incrementLikes(postId: string) {
  try {
    // await connect();
    const session = await getUserSession();

    if (!session) {
     
      return { error: "Unauthorized: Please log in to like posts." };
    }

    if (!postId) {
    
      return null;
    }

    const userId = session.id;
    if (!userId) {
      console.error("userId is missing");
      return null;
    }



    const post = await Post.findById(postId);
    if (!post) {
      
      return null;
    }

   
    if (!Array.isArray(post.likes)) {
     
      post.likes = [];
    }

 
    if (post.likes.some((like: { userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString() === userId)) {
      
      return { likes: post.likes.length, dislikes: post.dislikes.length };
    }

    
    if (post.dislikes.some((dislike: { userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString() === userId)) {
      post.dislikes = post.dislikes.filter((dislike:{ userId: mongoose.Types.ObjectId | string | IUser } ) => dislike.userId?.toString() !== userId);
      console.log("User removed from dislikes");
    }

    post.likes.push({ userId: new mongoose.Types.ObjectId(userId), createdAt: new Date() });


    await post.save();
   

    return { likes: post.likes.length, dislikes: post.dislikes.length };
  } catch (error) {
    console.log("Failed to increment Likes:", error);
    return { error: "Failed to update likes" };
  }
}

export async function decrementLikes(postId: string) {
  try {
    // await connect();
    const session = await getUserSession();

    if (!session) {
      
      return { error: "Unauthorized: Please log in to dislike posts." };
    }

    if (!postId) {
      
      return null;
    }

    const userId = session.id;
    if (!userId) {
      console.error("userId is missing");
      return null;
    }

 

    const post = await Post.findById(postId);
    if (!post) {
      console.log("No post found to be disliked");
      return null;
    }

    
    if (!Array.isArray(post.likes)) {
     
      post.likes = [];
    }
    if (!Array.isArray(post.dislikes)) {
      
      post.dislikes = [];
    }

  
    if (post.dislikes.some((dislike: { userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString() === userId)) {
      
      return { likes: post.likes.length, dislikes: post.dislikes.length };
    }

    post.likes = post.likes.filter((like: { userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString() !== userId);
    post.dislikes.push({ userId: new mongoose.Types.ObjectId(userId), createdAt: new Date() });

    

    await post.save();
   

    return { likes: post.likes.length, dislikes: post.dislikes.length };
  } catch (error) {
    console.log("Failed to decrement Likes:", error);
    return { error: "Failed to update dislikes" };
  }
}




export async function getUserPosts(userId:string) {
  try{
   

     const posts = await Post.find({userId}).sort({createdAt:-1}).lean();
     return JSON.parse(JSON.stringify(posts));
  
  }
  catch(error){
    console.error("Error fetching specific user's posts:", error);
    return [];
  }

}

export async function getUserDetails(userId:string){
  
  try{
    

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      
      return null;
    }
    
   
    const user = await User.findOne({ _id: userId })
    .select("name email _id role")
    .lean<IUserLean>();

    if (!user) {
      console.log("User not found.");
      return null;
    }

    return {
      _id: user._id.toString(), // Convert ObjectId to string
      username: user.name,
      email: user.email,
      role:user.role,
    };
  }
  catch (error) {
    console.error("Error fetching user details:", error);
    return null;
}
}

export async function updatePost(postId:string,updatedData:{title:string,description:string}){
  try{
  // await connect();

  const updatedPost = await Post.findByIdAndUpdate(postId,updatedData,{ new: true }).lean();
  return updatedPost ? JSON.parse(JSON.stringify(updatedPost)):null;;
  }
  catch(error){
    console.log("couldn't update",error);
    return null
  }
}


export async function DeletePost(postId: string) {
  try {
    const user = await getUserSession();

    if (!user) {
      return {
        success: false,
        message: "Unauthorized: Please log in to delete a post.",
      };
    }

   
    const post = await Post.findById(postId);
    if (!post) {
      return {
        success: false,
        message: "Post not found.",
      };
    }

    if (user.role !== 'admin' && String(post.userId) !== String(user.id)) {
      return {
        success: false,
        message: "Unauthorized: You don't have permission to delete this post.",
      };
    }

    await Post.findByIdAndDelete(postId);
    return {
      success: true,
      message: "Post deleted successfully.",
    };
  } catch (error) {
    console.log("Couldn't delete post", error);
    return {
      success: false,
      message: "Server error. Failed to delete post.",
    };
  }
}


export default async function DeleteUser(userId:string){
try{
    
  const user = await getUserSession();
  if(!user){
    return {
      success:false,
      message:"Unauthorized: Please log in to delete a user."};
  }
  
 if(user.role === 'admin'){
  const deletedUser = await User.findOneAndDelete({_id:userId});
  if(!deletedUser){
    return {success:false,message:"Couldn't delete the user"};
  }
 }
  else{
    return {success:false,message:"Unauthorized: You don't have permission to delete this user."};
  }
    
    return {success:true,message:"Admin deleted UserId successfully"};

}
  catch(error){
    console.log("couldn't delte user",error);
    return null;
  }

}

export async function updatedUserLastSeen(userId: string) {
  try {
    // await connect();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { lastSeenAt: new Date() }, 
      { new: true }
    ).lean<UserType>();  
  
    return updatedUser;
  } catch (error:unknown) {
    console.error("Error updating user's lastSeenAt:", error);
    return null;
  }
}

export async function getUnreadPostsCount(){
  try{
    
    const session = await getUserSession();
    if(!session)return {count:0};

    const userId = session.id ;
    
    const unreadCount = await Post.countDocuments({ readBy: { $ne: userId } });
    return { count: unreadCount };

  }
  catch(error:unknown){
    console.error("Error fetching unread posts:", error);
    return { count: 0 };
  }
}

export async function markPostAsRead(postId:string){
  try{

     const session = await getUserSession();
     if (!session) return { error: "User not logged in" };

    const userId = session.id;

    const post = await Post.findById(postId);
    if (!post) return { error: "Post not found" };

    if (!post.readBy) { 
      post.readBy = []; 
    }

    if(!post.readBy.includes(userId)){
      await Post.updateOne({_id:postId},{ $push: { readBy: userId } })

    }

    return { success: true };
  }
  catch(error:unknown){
    console.error("Error marking post as read:", error);
    return { error: "Failed to mark post as read" };
  }
}

export async function getPostsByToday(){
  // await connect();
 try{
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // Start of today (midnight)

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today (11:59:59 PM)

 
const posts = await Post.find({
  createdAt: { $gte: startDate, $lte: endDate }
})
.populate("userId")
.sort({createdAt:-1})
.lean()as unknown as (IPost & { userId: IUser | string })[];

    if (!posts || posts.length === 0) {
      console.log("No posts found for this month.");
      return [];
    }
  

    function formatPosts(posts: (IPost & { userId: IUser | string })[]): Postss[] {
      return posts.map(post => ({
        _id: post._id.toString(),
        userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
        title: post.title.toString(),
        username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
        updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
        description: post.description
          ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
          : "",
        thumbnail: post.thumbnail || (post.youtubeCode
          ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
          : null),
        readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
        likes: post.likes?.map(like =>
          typeof like.userId === "string"
            ? like.userId
            : (like.userId as IUser)._id?.toString?.() || ""
        ) || [],
        dislikes: post.dislikes?.map(dislike =>
          typeof dislike.userId === "string"
            ? dislike.userId
            : (dislike.userId as IUser)._id?.toString?.() || ""
        ) || [],
        comments: post.comments?.map(comment => ({
          _id: comment._id.toString(),
          userId: typeof comment.user === "string"
            ? comment.user
            : (comment.user as IUser)._id.toString(),
          text: comment.text,
          username: typeof comment.user === "string"
            ? "Anonymous"
            : (comment.user as IUser)?.name || "Anonymous",
          createdAt: comment.createdAt?.toISOString?.() || "",
        })) || [],
      }));
    }
    
    return formatPosts(posts);
 }
 catch(error){
     console.log("Error in fetching the posts of today:",error);
     return [];
 }
}

export async function getPopularPostsByToday(): Promise<Postss[]> {
  try {
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of today (midnight)

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999); // End of today (11:59:59 PM)

    const posts = await Post.find({
      createdAt: { $gte: startDate, $lte: endDate },
    })
      .populate("userId")
      .sort({ likes: -1 })
      .lean() as unknown as (IPost & { userId: IUser | string })[];;

    if (!posts || posts.length === 0) {
      console.log("No posts found for today.");
      return [];
    }
   
    function formatPosts(posts:(IPost & { userId: IUser | string })[]): Postss[] {
      return posts.map(post => ({
      
        _id: post._id.toString(),
        userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
        title: post.title.toString(),
        username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
        updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
        description: post.description
          ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
          : "",
        thumbnail: post.thumbnail || (post.youtubeCode
          ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
          : null),
          readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
        likes: post.likes
          ? post.likes.map((like:  { userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString())
          : [],
        dislikes: post.dislikes
          ? post.dislikes.map((dislike:  { userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString())
          : [],
     
        comments: post.comments?.map(comment => ({
          _id: comment._id.toString(),
          userId: typeof comment.user === "string"
            ? comment.user
            : (comment.user as IUser)._id.toString(),
          text: comment.text,
          username: typeof comment.user === "string"
            ? "Anonymous"
            : (comment.user as IUser)?.name || "Anonymous",
          createdAt: comment.createdAt?.toISOString?.() || "",
        })) || [],
      }));
    }
    
   
  return formatPosts(posts);
  }
  catch(error){
    console.log("Error fetching posts",error);
    return [];
  }
}

export async function getPostsByYesterday(){
  // await connect();
  try{
   const  startDate = new Date();
   startDate.setDate(startDate.getDate() - 1); // Go to yesterday
startDate.setHours(0, 0, 0, 0); // Midnight of yesterday

const endDate = new Date();
endDate.setDate(endDate.getDate() - 1); // Go to yesterday
endDate.setHours(23, 59, 59, 999); // 11:59:59 PM of yesterday

const posts = await Post.find({
  createdAt: { $gte: startDate, $lte: endDate }
})
.populate("userId")
.sort({createdAt:-1}).lean() as unknown as (IPost & { userId: IUser | string })[];

if (!posts || posts.length === 0) {
  console.log("No posts found for this month.");
  return [];
}


function formatPosts(posts:(IPost & { userId: IUser | string })[]): Postss[] {
  return posts.map(post => ({
    _id: post._id.toString(),
    userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
    title: post.title.toString(),
    
 
    readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
    description: post.description
      ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
      : "",
    thumbnail: post.thumbnail || (post.youtubeCode
      ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
      : null),
    
    username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
    likes: post.likes ? post.likes.map((like:  { userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString()) : [],
    dislikes: post.dislikes ? post.dislikes.map((dislike:  { userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString()) : [],
    comments: post.comments?.map(comment => ({
      _id: comment._id.toString(),
      userId:
  typeof comment.user === "string"
    ? comment.user
    : comment.user && "_id" in comment.user
      ? comment.user._id.toString()
      : "unknown",

      text: comment.text,
      username: typeof comment.user === "string"
        ? "Anonymous"
        : (comment.user as IUser)?.name || "Anonymous",
      createdAt: comment.createdAt?.toISOString?.() || "",
    })) || [],
  }));
}

  return formatPosts(posts);
  }
  catch(error){
    console.log("Error fetching posts",error);
    return [];
  }
}

export async function getPopularPostsByYesterday(){

  try{
   const  startDate = new Date();
   startDate.setDate(startDate.getDate() - 1); 
startDate.setHours(0, 0, 0, 0);

const endDate = new Date();
endDate.setDate(endDate.getDate() - 1);
endDate.setHours(23, 59, 59, 999);

const posts = await Post.find({
  createdAt: { $gte: startDate, $lte: endDate }
})
.populate("userId")
.sort({likes:-1}).lean() as unknown as (IPost & { userId: IUser | string })[];

if (!posts || posts.length === 0) {
  console.log("No posts found for this month.");
  return [];
}

function formatPosts(posts:(IPost & { userId: IUser | string })[]): Postss[] {
  return posts.map(post => ({
    
    _id: post._id.toString(),
    userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
    title: post.title.toString(),
    username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
    description: post.description
      ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
      : "",
    thumbnail: post.thumbnail || (post.youtubeCode
      ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
      : null),
      readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
   
    likes: post.likes ? post.likes.map((like:{ userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString()) : [],
    dislikes: post.dislikes ? post.dislikes.map((dislike:{ userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString()) : [],
    
    comments: post.comments?.map(comment => ({
      _id: comment._id.toString(),
      userId: typeof comment.user === "string"
        ? comment.user
        : (comment.user as IUser)._id.toString(),
      text: comment.text,
      username: typeof comment.user === "string"
        ? "Anonymous"
        : (comment.user as IUser)?.name || "Anonymous",
      createdAt: comment.createdAt?.toISOString?.() || "",
    })) || [],
  }));
}

  return formatPosts(posts);
  }
  catch(error){
    console.log("Error fetching posts",error);
    return [];
  }
}

export async function getPostsByWeek(){
  
try{
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate()-startOfWeek.getDay()+1);
  startOfWeek.setHours(0,0,0,0);

  const endOfWeek = new Date(); // Today
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const posts =  await Post.find({
    createdAt: { $gte: startOfWeek, $lte: endOfWeek },
  })
  .populate("userId")
  .sort({createdAt:-1})
  .lean()as unknown as (IPost & { userId: IUser | string })[];
  if (!posts || posts.length === 0) {
    console.log("No posts found for this month.");
    return [];
  }

  function formatPosts(posts:(IPost & { userId: IUser | string })[]): Postss[] {
    return posts.map(post => ({
      
      _id: post._id.toString(),
    userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
    title: post.title.toString(),
    username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      description: post.description
        ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
        : "",
      thumbnail: post.thumbnail || (post.youtubeCode
        ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
        : null),
      // readBy: post.readBy?.map((id:any) => id.toString()) || [],
      readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
      likes: post.likes ? post.likes.map((like:{ userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString()) : [],
      dislikes: post.dislikes ? post.dislikes.map((dislike:{ userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString()) : [],
     
      comments: post.comments?.map(comment => ({
        _id: comment._id.toString(),
        userId: typeof comment.user === "string"
  ? comment.user
  : comment.user && (comment.user as IUser)._id
    ? (comment.user as IUser)._id.toString()
    : "UnknownUser",
text: comment.text,

       
        username: typeof comment.user === "string"
          ? "Anonymous"
          : (comment.user as IUser)?.name || "Anonymous",
        createdAt: comment.createdAt?.toISOString?.() || "",
      })) || [],
    }));
  }
  
    return formatPosts(posts);
}
catch(error){
  console.log("Errors while fetching the data from the backend for month: ",error);
  return [];
}

}


export async function getPopularPostsByWeek(){
 
try{
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate()-startOfWeek.getDay()+1);
  startOfWeek.setHours(0,0,0,0);

  const endOfWeek = new Date(); // Today
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const posts =  await Post.find({
    createdAt: { $gte: startOfWeek, $lte: endOfWeek },
  })
  .populate("userId")
  .sort({likes:-1})
  .lean()as unknown as (IPost & { userId: IUser | string })[];
  if (!posts || posts.length === 0) {
    console.log("No posts found for this month.");
    return [];
  }

  function formatPosts(posts:(IPost & { userId: IUser | string })[]): Postss[] {
    return posts.map(post => ({
      _id: post._id.toString(),
      userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
      title: post.title.toString(),
      username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
      
    
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      description: post.description
        ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
        : "",
      thumbnail: post.thumbnail || (post.youtubeCode
        ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
        : null),
     
      readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
      likes: post.likes ? post.likes.map((like:{ userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString()) : [],
      dislikes: post.dislikes ? post.dislikes.map((dislike:{ userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString()) : [],
     
      comments: post.comments?.map(comment => ({
        _id: comment._id.toString(),
        userId: typeof comment.user === "string"
          ? comment.user
          : (comment.user as IUser)._id.toString(),
        text: comment.text,
        username: typeof comment.user === "string"
          ? "Anonymous"
          : (comment.user as IUser)?.name || "Anonymous",
        createdAt: comment.createdAt?.toISOString?.() || "",
      })) || [],
    }));
  }
  
    return formatPosts(posts);
}
catch(error){
  console.log("Errors while fetching the data from the backend for month: ",error);
  return [];
}

}

export async function getPostsByMonth(){

try{
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0,0,0,0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth()+1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23,59,59,999);

  const posts = await Post.find({
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  }).populate("userId")
  .sort({ likes: -1 })
  .lean() as unknown as (IPost & { userId: IUser | string })[];

  if (!posts || posts.length === 0) {
    
    return [];
  }

  
  function formatPosts(posts:(IPost & { userId: IUser | string })[]): Postss[] {
    return posts.map(post => ({

      _id: post._id.toString(),
      userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
      title: post.title.toString(),
      username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      description: post.description
        ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
        : "",
      thumbnail: post.thumbnail || (post.youtubeCode
        ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
        : null),
   
      readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
      likes: post.likes ? post.likes.map((like:{ userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString()) : [],
      dislikes: post.dislikes ? post.dislikes.map((dislike:{ userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString()) : [],
      
      comments: post.comments?.map(comment => ({
        _id: comment._id.toString(),
        userId: typeof comment.user === "string"
  ? comment.user
  : comment.user && comment.user._id
    ? comment.user._id.toString()
    : "anonymous",
       
        text: comment.text,
      
        username: typeof comment.user === "string"
          ? "Anonymous"
          : (comment.user as IUser)?.name || "Anonymous",
        createdAt: comment.createdAt?.toISOString?.() || "",
      })) || [],
    }));
  }
  

    return formatPosts(posts);
}
catch(error){
  console.log("Error while fetching the data for the month:",error);
  return [];
}
}



export async function getPopularPostsByMonth(){
 
  try{
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0,0,0,0);
  
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth()+1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23,59,59,999);
  
    const posts = await Post.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
    }).populate("userId")
    .sort({ likes: -1 })
    .lean() as unknown as (IPost & { userId: IUser | string })[];
  
    
    if (!posts || posts.length === 0) {
      console.log("No posts found for this month.");
      return [];
    }
  
    function formatPosts(posts:(IPost & { userId: IUser | string })[]): Postss[] {
      return posts.map(post => ({
       
        _id: post._id.toString(),
        userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
        title: post.title.toString(),
        username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
        updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
        description: post.description
          ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
          : "",
        thumbnail: post.thumbnail || (post.youtubeCode
          ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
          : null),
          readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
        likes: post.likes ? post.likes.map((like:{ userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString()) : [],
        dislikes: post.dislikes ? post.dislikes.map((dislike:{ userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString()) : [],
        
        comments: post.comments?.map(comment => ({
          _id: comment._id.toString(),
          userId: typeof comment.user === "string"
  ? comment.user
  : comment.user && (comment.user as IUser)._id
    ? (comment.user as IUser)._id.toString()
    : "UnknownUser",
  
          text: comment.text,
          username: typeof comment.user === "string"
            ? "Anonymous"
            : (comment.user as IUser)?.name || "Anonymous",
          createdAt: comment.createdAt?.toISOString?.() || "",
        })) || [],
      }));
    }
    
      return formatPosts(posts);
  }
  catch(error){
    console.log("Error while fetching the data for the month:",error);
    return [];
  }
}

export async function getPopularPosts() {
  try { 
    const allposts = await Post.find()
    .populate('userId')
    .populate('likes.userId')
    .populate('dislikes.userId')
    .populate('comments.userId')
    .sort({ likes: -1 })
    .lean() as unknown as (IPost & { userId: IUser | string })[];

    if (!allposts || allposts.length === 0) {
      console.log("No posts found");
      
      return [];
    }
 
    function formatPosts(posts:(IPost & { userId: IUser | string })[]): Postss[] {
      return posts.map(post => {
        return {
          _id: post._id.toString(),
          userId: typeof post.userId === "string" ? post.userId : post.userId?._id?.toString() || "unknown-user",
          title: post.title.toString(),
          username: typeof post.userId === "string" ? "Unknown" : post.userId?.name || "Unknown",
          createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
          updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
          description: post.description
            ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
            : "",
          thumbnail: post.thumbnail || (post.youtubeCode
            ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
            : null),
          readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
          likes: post.likes ? post.likes.map((like:{ userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString?.() || like.toString()) : [],
          dislikes: post.dislikes ? post.dislikes.map((dislike:{ userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString?.() || dislike.toString()) : [],
          likesCount: post.likes?.length || 0,
          dislikesCount: post.dislikes?.length || 0,
          commentsCount: post.comments?.length || 0,
        
          comments: post.comments?.map(comment => ({
            _id: comment._id.toString(),
            userId: typeof comment.user === "string" ? comment.user
    : comment.user && comment.user._id
      ? comment.user._id.toString()
      : "UnknownUser",
             
            text: comment.text,
            
            username: typeof comment.user === "string"
              ? "Anonymous"
              : (comment.user as IUser)?.name || "Anonymous",
            createdAt: comment.createdAt?.toISOString?.() || "",
          })) || [],
          
        };
      });
    }
    return formatPosts(allposts);
  } catch (error) {
    console.log("Error fetching posts", error);
    return [];
  }
}

export async function getPost(postId: string): Promise<Postss | null> {
  try {
    const post = await Post.findById(postId).populate('comments.user', 'name').lean<IPost & { userId: IUser | string }>();
    if(!post){
      console.log("Post not found");
      return null;
    }

      const formattedPosts = {
       
        _id: post._id.toString(),
        userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
        title: post.title.toString(),
        username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
        updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
        description: post.description
          ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
          : "",
        thumbnail: post.thumbnail || (post.youtubeCode
          ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
          : null),
         
          readBy: (post.readBy ?? []).map(id => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
          likes: post.likes ? post.likes.map((like:{ userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString()) : [],
          dislikes: post.dislikes ? post.dislikes.map((dislike:{ userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString()) : [],
         
          comments: post.comments?.map(comment => ({
            _id: comment._id.toString(),
          
            userId: typeof comment.user === "string"
  ? comment.user
  : comment.user && comment.user._id
    ? comment.user._id.toString()
    : "Unknown",

            text: comment.text,
            username: typeof comment.user === "string"
              ? "Anonymous"
              : (comment.user as IUser)?.name || "Anonymous",
            createdAt: comment.createdAt?.toISOString?.() || "",
          })) || [],
      };
  
      return formattedPosts;
  }
  catch(error){
     console.error("getPost error:", error);
    throw new Error("Failed to fetch post");
  }
}

export async function getLikedPosts() {
  
  try{

    const allPosts = await Post.aggregate([
      {
        $addFields:{
          likesCount:{$size:{ $ifNull: ["$likes", []] }}
        }
      },
      {$sort :{likesCount :-1}}
    ])

    if (!allPosts || allPosts.length === 0) {
      console.log("No posts found");
      return { posts: [] };
    }

    const formattedPosts = allPosts.map(post => ({
     
      _id: post._id.toString(),
      userId: typeof post.userId === "string" ? post.userId : post.userId._id.toString(),
      title: post.title.toString(),
      username: typeof post.userId === "string" ? "Unknown" : post.userId.name || "Unknown",
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      description: post.description
        ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
        : "",
      thumbnail: post.thumbnail || (post.youtubeCode
        ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
        : null),
       
        readBy: (post.readBy ?? []).map((id: string | IUser) => typeof id === "string" ? id : (id as IUser)._id?.toString?.() || ""),
        likes: post.likes ? post.likes.map((like:{ userId: mongoose.Types.ObjectId | string | IUser }) => like.userId?.toString()) : [],
        dislikes: post.dislikes ? post.dislikes.map((dislike:{ userId: mongoose.Types.ObjectId | string | IUser }) => dislike.userId?.toString()) : [],
       
        comments: post.comments?.map((comment: {
          _id: mongoose.Types.ObjectId;
          user: string | IUser;
          text: string;
          createdAt: Date;
        }) => ({
          _id: comment._id.toString(),
          userId: typeof comment.user === "string"
            ? comment.user
            : (comment.user as IUser)._id.toString(),
          text: comment.text,
          username: typeof comment.user === "string"
            ? "Anonymous"
            : (comment.user as IUser)?.name || "Anonymous",
          createdAt: comment.createdAt?.toISOString?.() || "",
        })) || [],
        
    }));

    
    return formattedPosts;

  }
  catch(error){
    console.log("Error while fetching post",error);
    throw new Error("Failed to fetch post");
  }
}



type FullyPopulatedComment = {
  _id: mongoose.Types.ObjectId;
  userId: {
    _id: mongoose.Types.ObjectId;
    name: string;
  };
  text: string;
  createdAt: Date;
};

export const addComment = async (postId: string, userId: string, text: string) => {
  try {
    if (!postId || !userId || !text.trim()) {
      return { error: "Invalid input data" };
    }

    const post = await Post.findById(postId); // ❌ do NOT use lean() here

    if (!post) {
      return { error: "Post not found" };
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      userId, // let mongoose handle ObjectId
      text,
      createdAt: new Date(),
    };

    post.comments = post.comments || [];
    post.comments.push(newComment);
    await post.save();

    const populatedPost = await Post.findById(postId)
      .populate('comments.userId', 'name')
      .lean<{ comments: FullyPopulatedComment[] }>();

    if (!populatedPost) {
      return { error: "Post could not be retrieved after save" };
    }

    const populatedComment = populatedPost.comments.find(
      (c) => c._id.toString() === newComment._id.toString()
    );

    if (!populatedComment) {
      return { error: "Comment could not be retrieved after save" };
    }

    return {
      success: true,
      message: "Comment added",
      comment: {
        _id: populatedComment._id.toString(),
        userId: populatedComment.userId._id.toString(),
        text: populatedComment.text,
        username: populatedComment.userId.name,
        createdAt: populatedComment.createdAt.toISOString(),
      },
    };
  } catch (error) {
    console.error("Error adding comment:", error);
    return { success: false, message: error };
  }
};




export async function deleteComment(postId: string, commentId: string, userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const currUser = await getUserSession();

 
    if (!currUser|| !currUser.id || !currUser.role) {
      return {
        success: false,
        message: "Unauthorized: Please log in to delete a comment.",
      };
    }

    
    if (!postId || !commentId || !userId) {
      return { success: false, message: "Invalid request: Missing post or comment ID or user." };
    }

    
    const postMeta = await getPost(postId); // lightweight version
    if (!postMeta) return { success: false, message: "Post not found" };

   
    const currUserId = currUser.id.toString();
    const postOwnerId = postMeta.userId.toString();

    const postDoc = await Post.findById(postId).populate('comments.userId');
    if (!postDoc) return { success: false, message: "Post not found" };

    const comment = postDoc.comments.find(
      (c: PopulatedComment) => c._id.toString() === commentId
    );
    if (!comment) return { success: false, message: "Comment not found" };

 
    const commentAuthorId = comment.userId?._id.toString(); 
    if (!commentAuthorId) {
      return { success: false, message: "Comment author not found." };
    }

  
    const isAdmin = currUser.role === 'admin';
    const isPostOwner = currUserId === postOwnerId;
    const isCommentAuthor = currUserId === commentAuthorId;

    console.log(`currUserId: ${currUserId}, postOwnerId: ${postOwnerId}, commentAuthorId: ${commentAuthorId}`);
    if (isAdmin || isPostOwner || isCommentAuthor) {
     
      postDoc.comments = postDoc.comments.filter(
        (c: PopulatedComment) => c._id.toString() !== commentId
      );

      await postDoc.save();

      return { success: true, message: "Comment deleted successfully" };
    } else {
      return {
        success: false,
        message: "Unauthorized: You don't have permission to delete this comment.",
      };
    }
  } catch (error:unknown) {
    console.error("Error deleting comment:", error);
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    return { success: false, message: errorMessage };
  }
}



export async function makeUserAdmin(userId:string){
  try{

    const currentUser = await getUserSession();
    if(!currentUser)return {success:false,message:"Unauthorized: Please log in to make a user admin."};
    if(currentUser.role !== 'admin'){
 return{
  success:false,
  message:"Unauthorized: You don't have permission to make a user admin."};
    }

    const user = await User.findById(userId);
    if(!user)return {success:false,message:"User not found to be converted into admin"};

    user.role = "admin";
    await user.save();

    return { success: true, message: "User promoted to admin" };
  }
  catch (err) {
    console.error(err);
    return { 
      success: false, 
      message: "Something went wrong" };
  }
}

export async function makeUserNormal(userId:string){
  try{

    const currentUser = await getUserSession();
    if(!currentUser)return {success:false,message:"Unauthorized: Please log in to make a user normal."};
    const user = await User.findById(userId);
      if(!user)
        return {
         success:false,
          message:"User not found to be converted into normal"
        };

    if(currentUser.role !== 'admin'  ){
      return{
        success:false,
        message:"Unauthorized: You don't have permission to make an admin normal."
      };
      }
      if(currentUser.id === userId){
        return{
          success:false,
          message:"Unauthorized: You can't make yourself User ,you are Admin."
        }
      }

    if(user.role !== 'admin'){
        return {
          success:false,
          message:"User is already a normal user"
        };
      }

    user.role = "user";
    await user.save();

return { success: true, message: "User demoted to normal again" };
  }
  catch(error){
    console.error("Error making user normal:", error);
    return { success: false, message: "Failed to make user normal" };
  }
}
export interface NewUserData {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface UpdateUserData extends NewUserData {
  userId: string;
}

export async function addNewUser(formData:NewUserData){
  try{
    const { name, email, password, role = "user" } = formData;
    
     if(!name || !email || !password || !role){
      return {success:false,message:"Please provide all the required fields"};
     }

     const existing = await User.findOne({email});
     if(existing){
      return {success:false,message:"User already exists with this email"};
     }

     const hashedPassword =  await bcrypt.hash(password,10);
     const user = new User({name,email,password:hashedPassword,role});
     await user.save();

     return {success:true,  user: {
      _id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    }};
  }
  catch(error){
    console.error("Error adding new user:", error);
    return { success: false, message: "Failed to add new user" };
  }
}

export async function updateUserInfo(formData:UpdateUserData) {
  try {
    const { userId, name, email, role = "user" } = formData;

    if (!userId) {
      return { success: false, message: "User ID is required" };
    }

    const user = await User.findById(userId);
    if (!user) {
      return {
        success: false,
        message: "User not found",
      };
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.role = role || user.role;

    await user.save();
    

    return {
      success: true,
      message: "User info updated successfully",
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  } catch (error) {
    console.error("Error updating user info:", error);
    return {
      success: false,
      message: "Failed to update user info",
    };
  }
}
