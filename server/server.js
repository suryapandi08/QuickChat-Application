import express from "express";
import "dotenv/config"
import cors from "cors"
import http from "http"
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// create Express app and HTTP server (create instance for express)

const app =express()
const server = http.createServer(app)

// initialize socket.io server
export const io= new Server(server,{
    cors: {origin: "*"} // * --> all origin
})


//store online users
export const userSocketMap ={} //{userId :  socketId}

//Socket.io connnection handler

io.on("connection",(socket)=>{
    const userId =socket.handshake.query.userId;
    console.log("user Connected",userId);
    if(userId) {
        userSocketMap[userId]=socket.id;
    }
    //Emit online users to all connnected clients
    io.emit("getOnlineUsers",Object.keys(userSocketMap));

    //Socket.io disconnnection handler

    socket.on("disconnect",()=>{
        console.log("user Disconnected" ,userId);
        delete userSocketMap[userId];
        io.emit("getOnlineUsers",Object.keys(userSocketMap))
    })

})


// middleware setup

app.use(express.json({limit:"4mb"}));
app.use(cors())

// ROUTE SETUP
app.use("/api/status",(req,res)=>res.send("server is live"));

app.use("/api/auth" , userRouter)
app.use("/api/messages",messageRouter)

// connect to MONGODB
await connectDB(); 

const port = process.env.PORT || 5000

server.listen(port,()=>console.log(`server is running on the port ${port}`));

