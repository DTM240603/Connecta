import axios from "axios";
import { getToken } from "../utils/token";

const axiosClient = axios.create({
  baseURL: import.meta.env.API_URL || "http://localhost:8017/api",
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosClient;