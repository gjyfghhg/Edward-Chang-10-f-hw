import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    unique: true,
  },
  password: String,
  avatar: String,
  username: String,
  gender: Number, //1 for male, 0 for female, 2 for other
  email: String,
  friends: [String],
});

const Users = mongoose.model("Users", UserSchema);

export default Users;
