import { useWebSocket } from "@/hooks/websocket";
import { useAuth } from "@/store/auth";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";

export default function Chat() {
  const { chatId }: { chatId: string } = useLocalSearchParams();
  const [typingUsers, setTypingUsers] = useState<any[]>([]);
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const {
    isConnected,
    subscribeToChat,
    unsubscribeFromChat,
    on,
    sendTyping,
    sendMessage,
  } = useWebSocket(user!.id);

  useEffect(() => {
    if (isConnected) {
      subscribeToChat(chatId);
    }

    return () => {
      if (isConnected) {
        unsubscribeFromChat(chatId);
      }
    };
  }, [chatId, isConnected]);

  useEffect(() => {
    // Manejar nuevos mensajes
    const unsubscribeMessages = on("new_message", (data) => {
      if (data.chat_id === chatId) {
        setMessages((prev) => [...prev, data]);
      }
    });

    // Manejar indicadores de escritura
    const unsubscribeTyping = on("typing", (data) => {
      if (data.chat_id === chatId) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.user_id)) {
            return [...prev, data.user_id];
          }
          return prev;
        });

        // Quitar indicador después de 3 segundos
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((id) => id !== data.user_id));
        }, 3000);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [chatId, on]);

  const handleSendMessage = (content: any) => {
    sendMessage(chatId, content);
    // Agregar mensaje localmente de inmediato para UX
    setMessages((prev) => [
      ...prev,
      {
        user_id: user!.id,
        content,
        timestamp: new Date().toISOString(),
        pending: true,
      },
    ]);
  };

  const handleTyping = () => {
    sendTyping(chatId);
  };

  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: "Hello developer",
        createdAt: new Date(),
        user: {
          _id: 2,
          name: "React Native",
          avatar: "https://placeimg.com/140/140/any",
        },
      },
    ]);
  }, []);

  const onSend = useCallback((messages = []) => {
    setMessages((previousMessages) =>
      GiftedChat.append(previousMessages, messages),
    );
  }, []);

  return (
    <GiftedChat
      messages={messages}
      onSend={(messages) => onSend(messages as any)}
      user={{
        _id: 1,
      }}
    />
  );
}
