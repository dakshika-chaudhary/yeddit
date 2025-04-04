import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },

  lastSeenAt:{
    type:Date,
    default:Date.now,
  }
});

const User = mongoose.models.User || mongoose.model("User", UserSchema);
export default User;
