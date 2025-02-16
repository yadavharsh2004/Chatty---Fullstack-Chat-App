import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";

export const getUsersForSidebar = async (req, res) => {
    try {
      const loggedInUser = req.user._id;
      const filteredUsers = await User.find({_id: {$ne: loggedInUser}}).select("-password");

      res.status(200).json(filteredUsers);
    } 
    catch (error) {
      console.log("Error in getUsersForSidebar", error.message);
      res.status(500).json({ message: "Internal Server Error" });
    }
  };

export const getMessages = async (req, res) =>{
    try{
        const {id: userToChat} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or:[
                {senderId: myId, receiverId: userToChat},
                {senderId: userToChat, receiverId: myId}
            ]
        })

        res.status(200).json(messages)
    }
    catch (error) {
        console.log("Error in getMessages controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

export const sendMessages = async (req, res) =>{
    try{
        const {text, image} = req.body;
        const {id: receiverId} = req.params;

        const senderId = req.user._id

        let imageUrl;
        if(image){
            //upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image)
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        })

        await newMessage.save();

        const receiverSocketId = getReceiverSocketId(receiverId);
        if(receiverSocketId){
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    }
    catch (error) {
        console.log("Error in sendMessages controller", error.message);
        res.status(500).json({ message: "Internal Server Error" });
    }
}

