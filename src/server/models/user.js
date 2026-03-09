import mongoose from "mongoose";

const Roles = Object.freeze({
  USER: 'user',
  TEACHER: 'teacher',
  ADMIN: 'admin'
});


const userSchema = new mongoose.Schema({
  UserName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
    FirstName: {
    type: String,
    required: true,
    trim: true
  },
    LastName: {
    type: String,
    required: true,
    trim: true
  },
  Email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true, 
    trim: true
  },
  Password: {
    type: String,
    required: true
  },
  Role: { 
    type: String, 
    required: true,
    enum: Object.values(Roles), 
    default: Roles.USER 
  },
  Institution: {
    type: String,
    required: true
  },
  Country: {
    type: String,
    required: true
  },
  PhoneNumber: {
    type: String,
  }
});

export default mongoose.model("User", userSchema);