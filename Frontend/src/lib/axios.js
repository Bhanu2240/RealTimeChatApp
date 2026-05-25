import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://18.208.197.41:5001/api",
  withCredentials: true,
});