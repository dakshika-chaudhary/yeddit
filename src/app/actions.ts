'use server';

import mongoose from 'mongoose';
import { z } from 'zod';
import fs from "fs";
import { google } from "googleapis";
import { hash,compare } from 'bcryptjs';
import { connect } from '@/dbConfig/dbConfig';
import User from '@/models/userModel';  // Import user model
import Post from '@/models/PostModel';
import { createSession } from "@/app/lib/session";
import { cookies } from "next/headers";
import { decrypt } from '@/app/lib/session';
import { revalidatePath } from "next/cache";
import axios from 'axios'
import { title } from 'process';
// Connect to the database
connect();

const API_KEY = process.env.YOUTUBE_API_KEY;
// Define validation schema
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
})

export async function createUser(prevState: any, formData: FormData) {
  // Validate input fields
  const validatedFields = schema.safeParse({
     name : formData.get('name')?.toString(),
    email : formData.get('email')?.toString(),
     password : formData.get('password')?.toString()
  });

  if (!validatedFields.success) {
    return { 
      message: "",  
      errors: {
        name: validatedFields.error.flatten().fieldErrors.name || [],
        email: validatedFields.error.flatten().fieldErrors.email || [],
        password: validatedFields.error.flatten().fieldErrors.password || [],
      }
    };
  }

  const {name, email, password } = validatedFields.data;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    console.log("existing user is:",existingUser);
    if (existingUser) {
      return { 
        message: "User already exists. Please login." ,
        errors: {name:[], email: [], password: [] } ,
        redirect: "" 
      };
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Store user in the database
    // const newUser = await User.create({name, email, password: hashedPassword });
    const newUser = await User.create({ name, email, password:hashedPassword });

    const sessionToken = await createSession(newUser._id.toString());
    console.log("Created user session:", sessionToken);
   const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week expiry
      path: "/"
    });
    return { 
      message: "Signup successful!",
      errors: {name:[],email: [], password: []} ,
      redirect: "/posts",};
  } catch (error) {
    return { 
      message: "Signup failed. Please try again.",
      errors: {name:[],email: [], password: []} ,
      redirect: "",};
  }
}


export async function loginUser(prevState: any, formData: FormData) {
  const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

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
    const cookieStore = await cookies(); // Await cookies() before using
    const sessionToken = await createSession(existingUser._id.toString());
    await cookieStore.set('session', sessionToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === "production", 
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 1 week expiry
    });
    
    return { 
      message: "Login successful!",
      redirect: "/",
      errors: { email: [], password: [] } 
    };
  } catch (error) {
    console.log("Login error:", error);
    return { message: "Login failed. Please try again.", errors: { email: [], password: [] } };
  }
}


export async function getUserSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session")?.value||"";

  if (!sessionToken) {
    console.log("No session token found.");
    return null;}

  console.log("Session Token:", sessionToken);

  const sessionData = await decrypt(sessionToken);
  console.log("Decrypted Session:", sessionData);

  if (!sessionData?.userId) {
      console.log("Invalid or Expired Session:", sessionToken);
      return null;
  }

  const user = await User.findById(sessionData.userId);
  if (!user) {
    console.log("User not found in database for session:", sessionData.userId);
    return null;
  }
  console.log("Session is valid. Logged in user:", user.email);
  return { id: user._id.toString(), email: user.email,name:user.name };
}

export async function createPost(prevState:any , formData:FormData){
  const session = await getUserSession();
  if (!session) {
    return { error: "Unauthorized: Please log in to create a post." };
  }

  if (!(formData instanceof FormData)) {
    return { error: "Invalid form submission" };
  }


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
  
   console.log(response);

   if(!response.data.items.length){
    return { error: "YouTube video not found. Please check the URL." };
   }

   const videoData = response.data.items[0].snippet;
   const title = videoData.title;
   const description = videoData.description;

    // Thumbnail URL Generation
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
      console.log("Clearing session...");
     const cookieStore = await  cookies();
     
     cookieStore.set("session", "", { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === "production",
        expires: new Date(0), // Expire immediately
        path:"/"
       
        
     });
   
     console.log("Session successfully removed.");
     return { success: true, redirect: "/login" };
  } catch (error) {
     console.error("Logout error:", error);
     return { success: false, error: "Logout failed" };
  }
}



export async function getNewPosts() {
  try {
    await connect();

    const allposts = await Post.find().sort({ createdAt: -1 }).lean();
    if (!allposts || allposts.length === 0) {
      console.log("No posts found");
      return { posts: [] };
    }
    
    const formattedPosts = allposts.map(post => ({
      _id: post._id.toString(),
      userId: post.userId?._id?.toString() || post.userId.toString(),
      title:post.title?.title?.toString()||post.title.toString(),
      username: post.userId?.username || "Unknown",
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      description: post.description
        ? post.description.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '')
        : "",
      thumbnail: post.thumbnail || (post.youtubeCode 
        ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg` 
        : null),
      readBy: Array.isArray(post.readBy) ? post.readBy.map(id => id.toString()) : [] // Ensure IDs are strings
    }));

    console.log(`The formattedPosts are:`, formattedPosts);
    return formattedPosts;

  } catch (error) {
    console.log("Error fetching posts:", error);
    return { posts: [], error: "Failed to fetch posts" };
  }
}


export async function getSpecificPosts(postid?: string, userId?: string) {
  try {
    console.log("Fetching post with:", { postid, userId }); // Debugging log

    await connect();

    // Validate postid and userId are provided
    if (!postid || !userId) {
      console.log("Error: Post ID and User ID are required", { postid, userId });
      return { error: "Post ID and User ID are required" };
    }

    // Validate postid format
    if (!postid.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Error: Invalid Post ID format", postid);
      return { error: "Invalid Post ID format" };
    }
    const objectId = new mongoose.Types.ObjectId(postid);

    // Validate userId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.log("Error: Invalid User ID format", userId);
      return { error: "Invalid User ID format" };
    }
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch post with populated userId
    console.log("Searching for Post ID:", postid);
    let requiredPost = await Post.findById(objectId).populate("userId").lean();
    console.log("DB Response:", requiredPost);

    if (!requiredPost) {
      console.log("No post found for given ID:", postid);
      return { error: "Post not found" };
    }

    // Update readBy efficiently
    await Post.updateOne(
      { _id: objectId },
      { $addToSet: { readBy: userObjectId } }
    );

    // Format post data
    const formattedPost = {
      ...requiredPost,
      _id: requiredPost._id?.toString(),
      title: requiredPost.title ? requiredPost.title.toString() : "",
      userId: requiredPost.userId?._id?.toString() || requiredPost.userId.toString(),
      createdAt: requiredPost.createdAt ? new Date(requiredPost.createdAt).toISOString() : null,
      updatedAt: requiredPost.updatedAt ? new Date(requiredPost.updatedAt).toISOString() : null,
      likes: requiredPost.likes?.map((like: mongoose.Types.ObjectId) => like.toString()) || [],
      dislikes: requiredPost.dislikes?.map((dislike: mongoose.Types.ObjectId) => dislike.toString()) || [],
      readBy: requiredPost.readBy?.map((id: mongoose.Types.ObjectId) => id.toString()) || [],
      comments: requiredPost.comments?.map((comment: any) => ({
        _id: comment._id?.toString(),
        user: comment.user?.name || "Anonymous",
        text: comment.text || "",
        createdAt: comment.createdAt ? new Date(comment.createdAt).toISOString() : null,
      })) || [],
    };

    console.log("Successfully fetched post:", formattedPost);
    return formattedPost;
  } catch (error) {
    console.error("Error fetching post:", error);
    return { error: "Failed to fetch post" };
  }
}


export async function incrementLikes(postId: string) {
  try {
    await connect();
    const session = await getUserSession();

    if (!session) {
      console.log("The user is not logged in");
      return { error: "Unauthorized: Please log in to like posts." };
    }

    if (!postId) {
      console.error("postId is missing");
      return null;
    }

    const userId = session.id;
    if (!userId) {
      console.error("userId is missing");
      return null;
    }

    console.log("PostId found to update likes:", postId);
    console.log("UserId found to update likes:", userId);

    let post = await Post.findById(postId);
    if (!post) {
      console.log("No post found to be liked");
      return null;
    }

    // Ensure likes array exists
    if (!Array.isArray(post.likes)) {
      console.log("Likes array is undefined or not an array, initializing...");
      post.likes = [];
    }

    console.log("Likes before click:", post.likes.length);

    // Check if user already liked the post
    if (post.likes.some((like: any) => like.userId?.toString() === userId)) {
      console.log("User has already liked the post");
      return { likes: post.likes.length, dislikes: post.dislikes.length };
    }

    // Remove user from dislikes if they previously disliked the post
    if (post.dislikes.some((dislike: any) => dislike.userId?.toString() === userId)) {
      post.dislikes = post.dislikes.filter((dislike: any) => dislike.userId?.toString() !== userId);
      console.log("User removed from dislikes");
    }

    post.likes.push({ userId: new mongoose.Types.ObjectId(userId), createdAt: new Date() });

    console.log("User liked the post");

    await post.save();
    console.log("Likes incremented successfully:", post.likes.length);
    console.log("Dislikes updated successfully:", post.dislikes.length);

    return { likes: post.likes.length, dislikes: post.dislikes.length };
  } catch (error) {
    console.log("Failed to increment Likes:", error);
    return { error: "Failed to update likes" };
  }
}

export async function decrementLikes(postId: string) {
  try {
    await connect();
    const session = await getUserSession();

    if (!session) {
      console.log("The user is not logged in");
      return { error: "Unauthorized: Please log in to dislike posts." };
    }

    if (!postId) {
      console.error("postId is missing");
      return null;
    }

    const userId = session.id;
    if (!userId) {
      console.error("userId is missing");
      return null;
    }

    console.log("PostId found to update dislikes:", postId);
    console.log("UserId found to update dislikes:", userId);

    let post = await Post.findById(postId);
    if (!post) {
      console.log("No post found to be disliked");
      return null;
    }

    // Ensure likes and dislikes arrays exist
    if (!Array.isArray(post.likes)) {
      console.log("Likes array is undefined or not an array, initializing...");
      post.likes = [];
    }
    if (!Array.isArray(post.dislikes)) {
      console.log("Dislikes array is undefined or not an array, initializing...");
      post.dislikes = [];
    }

    console.log("Likes before click:", post.likes.length);

    // Check if user already disliked the post
    if (post.dislikes.some((dislike: any) => dislike.userId?.toString() === userId)) {
      console.log("User has already disliked the post");
      return { likes: post.likes.length, dislikes: post.dislikes.length };
    }

    // Remove user from likes if they previously liked the post
    post.likes = post.likes.filter((like: any) => like.userId?.toString() !== userId);
    post.dislikes.push({ userId: new mongoose.Types.ObjectId(userId), createdAt: new Date() });

    console.log("User disliked the post");

    await post.save();
    console.log("Disliked successfully:", post.dislikes.length);
    console.log("Likes updated successfully:", post.likes.length);

    return { likes: post.likes.length, dislikes: post.dislikes.length };
  } catch (error) {
    console.log("Failed to decrement Likes:", error);
    return { error: "Failed to update dislikes" };
  }
}




export async function getUserPosts(userId:string) {
  try{
     await connect();

     console.log("Backend received userId:", userId);

    
     const posts = await Post.find({userId}).sort({createdAt:-1}).lean();
     return JSON.parse(JSON.stringify(posts));
  
  }
  catch(error){
    console.error("Error fetching specific user's posts:", error);
    return [];
  }

}

export async function getUserDetails(userId:string){
  await  connect();
  try{
 
    console.log("Backend received userId:", userId);

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid userId:", userId);
      return null;
    }
    
    // const user = await User.findOne({ _id: new mongoose.Types.ObjectId(userId)})
    const user = await User.findOne({ _id: userId })
    .select("name email _id")
    .lean();

    if (!user) {
      console.log("User not found.");
      return null;
    }

    return {
      _id: user._id.toString(), // Convert ObjectId to string
      username: user.username,
      email: user.email,
    
    };
  }
  catch (error) {
    console.error("Error fetching user details:", error);
    return null;
}
}

export async function updatePost(postId:any,updatedData:{title:any,description:any}){
  try{
  await connect();

  const updatedPost = await Post.findByIdAndUpdate(postId,updatedData,{ new: true }).lean();
  return updatedPost ? JSON.parse(JSON.stringify(updatedPost)):null;;
  }
  catch(error){
    console.log("couldn't update",error);
    return null
  }
}
export async function DeletePost(postId:any){
  try{
  await connect();

  const deletedPost = await Post.findByIdAndDelete(postId).lean();
  return deletedPost ? JSON.parse(JSON.stringify(deletedPost)):null;;
  }
  catch(error){
    console.log("couldn't update",error);
    return null
  }
}

export async function updatedUserLastSeen(userId: string) {
  try {
    await connect();
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { lastSeenAt: new Date() },  // Correct field name
      { new: true }
    ).lean();  // Call lean() as a function
    console.log("Updated lastSeenAt:", updatedUser?.lastSeenAt);
    return updatedUser;
  } catch (error: any) {
    console.error("Error updating user's lastSeenAt:", error);
    return null;
  }
}

export async function getUnreadPostsCount(){
  try{
    await connect();

    const session = await getUserSession();
    if(!session)return {count:0};

    const userId = session.id ;
    console.log("session id to get unread Count:",userId)

        // Count posts that the user hasn't read
    const unreadCount = await Post.countDocuments({ readBy: { $ne: userId } });
    return { count: unreadCount };

  }
  catch(error:any){
    console.error("Error fetching unread posts:", error);
    return { count: 0 };
  }
}




export async function markPostAsRead(postId:string){
  try{
     await connect();

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
  catch(error:any){
    console.error("Error marking post as read:", error);
    return { error: "Failed to mark post as read" };
  }
}

export async function getPostsByToday(){
  await connect();
 try{
  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0); // Start of today (midnight)

  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999); // End of today (11:59:59 PM)

 
const posts = await Post.find({
  createdAt: { $gte: startDate, $lte: endDate }
})
.populate("userId")
.sort({createdAt:-1}).lean();

    if (!posts || posts.length === 0) {
      console.log("No posts found for this month.");
      return [];
    }
  
     // Convert the result into a serializable format
     const formattedPosts = posts.map(post => ({
      _id: post._id.toString(),
      userId: post.userId?._id?.toString() || post.userId.toString(),
      title:post.title?.title?.toString()||post.title.toString(),
      username: post.userId?.username || "Unknown",
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      description: post.description
        ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
        : "",
      thumbnail: post.thumbnail || (post.youtubeCode
        ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
        : null),
      // readBy: Array.isArray(post.readBy) ? post.readBy.map(id => id.toString()) : [],
      // likes:post.likes,
      // dislikes:post.dislikes,
      // comments:post.comments
      readBy: post.readBy?.map((id) => id.toString()) || [],
      likes: post.likes ? post.likes.map((like) => like.userId?.toString()) : [],
      dislikes: post.dislikes ? post.dislikes.map((dislike) => dislike.userId?.toString()) : [],
      comments: post.comments
        ? post.comments.map((comment) => ({
            _id: comment._id.toString(),
            userId: comment.user?._id?.toString() || "Unknown",
            username: comment.user?.username || "Anonymous",
            text: comment.text,
            createdAt: comment.createdAt.toISOString(),
          }))
        : [],

    }));
  
    console.log("Formatted posts for this month:", formattedPosts);
      return formattedPosts;
 }
 catch(error:any){
     console.log("Error in fetching the posts of today:",error);
     return [];
 }
}
export async function getPostsByYesterday(){
  await connect();
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
.sort({createdAt:-1}).lean();

if (!posts || posts.length === 0) {
  console.log("No posts found for this month.");
  return [];
}

 // Convert the result into a serializable format
 const formattedPosts = posts.map(post => ({
  _id: post._id.toString(),
  userId: post.userId?._id?.toString() || post.userId.toString(),
  title:post.title?.title?.toString()||post.title.toString(),
  username: post.userId?.username || "Unknown",
  createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
  updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
  description: post.description
    ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
    : "",
  thumbnail: post.thumbnail || (post.youtubeCode
    ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
    : null),
    readBy: post.readBy?.map((id) => id.toString()) || [],
      likes: post.likes ? post.likes.map((like) => like.userId?.toString()) : [],
      dislikes: post.dislikes ? post.dislikes.map((dislike) => dislike.userId?.toString()) : [],
      comments: post.comments
        ? post.comments.map((comment) => ({
            _id: comment._id.toString(),
            userId: comment.user?._id?.toString() || "Unknown",
            username: comment.user?.username || "Anonymous",
            text: comment.text,
            createdAt: comment.createdAt.toISOString(),
          }))
        : [],
}));

console.log("Formatted posts for this month:", formattedPosts);
  return formattedPosts;
  }
  catch(error){
    console.log("Error fetching posts",error);
    return [];
  }
}

export async function getPostsByWeek(){
  await connect();
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
  .lean();
  if (!posts || posts.length === 0) {
    console.log("No posts found for this month.");
    return [];
  }

   // Convert the result into a serializable format
   const formattedPosts = posts.map(post => ({
    _id: post._id.toString(),
    userId: post.userId?._id?.toString() || post.userId.toString(),
    title:post.title?.title?.toString()||post.title.toString(),
    username: post.userId?.username || "Unknown",
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
    description: post.description
      ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
      : "",
    thumbnail: post.thumbnail || (post.youtubeCode
      ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
      : null),
      readBy: post.readBy?.map((id) => id.toString()) || [],
      likes: post.likes ? post.likes.map((like) => like.userId?.toString()) : [],
      dislikes: post.dislikes ? post.dislikes.map((dislike) => dislike.userId?.toString()) : [],
      comments: post.comments
        ? post.comments.map((comment) => ({
            _id: comment._id.toString(),
            userId: comment.user?._id?.toString() || "Unknown",
            username: comment.user?.username || "Anonymous",
            text: comment.text,
            createdAt: comment.createdAt.toISOString(),
          }))
        : [],
  }));

  console.log("Formatted posts for this month:", formattedPosts);
    return formattedPosts;
}
catch(error:any){
  console.log("Errors while fetching the data from the backend for month: ",error);
  return [];
}

}

export async function getPostsByMonth(){
await connect();
try{
  const startOfMonth = new Date();
  startOfMonth.setDate(1);// Set to the first day of the month
  startOfMonth.setHours(0,0,0,0);

  const endOfMonth = new Date();
  endOfMonth.setMonth(endOfMonth.getMonth()+1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23,59,59,999);

  const posts = await Post.find({
    createdAt: { $gte: startOfMonth, $lte: endOfMonth },
  }).populate("userId")
  .sort({ likes: -1 })
  .lean();

  

  if (!posts || posts.length === 0) {
    console.log("No posts found for this month.");
    return [];
  }

   // Convert the result into a serializable format
   const formattedPosts = posts.map(post => ({
    _id: post._id.toString(),
    userId: post.userId?._id?.toString() || post.userId.toString(),
    title:post.title?.title?.toString()||post.title.toString(),
    username: post.userId?.username || "Unknown",
    createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
    updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
    description: post.description
      ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
      : "",
    thumbnail: post.thumbnail || (post.youtubeCode
      ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
      : null),
    // readBy: Array.isArray(post.readBy) ? post.readBy.map(id => id.toString()) : []
    readBy: post.readBy?.map((id) => id.toString()) || [],
    likes: post.likes ? post.likes.map((like) => like.userId?.toString()) : [],
    dislikes: post.dislikes ? post.dislikes.map((dislike) => dislike.userId?.toString()) : [],
    comments: post.comments
      ? post.comments.map((comment) => ({
          _id: comment._id.toString(),
          userId: comment.user?._id?.toString() || "Unknown",
          username: comment.user?.username || "Anonymous",
          text: comment.text,
          createdAt: comment.createdAt.toISOString(),
        }))
      : [],
  }));

  console.log("Formatted posts for this month:", formattedPosts);
    return formattedPosts;
}
catch(error:any){
  console.log("Error while fetching the data for the month:",error);
  return [];
}
}



export async function getPopularPosts() {
  try {
    await connect();

   
//       $addFields → Creates new computed fields in each document.

// $size → Returns the length of an array.

// $ifNull: ["$likes", []] → If likes is null, it replaces it with an empty array ([]), ensuring $size doesn’t break.


const allposts = await Post.aggregate([
  {
    $addFields:{
      readCount:{$size:{ $ifNull: ["$readBy", []] }}
    }
  },
  {$sort :{readCount :-1}}
])

    if (!allposts || allposts.length === 0) {
      console.log("No posts found");
      return { posts: [] };
    }

   

    // Convert all objects to plain serializable objects
    const formattedPosts = allposts.map(post => ({
      _id: post._id.toString(),
      userId: post.userId?._id?.toString() || post.userId.toString(),
      title:post.title?.title?.toString()||post.title.toString(),
      username: post.userId?.username || "Unknown",
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      description: post.description
        ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
        : "",
      thumbnail: post.thumbnail || (post.youtubeCode
        ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
        : null),
        readBy: post.readBy?.map((id) => id.toString()) || [],
        likes: post.likes ? post.likes.map((like) => like.userId?.toString()) : [],
        dislikes: post.dislikes ? post.dislikes.map((dislike) => dislike.userId?.toString()) : [],
        comments: post.comments
          ? post.comments.map((comment) => ({
              _id: comment._id.toString(),
              userId: comment.user?._id?.toString() || "Unknown",
              username: comment.user?.username || "Anonymous",
              text: comment.text,
              createdAt: comment.createdAt.toISOString(),
            }))
          : [],
    }));

    console.log(`The formattedPosts are:`, formattedPosts);
    return formattedPosts;

  } catch (error) {
   
console.log("Error fetching posts",error);
return [];
  }
}

export async function getPost(postId:string){

  await connect();
  try{
    const post = await Post.findById(postId).lean();
    if(!post){
      console.log("Post not found");
      return null;
    }

      const formattedPosts = {
        _id: post._id.toString(),
        userId: post.userId?._id?.toString() || post.userId.toString(),
        title:post.title?.title?.toString()||post.title.toString(),
        username: post.userId?.username || "Unknown",
        createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
        updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
        description: post.description
          ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
          : "",
        thumbnail: post.thumbnail || (post.youtubeCode
          ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
          : null),
          readBy: post.readBy?.map((id) => id.toString()) || [],
          likes: post.likes ? post.likes.map((like) => like.userId?.toString()) : [],
          dislikes: post.dislikes ? post.dislikes.map((dislike) => dislike.userId?.toString()) : [],
          comments: post.comments
            ? post.comments.map((comment) => ({
                _id: comment._id.toString(),
                userId: comment.user?._id?.toString() || "Unknown",
                username: comment.user?.username || "Anonymous",
                text: comment.text,
                createdAt: comment.createdAt.toISOString(),
              }))
            : [],
      };
  
      console.log(`The formattedPosts are:`, formattedPosts);
      return formattedPosts;
  }
  catch(error:any){
     console.log("Error while fetching post",error);
     throw new Error("Failed to fetch post");
  }

}

export async function getLikedPosts() {
  
  await connect();
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

    // Convert all objects to plain serializable objects
    const formattedPosts = allPosts.map(post => ({
      _id: post._id.toString(),
      userId: post.userId?._id?.toString() || post.userId.toString(),
      title:post.title?.title?.toString()||post.title.toString(),
      username: post.userId?.username || "Unknown",
      createdAt: post.createdAt ? new Date(post.createdAt).toISOString() : null,
      updatedAt: post.updatedAt ? new Date(post.updatedAt).toISOString() : null,
      description: post.description
        ? post.description.replace(/<[^>]*>/g, "").replace(/\{[^}]*\}/g, "")
        : "",
      thumbnail: post.thumbnail || (post.youtubeCode
        ? `https://img.youtube.com/vi/${post.youtubeCode}/maxresdefault.jpg`
        : null),
        readBy: post.readBy?.map((id) => id.toString()) || [],
        likes: post.likes ? post.likes.map((like) => like.userId?.toString()) : [],
        dislikes: post.dislikes ? post.dislikes.map((dislike) => dislike.userId?.toString()) : [],
        comments: post.comments
          ? post.comments.map((comment) => ({
              _id: comment._id.toString(),
              userId: comment.user?._id?.toString() || "Unknown",
              username: comment.user?.username || "Anonymous",
              text: comment.text,
              createdAt: comment.createdAt.toISOString(),
            }))
          : [],
    }));

    console.log(`The formattedPosts are:`, formattedPosts);
    return formattedPosts;

  }
  catch(error:any){
    console.log("Error while fetching post",error);
    throw new Error("Failed to fetch post");
  }
}

export const addComment = async(postId:string ,userId:string,text:string)=>{
  try{
     await connect();

     if(!postId || !userId || !text.trim()){
      return { error: "Invalid input data" };
     }

     const post = await Post.findById(postId);
     if (!post) {
      return{error:"Post not found"};
    }

    const newComment = {
      _id: new mongoose.Types.ObjectId().toString(),
      user: userId.toString(),
      text,
      createdAt: new Date().toISOString(),
    };
    post.comments = post.comments || [];
    post.comments.push(newComment);
    await post.save();

    return { success: true, message: "Comment added", comment: newComment };
  }
  catch(error:any){
    console.error("Error adding comment:", error);
    return { success: false, message: error.message };
  }
}

