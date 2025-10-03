import { Children, createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";



export  const ChatContext = createContext();

export const ChatProvider = ({ children })=>{
  
    const[messages, SetMessages] = useState([])
    const[users, SetUsers] = useState([])
    const[selectedUser,setSelectedUser] = useState(null)
    const[unseenMessages,SetUnseenMessages] = useState({})

    //import socket and axios created in authcontext
const {socket,axios} = useContext(AuthContext)

//1.function to get all users for sidebar
    
    const getUsers = async ()=>{
        try {
            const {data} = await axios.get("/api/messages/users");
           
            if(data.success){
                SetUsers(data.users)
                SetUnseenMessages(data.unseenMessages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    //2.function to get messages for selected user

    const getMessages = async(userId)=>{
        try {
            const {data} = await axios.get(`/api/messages/${userId}`);
            if(data.success){
                SetMessages(data.messages)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }


    ///3.function to sent messages for selected user

    const sendMessage = async(messageData)=>{
      
        try {
            
            const {data} = await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
            if(data.success){
              SetMessages((prevMessages)=>[...prevMessages,data.newMessage])
            }
            else{
                toast.error(data.message)
            }
        } catch (error) {
                        toast.error(error.message)

            
        }

    }

  //// 4.function to subscribe to messages for selected user
     
    // const  subscribeToMessages = async ()=>{
    //     socket.on("newMessage",(newMessage)=>{
    //         if(selectedUser && newMessage.senderId === selectedUser._id){
    //             newMessage.seen = true;
    //             SetMessages((prevMessages)=>[...prevMessages, newMessage]);
    //             axios.put(`/api/messages/mark/${newMessage._id}`);
    //         }
    //         else{
    //             SetUnseenMessages((prevUnseenMessages)=>({
    //                 ...prevUnseenMessages, [newMessage.senderId] : 
    //                 prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId]+1: 1
    //             }))
    //         }
    //     })
   // }



   const  subscribeToMessages = ()=>{
    if(!socket) return;
    
    // Remove previous listener to avoid duplicates
    socket.off("newMessage");
    
    socket.on("newMessage",(newMessage)=>{
        if(selectedUser && newMessage.senderId === selectedUser._id){
            newMessage.seen = true;
            SetMessages((prevMessages)=>[...prevMessages, newMessage]);
            axios.put(`/api/messages/mark/${newMessage._id}`);
        }
        else{
            SetUnseenMessages((prevUnseenMessages)=>({
                ...prevUnseenMessages, [newMessage.senderId] : 
                prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId]+1: 1
            }))
        }
    })
}


    ///5. function to unsubscribe from messages

     const unsubscribeFromMessages = ()=>{
       if(socket) socket.off("newMessage")
     }


    //  useEffect(()=>{
    //    subscribeToMessages();
    //    return unsubscribeFromMessages();
    //  },[socket, selectedUser])


useEffect(()=>{
   if(socket) {  // Add this check!
       subscribeToMessages();
   }
   return () => {
       if(socket) {
           unsubscribeFromMessages();
       }
   }
},[socket, selectedUser])

    const value ={
      messages,users,selectedUser,getUsers,getMessages,sendMessage,setSelectedUser,unseenMessages,SetUnseenMessages,
    }


    return(
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}