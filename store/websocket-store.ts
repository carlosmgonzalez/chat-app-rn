import { webSocketManager } from "@/services/websocket-service";
import { create } from "zustand";
import { useAuthStore } from "./auth-store";

interface WebSocketState {
  isConnected: boolean;
  actions: {
    connect: (userId: string) => void;
    disconnect: () => void;
    subscribeToChat: (chatId: string) => void;
    unsubscribeFromChat: (chatId: string) => void;
    sendMessage: (chatId: string, content: { message: string }) => void;
    sendTyping: (chatId: string) => void;
    on: (messageType: string, handler: (data: any) => void) => () => void;
  };
}

export const useWebSocketStore = create<WebSocketState>()((set) => ({
  isConnected: false,
  actions: {
    connect: (userId) => {
      webSocketManager.onConnectionChange = (connected) => {
        set({ isConnected: connected });
      };
      webSocketManager.connect(userId);
    },
    disconnect: () => {
      webSocketManager.disconnect();
      set({ isConnected: false });
    },
    subscribeToChat: (chatId) => {
      webSocketManager.subscribeToChat(chatId);
    },
    unsubscribeFromChat: (chatId) => {
      webSocketManager.unsubscribeFromChat(chatId);
    },
    sendMessage: (chatId, content) => {
      webSocketManager.sendMessage(chatId, content);
    },
    sendTyping: (chatId) => {
      webSocketManager.sendTyping(chatId);
    },
    on: (messageType, handler) => {
      return webSocketManager.on(messageType, handler);
    },
  },
}));

// ===== CONEXIÓN AUTOMÁTICA BASADA EN LA AUTENTICACIÓN =====
// Esta es la parte clave. Escuchamos los cambios en useAuthStore.

useAuthStore.subscribe((state, prevState) => {
  const { user, token } = state;
  const { user: prevUser, token: prevToken } = prevState;
  const { connect, disconnect } = useWebSocketStore.getState().actions;

  // Si el usuario acaba de iniciar sesión (antes no había usuario, ahora sí)
  if (user && !prevUser && token && !prevToken) {
    console.log("Usuario autenticado, conectando WebSocket...");
    connect(token);
  }
  // Si el usuario acaba de cerrar sesión (antes había usuario, ahora no)
  else if (!user && prevUser && !token && prevToken) {
    console.log("Usuario cerró sesión, desconectando WebSocket...");
    disconnect();
  }
});
