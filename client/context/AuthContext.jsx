import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import toast from "react-hot-toast";
import {io} from "socket.io-client";


const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;



export const AuthContext = createContext();

export const AuthProvider =({children})=>{

  const  [token,setToken]=useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] =useState(null);
  const [onlineUsers, setonlineUsers] =useState([]);
  const [socket, setSocket] =useState(null);

  //2.check if user is authenticated and if so,set the userdata and connect the socket

  const checkAuth =async()=>{
    try {
        const {data} = await axios.get("/api/auth/check");
        if(data.success){
            setAuthUser(data.user)

            connnectSocket(data.user)
        }
    } catch (error) {
        toast.error(error.message)
    }
  }


  ///3.login function to handle user authentication and socket connection

  const login =async(state, credentials)=>{
    try {
        const {data} = await axios.post(`/api/auth/${state}`,credentials);
        if(data.success){
            setAuthUser(data.userData )
            connnectSocket(data.userData);
            axios.defaults.headers.common["token"] = data.token;
            setToken(data.token)
            localStorage.setItem("token",data.token)
            toast.success(data.message)
        }
        else{
                   toast.error(data.message)
 
        }
    } catch (error) {
        toast.error(error.message)
    }
  }

  /// 4.logout function to handle user logout and socket disconnection

  const logout = async()=>{
     
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setonlineUsers([]);
    axios.defaults.headers.common["token"] = null;
    toast.success("logged out successfully");

    // socket.disconnect();
    if(socket) {
       socket.disconnect();
   }
  }


  ///5.Update profile function to handle user profile updates
  
  const updateProfile = async(body)=>{
      
    try {
         const {data} = await axios.put("/api/auth/update-profile",body);
         if(data.success){
            setAuthUser(data.user);
            toast.success("Profile updated successfully")
         }
    } catch (error) {
          toast.error(error.message)
    }
  }

  /// 1.connect socket function to handle socket connection and online users updates
  const connnectSocket = (userData)=>{
    if(!userData || socket?.connected) return;

    const newSocket = io(backendUrl,{
        query: {
            userId: userData._id
        }
    });
    newSocket.connect();
    setSocket(newSocket)

    newSocket.on("getOnlineUsers",(userIds)=>{
        setonlineUsers(userIds)
    })
  }

 useEffect(()=>{
    if(token){
        axios .defaults.headers.common["token"] = token
    }
    checkAuth()
 },[])
    const value ={
        axios,
        authUser,
        onlineUsers,
        socket,
        login,
        logout,
        updateProfile,
    }
    // return(
    //     <AuthContext.Provider value={value}>
    //         {Children}
    //     </AuthContext.Provider>
    // )

    return (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
)

}