import mongoose from 'mongoose';

export interface IUser{
    _id: mongoose.Types.ObjectId|string;
    name: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;

}
export type SessionPayload = {
  userId: string;
  expiresAt: Date;
};
export interface IComment{
    _id:mongoose.Types.ObjectId|string;
    postId: mongoose.Types.ObjectId|string;
    userId: mongoose.Types.ObjectId|string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IPost{
    _id: mongoose.Types.ObjectId|string;
    userId: mongoose.Types.ObjectId|string;
    title: string;
    description: string;
    youtubeCode: string;
    thumbnail?: string;
    createdAt: Date;
    updatedAt: Date;
    likes?: {
        userId: mongoose.Types.ObjectId | string | IUser;
        createdAt: Date;
      }[];
      dislikes?: {
        userId: mongoose.Types.ObjectId | string | IUser;
        createdAt: Date;
      }[];
      readBy?: (mongoose.Types.ObjectId | string | IUser)[];
      comments?: {
        _id: mongoose.Types.ObjectId | string;
        user: mongoose.Types.ObjectId | string | IUser;
        text: string;
        createdAt: Date;
      }[];
}

 export interface IUserLean {
    _id: mongoose.Types.ObjectId | string;
    name: string;
    email: string;
    role: string;
  }

  export interface UserType {
    _id: string;
    lastSeenAt?: Date;  
  }

  export type SessionUser = {
    id: string;
    name: string;
    email: string;
   
  };
 
  export interface Comment {
    _id: string; 
    userId: string; 
    text: string;
    username: string;
    createdAt: string; 
  }
  
  export interface Postss {
    _id: string;
    userId: string;
    title: string;
    username: string;
    createdAt: string | null;
    updatedAt: string | null;
    description: string;
    youtubeCode?: string;
    thumbnail: string | null;
    readBy: string[];
    likes: any[];  
  dislikes: any[]; 
    comments: Comment[]; 
  }
  
export interface SanitizedPostss {
  _id: string; 
  userId: string;
  title: string;
  username: string;
  createdAt: string | null;
  updatedAt: string | null;
  description: string;
  youtubeCode?: string;
  thumbnail: string | null;
  readBy: string[];
  likes: string[]; 
  dislikes: string[];
  comments: {
    _id: string;
    userId: string;
    text: string;
    username: string;
    createdAt: string;
  }[];
}
 export interface LoginState {
  message: string;
  redirect?: string;
  errors: {
    email: string[];
    password: string[];
  };
}

export interface PostType {
  _id: string;
  userId: string;
  title: string;
  content: string;
  author: string;
  createdAt: string; 
  updatedAt: string; 
  likes: string[];
  dislikes: string[];
  comments: CommentType[];
}

export interface CommentType {
  _id: string;
  userId: string;
  text: string;
  username: string;
  createdAt: string;
}

export interface PageProps {
  params: Promise<{
    postid: string;
  }>;
}

  
  
  
  
