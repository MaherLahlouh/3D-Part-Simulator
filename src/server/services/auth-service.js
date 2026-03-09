import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

export const comparePassword = async (password, hashedPassword) => {
    // bcrypt hashes the input password and compares it to the stored one
    return await bcrypt.compare(password, hashedPassword);
};

export const generateToken = (user) => {
    return jwt.sign(
        { Id: user._id,
          Role: user.Role
         }, 
        process.env.JWT_SECRET, 
        { expiresIn: '7d' }    
    );
};

export const verifyToken = (token) => {
  // check if the token is valid and not expired
  return jwt.verify(token, process.env.JWT_SECRET);
};

export const findUserByEmailOrUsername = async (email, username) => {
    return await User.findOne({
        $or: [{ Email: email }, { UserName: username }]
    });
};