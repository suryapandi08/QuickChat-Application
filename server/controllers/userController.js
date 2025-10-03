import { generateToken } from "../lib/utils.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs"
import cloudinary from "../lib/cloudinary.js";
//signup new user
export const signup =async(req,res)=>{
    const {fullname,email,password,bio}=req.body;

    try {
        if(!fullname || !email || !password || !bio){
            return res.json({success: false ,message:"Missing Details"})
        }
        /// check user exit
        const user = await User.findOne({email})
        if(user){
            return res.json({success:false,message:"Account already exits"})
        }

        ///hash the password 
        const salt = await bcrypt.genSalt(10);
        const hashedPassword =await bcrypt.hash(password,salt);

        /// create new user
        const newUser = await User.create({fullname,email,password:hashedPassword,bio})


        // create token for new user [generate token from lib--> util.js for creating token]
        const token = generateToken(newUser._id)
        res.json({success:true,userData: newUser, token,message:"Account created successfully"})

    } catch (error) {
        console.log(error.message);
        res.json({success: false, message: error.message})
    }

}


// controller for  user login 

export const login =async(req,res)=>{
    const{email,password}=req.body;
    try {
        const userData = await User.findOne({email})

        const isPasswordCorrect =await bcrypt.compare(password,userData.password)
      //password-given password in login page,userData.password--> password in mongodb while signup compare these two passwords to login
      
      if(!isPasswordCorrect){
        res.json({success:false , message:"Invalid Credentials"})
      }

      // generate token
       const token = generateToken(userData._id)
        res.json({success:true,userData , token,message:"Login successfully"})

    } catch (error) {
       console.log(error.message);
        res.json({success: false, message: error.message})   
    }
}




//// controller to check  if user is authenticated

export const checkAuth =(req,res)=>{
  res.json({success:true,user:req.user});
}

/// controller to update user profile details

export const updateProfile =async (req,res)=>{
    try {
        const{ profilePic,bio,fullname }=req.body;
     const userId = req.user._id /// user--> from the middleware

     let updatedUser;

     if(!profilePic){
        updatedUser =await User.findByIdAndUpdate(userId ,{bio,fullname},{new:true})
     }
     else{
        const upload =await cloudinary.uploader.upload(profilePic)

        updatedUser  =await User.findByIdAndUpdate(userId,{profilePic:upload.secure_url,bio,fullname},{new:true});
     }

     res.json({success:true,user:updatedUser})

    } catch (error) {
        console.log(error.message);
        res.json({success:false,message:error.message})
    }
}