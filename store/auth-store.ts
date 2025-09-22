import { BASE_URL } from "@/utlis/constants";
import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import * as jose from "jose";
import type { User } from "@/types/user-types";

interface AuthState {
  user: User | null;
  token: string | null;
  checkAuth: () => void;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchWithAuth: (url: string, options: RequestInit) => Promise<Response>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  checkAuth: async () => {
    const token = await SecureStore.getItemAsync("token");

    if (token) {
      const { exp, ...userInfo } = jose.decodeJwt(token);
      const currentTime = Math.floor(Date.now() / 1000); // en segundos
      if (exp && exp < currentTime) {
        set({ token: null, user: null });
      } else {
        set({ token, user: userInfo as User });
      }
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

      if (!response.ok && response.status === 401) {
        throw new Error("Incorrect username or password");
      }

      const { access_token } = await response.json();
      await SecureStore.setItemAsync("token", access_token);

      const userInfo = jose.decodeJwt(access_token) as User;

      set({ token: access_token, user: userInfo });
    } catch (error) {
      console.log(error);
      throw new Error((error as any).message);
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
  fetchWithAuth: async (url: string, options: RequestInit) => {
    const accessToken = get().token;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      console.log("Api request failed with 401, attempting to refresh token");
    }

    return response;
  },
}));
