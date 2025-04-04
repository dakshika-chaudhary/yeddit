import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
    {
      userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
      },
      title:{
        type:String,
        required:true
      },
      description:{
        type:String,
        required:true,
      },
      youtubeCode:{
        type:String,
        required:true
      },
      thumbnail: { 
        type: String ,
      // required:true},
      },
      readBy: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: "User" 
      }],

      likes: [
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          createdAt: { type: Date, default: Date.now }, // Stores the like timestamp
        },
      ],

      dislikes:[
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          createdAt: { type: Date, default: Date.now }, // Stores the like timestamp
        },
      ],

      comments:[
        {
          _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
          user:{type:mongoose.Schema.Types.ObjectId,
          ref:'User'},
          text:String,
          createdAt:{type:Date, default:Date.now}
        }
      ]
    },

    
    { timestamps: true }
)

const Post = mongoose.models?.Post|| mongoose.model('Post',PostSchema);

export default Post;