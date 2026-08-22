import axios from "axios";

const user = JSON.parse(localStorage.getItem("user") || "null");

export const axiosInstance = axios.create({
  baseURL: "http://localhost:5001",
  withCredentials: true,
  headers: {
    Authorization: user?.token ? `Bearer ${user.token}` : "",
  },
});
