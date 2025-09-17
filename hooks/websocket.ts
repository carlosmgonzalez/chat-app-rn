import { WS_URL } from "@/utlis/constants";
import { useCallback, useEffect, useState } from "react";

// Define types for better safety and autocompletion
type MessageHandler = (data: any) => void;
type ConnectionChangeCallback = (isConnected: boolean) => void;

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

class WebSocketManager {
  private ws: WebSocket | null = null;
  private userId: string | null = null;
  public isConnected: boolean = false;
  private messageHandlers = new Map<string, MessageHandler[]>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  private messageQueue: object[] = []; // Cola para mensajes pendientes

  // Callback to notify React hooks about connection status changes
  public onConnectionChange: ConnectionChangeCallback | null = null;

  connect(userId: string, wsUrl = WS_URL) {
    if (this.ws && this.isConnected && this.userId === userId) {
      console.log("WebSocket ya conectado para este usuario.");
      return;
    }

    if (this.ws) {
      this.disconnect();
    }

    this.userId = userId;
    // this.reconnectAttempts = 0; // Reset attempts for a new connection

    try {
      this.ws = new WebSocket(`${wsUrl}/chat/ws/${userId}`);

      this.ws.onopen = () => {
        console.log("WebSocket conectado");
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.onConnectionChange?.(true);

        // Procesa la cola de mensajes pendientes
        this.processMessageQueue();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error("Error al parsear el mensaje:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket desconectado");
        this.isConnected = false;
        this.ws = null;
        this.onConnectionChange?.(false);
        this.handleReconnect();
      };

      this.ws.onerror = (error: Event) => {
        console.error("Error de WebSocket:", error);
        // onclose will be called automatically after an error, triggering reconnection logic.
      };
    } catch (error) {
      console.error("Error al conectar con el WebSocket:", error);
    }
  }

  private handleReconnect() {
    if (!this.userId) {
      console.log("No hay ID de usuario para reconectar.");
      return;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.pow(2, this.reconnectAttempts - 1) * 1000; // Exponential backoff

      console.log(
        `Reintentando conexión... (${this.reconnectAttempts}/${
          this.maxReconnectAttempts
        }) en ${delay / 1000}s`
      );
      setTimeout(() => {
        if (this.userId) {
          // Check if userId is still set
          this.connect(this.userId);
        }
      }, delay);
    } else {
      console.log("Se alcanzó el máximo de intentos de reconexión.");
    }
  }

  private handleMessage(data: WebSocketMessage) {
    const { type } = data;
    const handlers = this.messageHandlers.get(type) || [];
    handlers.forEach((handler) => handler(data));
  }

  on(messageType: string, handler: MessageHandler): () => void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)?.push(handler);

    return () => {
      const handlers = this.messageHandlers.get(messageType);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    };
  }

  private processMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift(); // Saca el primer mensaje
      if (message) {
        this.send(message);
      }
    }
  }

  private send(data: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      // Si no, guarda el mensaje para enviarlo más tarde
      console.warn("WebSocket no está conectado. Poniendo el mensaje en cola.");
      this.messageQueue.push(data);
    }
  }

  subscribeToChat(chatId: string) {
    this.send({ type: "subscribe_chat", chat_id: chatId });
  }

  unsubscribeFromChat(chatId: string) {
    this.send({ type: "unsubscribe_chat", chat_id: chatId });
  }

  sendMessage(
    chatId: string,
    content: { message: string; created_at: number | Date }
  ) {
    this.send({ type: "send_message", chat_id: chatId, content });
  }

  sendTyping(chatId: string) {
    this.send({ type: "typing", chat_id: chatId });
  }

  disconnect() {
    if (this.ws) {
      // Prevent reconnection when explicitly disconnecting
      this.reconnectAttempts = this.maxReconnectAttempts;
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.userId = null;
  }
}

// Create a single, shared instance of the WebSocketManager (Singleton pattern)
const webSocketManager = new WebSocketManager();

// Custom hook to interact with the singleton WebSocketManager
export const useWebSocket = (userId: string | null) => {
  const [isConnected, setIsConnected] = useState(webSocketManager.isConnected);

  useEffect(() => {
    // The hook's responsibility is to listen for connection changes
    const connectionListener = (connected: boolean) => {
      setIsConnected(connected);
    };
    webSocketManager.onConnectionChange = connectionListener;

    // If a userId is provided, ensure the connection is active
    if (userId) {
      webSocketManager.connect(userId);
    }

    // Cleanup on unmount
    return () => {
      // We don't disconnect here because the connection is shared across the app.
      // Disconnection should be handled explicitly (e.g., on user logout).
      // We just clean up the listener for this specific component.
      webSocketManager.onConnectionChange = null;
    };
  }, [userId]);

  // Memoize returned functions for performance, preventing unnecessary re-renders
  const subscribeToChat = useCallback(
    (chatId: string) => webSocketManager.subscribeToChat(chatId),
    []
  );
  const unsubscribeFromChat = useCallback(
    (chatId: string) => webSocketManager.unsubscribeFromChat(chatId),
    []
  );
  const sendMessage = useCallback(
    (chatId: string, content: { message: string; created_at: number | Date }) =>
      webSocketManager.sendMessage(chatId, content),
    []
  );
  const sendTyping = useCallback(
    (chatId: string) => webSocketManager.sendTyping(chatId),
    []
  );
  const on = useCallback(
    (messageType: string, handler: MessageHandler) =>
      webSocketManager.on(messageType, handler),
    []
  );

  return {
    isConnected,
    subscribeToChat,
    unsubscribeFromChat,
    sendMessage,
    sendTyping,
    on,
  };
};
