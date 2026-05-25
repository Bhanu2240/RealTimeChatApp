import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";
export const useChatStore = create((set, get) => ({

  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get(
        "/messages/users"
      );
      set({ users: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Failed to load users"
      );
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });

    try {
      const res = await axiosInstance.get(
        `/messages/${userId}`
      );

      set({
        messages: res.data,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Failed to load messages"
      );
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser } = get();

    if (!selectedUser) return;

    try {
      const authUser =
        useAuthStore.getState().authUser;

      if (
        String(selectedUser._id) ===
        String(authUser._id)
      ) {
        toast.error(
          "Cannot send message to yourself"
        );

        return;
      }
      // SEND TO BACKEND
      const res = await axiosInstance.post(
        `/messages/send/${selectedUser._id}`,
        messageData
      );
      set((state) => {
        const exists = state.messages.some(
          (msg) => msg._id === res.data._id
        );

        if (exists) return state;

        return {
          messages: [
            ...state.messages,
            res.data,
          ],
        };
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Failed to send message"
      );
    }
  },
  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;

    if (!socket) {
      console.log("❌ No socket");
      return;
    }

    socket.off("newMessage");

    socket.on("newMessage", (newMessage) => {
      console.log(
        "📩 REALTIME MESSAGE:",
        newMessage
      );

      set((state) => {
        const alreadyExists =
          state.messages.some(
            (msg) =>
              msg._id === newMessage._id
          );

        if (alreadyExists) {
          return state;
        }

        return {
          messages: [
            ...state.messages,
            newMessage,
          ],
        };
      });
    });

    console.log(
      "✅ SOCKET LISTENER ACTIVE"
    );
  },
  unsubscribeFromMessages: () => {
    const socket =
      useAuthStore.getState().socket;

    if (!socket) return;

    socket.off("newMessage");

    console.log(
      "❌ REALTIME LISTENER REMOVED"
    );
  },
  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
  },
}));

