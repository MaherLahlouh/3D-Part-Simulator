import { verifyToken } from "../services/auth-service.js";


export const authenticateToken = (req, res, next) => {
    // Get Authorization header
  const authHeader = req.headers["authorization"];
  if (!authHeader)
  { return res.status(401).json({ message: "No token provided" });}

  //Extract token from format 'Bearer <token>'
  const token = authHeader.split(" ")[1];
  if (!token) 
  { return res.status(401).json({ message: "Malformed token" }); }

  try {
    //Verify token and decode user info
    const decoded = verifyToken(token);

    // Attach decoded user info to request object
    req.user = decoded;

    // Proceed to next middleware or route handler
    next();

  } catch (err) {
    // If token is invalid or expired
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

