import { BASE_URL } from "@/utlis/constants";
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as jose from "jose";

type User = {
  id: string;
  name: string;
  email: string;
};

interface AuthState {
  user: User | null;
  token: string | null;
  checkAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  checkAuth: async () => {
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      const userInfo = jose.decodeJwt(token) as User;
      set({ token, user: userInfo });
    }
  },
  login: async (email, password) => {
    try {
      const body = new FormData();

      body.append("username", email);
      body.append("password", password);

      const response = await fetch(`${BASE_URL}/auth/token`, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body,
      });

      if (!response.ok) {
        throw new Error("Something went wrong while user logging");
      }

      const { access_token } = await response.json();
      await SecureStore.setItemAsync("token", access_token);

      const userInfo = jose.decodeJwt(access_token) as User;

      set({ token: access_token, user: userInfo });
    } catch (error) {
      console.log(error);
      throw new Error("Something went wrong while user logging");
    }
  },
  register: async (name, email, password) => {
    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error("Email already exists");
        }
      }
    } catch (error) {
      console.log(error);
      throw new Error("Something went wrong while registering user");
    }
  },
  logout: async () => {
    await SecureStore.setItemAsync("token", "");
    set({ token: null, user: null });
  },
}));
