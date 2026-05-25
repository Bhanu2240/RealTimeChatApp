import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import {getReceiverSocketId,io,} from "../lib/socket.js";


// GET USERS FOR SIDEBAR
export const getUsersForSidebar = async (req,res) => {
  try {
    const loggedInUserId = req.user._id;
   const filteredUsers = await User.find({_id: { $ne: loggedInUserId },}).select("-password");
   res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar:", error.message);
    res.status(500).json({ error: "Internal server error",});
  }
};
// GET MESSAGES

export const getMessages = async (req,res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;
    const messages = await Message.find({
      $or: [
        {
          senderId: myId,
          receiverId: userToChatId,
        },
        {
          senderId: userToChatId,
          receiverId: myId,
        },
      ],
    });
    res.status(200).json(messages);
  } catch (error) {
    console.log(
      "Error in getMessages controller:",
      error.message
    );
    res.status(500).json({
      error: "Internal server error",
    });
  }
};
// SEND MESSAGE
export const sendMessage = async ( req,res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;
    // HANDLE IMAGE
    let imageUrl;
    if (image) {
      const uploadResponse =
        await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
    }
    // CREATE MESSAGE
    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,  
    });
    await newMessage.save();
    // NORMALIZED PAYLOAD
    const messagePayload = {
      _id: newMessage._id.toString(),
      senderId:
        newMessage.senderId.toString(),
      receiverId:
        newMessage.receiverId.toString(),
      text: newMessage.text,
      image: newMessage.image,
      createdAt: newMessage.createdAt,
      updatedAt: newMessage.updatedAt,
    };
    // GET RECEIVER SOCKET
    const receiverSocketId =
      getReceiverSocketId(receiverId);
    // DEBUG LOGS
    console.log(
      "================================="
    );
    console.log("SENDING MESSAGE");
    console.log( "Sender ID:", senderId.toString() );
    console.log("Receiver ID:",receiverId );
    console.log("Receiver Socket ID:",receiverSocketId);
    console.log("Message Payload:",messagePayload); 
    // REALTIME EMIT
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage",messagePayload);
      console.log("✅ MESSAGE EMITTED");
    } else {
      console.log(
        "❌ RECEIVER SOCKET NOT FOUND"
      );
    }
    res.status(201).json(messagePayload);
  } catch (error) {
    console.log("Error in sendMessage controller:",error.message );
    res.status(500).json({ error: "Internal server error"});
  }
};