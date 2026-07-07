import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X,Sparkles} from "lucide-react";
import toast from "react-hot-toast";
const MessageInput = () => {
  // LOCAL STATE
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
 
  // CHAT STORE
const {
  sendMessage,
  generateSmartReplies,
  smartReplies,
  isGeneratingReplies,
} = useChatStore();
  // HANDLE IMAGE CHANGE
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(
        "Please select an image file"
      );
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };
  // REMOVE IMAGE
  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  // SEND MESSAGE
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() &&!imagePreview ) {
      return;
    }
    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });
      // CLEAR INPUTS
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );
    }
  };
  // UI
  return (
    <div className="p-4 w-full">
      {/* IMAGE PREVIEW */}
      {imagePreview && (
        <div className="mb-3 flex items-center gap-2">
          <div className="relative">
            <img src={imagePreview} alt="Preview" className=" w-20 h-20 object-cover rounded-lg border border-zinc-700 " />

            {/* REMOVE IMAGE BUTTON */}
            <button
              type="button"
              onClick={removeImage}
              className="
                absolute
                -top-1.5
                -right-1.5
                w-5 h-5
                rounded-full
                bg-base-300
                flex items-center
                justify-center
              "
            >
              <X className="size-3" />
            </button>
          </div>
        </div>
      )}
      {/* AI SMART REPLIES */}
<div className="mb-3">
  <button
    type="button"
    onClick={generateSmartReplies}
    disabled={isGeneratingReplies}
    className="btn btn-outline btn-sm gap-2"
  >
    <Sparkles size={16} />
    {isGeneratingReplies ? "Thinking..." : "AI Smart Replies"}
  </button>
</div>
{smartReplies.length > 0 && (
  <div className="mb-3 flex flex-wrap gap-2">
    {smartReplies.map((reply, index) => (
      <button
        key={index}
        type="button"
        onClick={() => setText(reply)}
        className="
          px-4
          py-2
          rounded-full
          bg-base-200
          hover:bg-primary
          hover:text-white
          transition
          text-sm
        "
      >
        {reply}
      </button>
    ))}
  </div>
)}

      {/* FORM */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2">
        <div className="flex-1 flex gap-2">
          {/* TEXT INPUT */}
          <input  type="text" placeholder="Type a message..." value={text}  onChange={(e) => setText(e.target.value)  }
            className=" w-full input input-bordered rounded-lg input-sm sm:input-md"/>
          {/* HIDDEN FILE INPUT */}
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageChange}/>
          {/* IMAGE BUTTON */}
          <button type="button" onClick={() => fileInputRef.current?.click()}
            className={` hidden sm:flex btn btn-circle ${ imagePreview ? "text-emerald-500"  : "text-zinc-400"  }`} >
            <Image size={20} />
          </button>
        </div>

        {/* SEND BUTTON */}
        <button type="submit" disabled={ !text.trim() && !imagePreview}
          className="btn btn-sm btn-circle ">
          <Send size={22} />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;