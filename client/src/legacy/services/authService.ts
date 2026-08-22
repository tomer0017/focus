import { axiosInstance } from "../api/axiosInstance";

interface RegisterPayload {
  username: string;
  password: string;
}

interface LoginPayload {
  username: string;
  password: string;
}

export const authService = {
  async register(payload: RegisterPayload) {
    const res = await axiosInstance.post("/api/auth/register", payload);
    return res.data;
  },

  async login(payload: LoginPayload) {
    const res = await axiosInstance.post("/api/auth/login", payload);
    return res.data;
  },
};
