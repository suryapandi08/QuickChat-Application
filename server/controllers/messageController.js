import Message from "../models/Message.js";

import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io,userSocketMap } from "../server.js";

/// get all users except the logged in users
export const getUsersForSidebar = async(req,res)=>{
    try {
        const userId = req.user._id;
        ///{_id: {$ne: userId}} id notequal($ne) to userId  /// remove the password use -
        const filteredUsers = await User.find({_id: {$ne: userId}}).select("-password")


////count number of messages not seen

const unseenMessages ={}// object
const promises = filteredUsers.map(async(user)=>{
    // const messages = await Message.find({senderId: user._id ,receiverId: user._id, seen:false})
    const messages = await Message.find({senderId: user._id ,receiverId: userId, seen:false})

    if(messages.length> 0){
        unseenMessages[user._id] =messages.length
    }
})
     await Promise.all(promises);
      res.json({success:true,users:filteredUsers,unseenMessages})
    } catch (error) {
        console.log(error.message)
        res.json({success: false,message:error.message})
    }
}


////get all messages for selected user

export const getMessages =async(req,res)=>{
    try {

        const {id:selectedUserId}=req.params; // store id in[ selectedUserId (frontend)]
        const myId = req.user._id  // user from middleware

        const messages = await Message.find({
            $or :[ // || or operator
                {senderId : myId , receiverId : selectedUserId},
                {senderId :selectedUserId , receiverId : myId },
            ]
        })
        await Message.updateMany({senderId :selectedUserId , receiverId : myId },{seen:true});

        res.json({success:true, messages})
        
    } catch (error) {
        console.log(error.message)
        res.json({success: false,message:error.message})
    }
}

///api to mark message as seen using message id

export const markMessageAsSeen = async(req,res)=>{
    try {
        const {id} = req.params;
        await Message.findByIdAndUpdate(id,{seen:true})
        res.json({success:true})
    } catch (error) {
         console.log(error.message)
        res.json({success: false,message:error.message})
    }
}

///send message to selected user

export const sendMessage = async(req,res)=>{
    try {
        const {image,text}=req.body;
        // const receiverId = req.params._id;
        const receiverId = req.params.id;
        const senderId = req.user._id;

        let imageUrl;
        if(image){
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url
        }

        //use message model
        const newMessage =await Message.create({
            senderId,
            receiverId,
            text,
            image : imageUrl
        })
    ///Emit the new message to the receiver's socket (code until the res.jsojn before the catch)
      const receiverSocketId = userSocketMap[receiverId];
      if(receiverSocketId){
        io.to(receiverSocketId).emit("newMessage", newMessage)
      }
     ///
        res.json({success:true ,newMessage});
    } catch (error) {
          console.log(error.message)
        res.json({success: false,message:error.message})
    }
}