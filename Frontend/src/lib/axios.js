import axios from "axios";

export const axiosInstance = axios.create({
  baseURL:
    window.location.hostname === "localhost"
      ? "http://localhost:5001/api"
      : "http://18.208.197.41:5001/api",

  withCredentials: true,
});