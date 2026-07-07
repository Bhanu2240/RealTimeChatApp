import Message from "../models/message.model.js";
import { generateContent } from "../lib/gemini.js";
import { buildSmartReplyPrompt } from "../utils/promptBuilder.js";

export const generateSmartReplies = async (req, res) => {
  try {
    const myId = req.user._id;
    const { receiverId } = req.body;

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    // Fetch latest 10 messages
    const messages = await Message.find({
      $or: [
        {
          senderId: myId,
          receiverId,
        },
        {
          senderId: receiverId,
          receiverId: myId,
        },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10);

    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No conversation found",
      });
    }

    // Arrange oldest -> newest
    const orderedMessages = messages.reverse();

    // Build conversation
    const conversation = orderedMessages
      .map((msg) => {
        const sender =
          msg.senderId.toString() === myId.toString()
            ? "Me"
            : "Friend";

        if (msg.text?.trim()) {
          return `${sender}: ${msg.text}`;
        }

        if (msg.image) {
          return `${sender}: [Image Sent]`;
        }

        return null;
      })
      .filter(Boolean)
      .join("\n");

    // Generate prompt
    const prompt = buildSmartReplyPrompt(conversation);

    // Debug Logs
    console.log("========== Conversation ==========");
    console.log(conversation);

    console.log("========== Prompt ==========");
    console.log(prompt);

    // Call Gemini
    const aiResponse = await generateContent(prompt);

    console.log("========== Gemini Response ==========");
    console.log(aiResponse);

    // Parse AI response safely
    let replies;

    try {
      const cleanedResponse = aiResponse
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      replies = JSON.parse(cleanedResponse);
    } catch (err) {
      console.error("Failed to parse Gemini response");
      console.error(aiResponse);

      return res.status(500).json({
        success: false,
        message: "Gemini returned an invalid response format.",
      });
    }

    return res.status(200).json({
      success: true,
      replies,
    });
  } catch (error) {
    console.error("Smart Reply Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate smart replies.",
    });
  }
};