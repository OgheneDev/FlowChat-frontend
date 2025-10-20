import axios from "axios";

export const axiosInstance = axios.create({
    baseURL: "https://flowchat-81ni.onrender.com/api",
    withCredentials: true,
});