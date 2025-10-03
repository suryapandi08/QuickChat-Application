import mongoose from "mongoose";
import dotenv from "dotenv";

//function to connect to the mongodb database

export const connectDB =async()=>{
    try {
           mongoose.connection.on('connected',()=> console.log('Database connected'));
        await mongoose.connect(`${process.env.MONGODB_URI}/chat-app`)
    } catch (error) {
        console.log(error)
    }
}