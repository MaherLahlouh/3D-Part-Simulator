import User from '../models/user.js';
import { hashPassword , comparePassword , generateToken , verifyToken, findUserByEmailOrUsername  } from '../services/auth-service.js';


export const register = async (req, res) => {

    // Handle user registration logic here
    try {
        const { UserName, FirstName, LastName, Email, Password, Role, Institution, Country, PhoneNumber } = req.body;

        //check if user already exists
        const existingUser = await findUserByEmailOrUsername(Email, UserName);
        if (existingUser) {
            return res.status(409).json({ message: 'User with given email or username already exists' });
        }

        //hash the password
        const hashedPassword = await hashPassword(Password);

        const newUser = await User.create({
           "UserName": UserName,
            "FirstName": FirstName,
            "LastName": LastName,
            "Email": Email,
            "Password": hashedPassword,
            "Role": Role,
            "Institution": Institution,
            "Country": Country,
            "PhoneNumber": PhoneNumber
        });

        const token = generateToken(newUser);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                Id: newUser._id,
                FirstName: newUser.FirstName,
                Role: newUser.Role
            }
        });
    }
    catch (error) {
        console.error("Registration Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }


}


export const login = async (req, res) => {
    try {
        const { Email, Password, UserName } = req.body;

        const user = await findUserByEmailOrUsername( Email , UserName );

        if (!user){
        return res.status(401).json({ message: "Invalid email or password" });
        }

        const isMatch = await comparePassword(Password, user.Password);

        if (!isMatch){
        return res.status(401).json({ message: "Invalid email or password" });
        }

        const token = generateToken(user);

        res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                Id: user._id,
                FirstName: user.FirstName,
                Role: user.Role
            }
        });

        
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Internal Server Error' });
    }

}

