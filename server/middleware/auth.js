import User from "../models/User.js";
import jwt from "jsonwebtoken"

/// middleware to protect routes
export const protectRoute = async(req,res,next)=>{
  try {
     ////Get token from headers
     const token =req.headers.token;
     ////Verify token
     const decoded =jwt.verify(token,process.env.JWT_SECRET);
     ////Find user
     const user = await User.findById(decoded.userId).select("-password");///to remove the password use -

     if(!user){
        return res.json({success:false ,message:"User not found"});
     }
     ////Attach user to request object
        req.user =user;
    //// Continue to next middleware/controller
        next();
     
  } catch (error) {
    res.json({success:false ,message:error.message})
  }
}