import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  profileImage: String,
  bannerImage: String,
  phoneNumber: String,
  mainColor: String,
  secondaryColor: String,
  socialLinks: { type: Map, of: String },
  bio: String,
});

const User = mongoose.model("User", userSchema);
export default User;
