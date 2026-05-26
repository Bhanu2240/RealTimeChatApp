import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const BASE_URL =
  import.meta.env.MODE === "development"
    ? "http://localhost:5001"
    : "http://18.208.197.41:5001";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,
  // CHECK AUTH
  checkAuth: async () => {
    try {
      const res = await axiosInstance.get("/auth/check");
      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },
  // SIGNUP
  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post(
        "/auth/signup",
        data);
      set({ authUser: res.data });
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Signup failed"
      );
    } finally {
      set({ isSigningUp: false });
    }
  },
  
  // LOGIN
  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post( "/auth/login", data  );
      set({ authUser: res.data });
      toast.success("Logged in successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Login failed"
      );
    } finally {
      set({ isLoggingIn: false });
    }
  },
  
  // LOGOUT
  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");

      get().disconnectSocket();

      set({
        authUser: null,
        onlineUsers: [],
      });

      toast.success("Logged out successfully");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Logout failed"
      );
    }
  },

  // UPDATE PROFILE

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });

    try {
      const res = await axiosInstance.put(
        "/auth/update-profile",
        data
      );

      set({ authUser: res.data });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("Error updating profile:", error);

      toast.error(
        error.response?.data?.message ||
          "Update failed"
      );
    } finally {
      set({ isUpdatingProfile: false });
    }
  }, 
  // CONNECT SOCKET
  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser?._id) {
      console.log("❌ No auth user");
      return;
    }
    // prevent duplicate sockets
    if (socket?.connected) {
      console.log("✅ Socket already connected");
      return;
    }
    // cleanup old socket
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
    }
    console.log("🔌 Connecting socket...");

    const newSocket = io(BASE_URL, {
      withCredentials: true,
      auth: {
        userId: authUser._id,
      },
     query: {
        userId: authUser._id,
      },
      // IMPORTANT
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    // save socket immediately
    set({ socket: newSocket }); 
    // CONNECT
    newSocket.on("connect", () => {
      console.log(
        "✅ SOCKET CONNECTED:",
        newSocket.id
      );
    });
    // DISCONNECT
    newSocket.on("disconnect", (reason) => {
      console.log(
        "❌ SOCKET DISCONNECTED:",
        reason
      );
    });
    // ONLINE USERS
    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("ONLINE USERS:", userIds);
     set({ onlineUsers: userIds });
    });
    // CONNECTION ERROR
    newSocket.on("connect_error", (error) => {
      console.log(
        "❌ SOCKET CONNECTION ERROR:",
        error.message
      );
    });
 // IMPORTANT:
    // DO NOT CALL newSocket.connect()
    // Socket.IO auto-connects already
  },
  // DISCONNECT SOCKET
  disconnectSocket: () => {
    const socket = get().socket;

    if (!socket) return;

    console.log("🔌 Disconnecting socket");

    socket.removeAllListeners();

    socket.disconnect();

    set({
      socket: null,
      onlineUsers: [],
    });
  },
}));