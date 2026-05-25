import { useEffect, useRef, useState, } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";
import MessageSkeleton from "./skeletons/MessageSkeleton";
import { formatMessageTime } from "../lib/utils";
import { translateText } from "../lib/translate";
const ChatContainer = () => {
  // CHAT STORE
  const messages = useChatStore(
    (state) => state.messages
  );
  const getMessages = useChatStore(
    (state) => state.getMessages
  );
  const isMessagesLoading = useChatStore(
    (state) => state.isMessagesLoading
  );
  const selectedUser = useChatStore(
    (state) => state.selectedUser
  );
  const subscribeToMessages = useChatStore(
    (state) => state.subscribeToMessages
  );
  const unsubscribeFromMessages = useChatStore(
    (state) => state.unsubscribeFromMessages
  );
  // AUTH STORE
  const authUser = useAuthStore(
    (state) => state.authUser
  );

  // REF
  const messageEndRef = useRef(null);
  // TRANSLATED MESSAGES
  const [translatedMessages, setTranslatedMessages] = useState({});
  // SELECTED LANGUAGES
  const [selectedLanguages, setSelectedLanguages] = useState({});
  // FETCH MESSAGES
  useEffect(() => {
    if (!selectedUser?._id) return;
    getMessages(selectedUser._id)
  }, [selectedUser?._id]);
  // SOCKET SUBSCRIPTION
  useEffect(() => {
    if (!selectedUser?._id) return;
    subscribeToMessages();
    return () => { unsubscribeFromMessages() }
  }, []);
  // AUTO SCROLL
  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages]);
  // HANDLE TRANSLATION

  const handleTranslate = async (messageId, text, language) => {
    try {
      if (language === "original") {
        setTranslatedMessages((prev) => ({ ...prev, [messageId]: null }));
        return;
      }
      const translated = await translateText(text, language);
      setTranslatedMessages((prev) => ({ ...prev, [messageId]: translated }))
    }
    catch (error) { console.log(error) }
  };
  // SPEAK MESSAGE
  const speakMessage = (text, lang) => {
    if (!text) return;
    const languageMap = {
      ta: "ta",
      hi: "hi",
      te: "te",
      fr: "fr",
      original: "en",
    };
    const selectedLang =
      languageMap[lang] || "en";
    const audioUrl =
      `https://translate.google.com/?sl=auto&tl=${selectedLang}&text=${encodeURIComponent(
        text
      )}&op=translate`;
    window.open(audioUrl, "_blank");
  };
  // LOADING
  if (isMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-auto">
        <ChatHeader />
        <MessageSkeleton />
        <MessageInput />
      </div>
    );
  }
  // UI
  return (
    <div className="flex-1 flex flex-col overflow-auto">
      <ChatHeader />

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          // NORMALIZE IDS
          const senderId =
            message.senderId?._id ||
            message.senderId;

          const isSender =
            String(senderId) ===
            String(authUser?._id);
          return (
            <div key={message._id} className={`chat ${isSender ? "chat-end" : "chat-start"}`}>
              {/* AVATAR */}
              <div className="chat-image avatar">
                <div className="size-10 rounded-full border">
                  <img src={isSender ? authUser?.profilePic || "/avatar.png" : selectedUser?.profilePic || "/avatar.png"} alt="profile" />
                </div>
              </div>
              {/* TIME */}
              <div className="chat-header mb-1">
                <time className="text-xs opacity-50 ml-1">
                  {formatMessageTime(message.createdAt)}
                </time>
              </div>
              {/* MESSAGE */}
              <div className="chat-bubble flex flex-col gap-2">
                {/* IMAGE */}
                {message.image && (
                  <img src={message.image} alt="Attachment" className="sm:max-w-[200px] rounded-md mb-2 " />
                )}
                {/* TEXT */}
                <p>{translatedMessages[message._id] || message.text}</p>
                {/* TRANSLATE DROPDOWN */}
                <select className=" select select-bordered select-xs w-32"
                  onChange={(e) => {
                    setSelectedLanguages((prev) => ({ ...prev, [message._id]: e.target.value }));
                    handleTranslate(
                      message._id,
                      message.text,
                      e.target.value
                    );
                  }} >
                  <option value="original">
                    Original
                  </option>
                  <option value="ta">
                    Tamil
                  </option>
                  <option value="hi">
                    Hindi
                  </option>
                  <option value="te">
                    Telugu
                  </option>
                  <option value="fr">
                    French
                  </option>
                </select>

                {/* SPEAK BUTTON */}
                <button
                  className="
                    btn
                    btn-xs
                    btn-outline
                    mt-1
                  "
                  onClick={() => speakMessage(translatedMessages[message._id] || message.text,
                    selectedLanguages[message._id] || "original")}>
                  🔊 Speak
                </button>
              </div>
            </div>
          );
        })}
        {/* AUTO SCROLL */}
        <div ref={messageEndRef} />
      </div>
      <MessageInput />
    </div>
  );
};

export default ChatContainer;