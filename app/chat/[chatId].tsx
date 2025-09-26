import { useWebSocketStore } from "@/store/websocket-store";
import { useAuthStore } from "@/store/auth-store";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import type { Message } from "@/types/chat-types";
import { useChat } from "@/hooks/use-chat";
import { ArrowLeft } from "lucide-react-native";

export default function ChatPage() {
  const {
    chatId,
    receiverUserId,
    receiverUserName,
  }: {
    chatId: string;
    receiverUserId: string;
    receiverUserName: string;
  } = useLocalSearchParams();

  const { user } = useAuthStore();
  const { isConnected, actions } = useWebSocketStore();

  const { getChat, getChatBetweenUsers, createNewChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [realChatId, setRealChatId] = useState<string | null>(null);
  const [isNewChat, setIsNewChat] = useState(false);

  // Verificar si es un chat nuevo o existente
  useEffect(() => {
    if (chatId === "new") {
      setIsNewChat(true);
      // Verificar si ya existe un chat entre estos usuarios
      getChatBetweenUsers(receiverUserId)
        .then((existingChat) => {
          if (existingChat && existingChat.id) {
            // Si existe, usar el chat real pero SIN navegar
            setRealChatId(existingChat.id);
            setIsNewChat(false);
          }
        })
        .catch((error) => {
          console.log("No existing chat found, will create new one");
        });
    } else {
      setRealChatId(chatId);
      setIsNewChat(false);
    }
  }, [chatId, receiverUserId, getChatBetweenUsers]);

  // Cargar historial del chat solo si no es nuevo
  useEffect(() => {
    if (isNewChat || !realChatId) return;

    let isCancelled = false;

    const getChatHistory = async () => {
      try {
        const chatHistory = await getChat(realChatId);
        if (!isCancelled) {
          setMessages(GiftedChat.append([], chatHistory));
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };

    getChatHistory();

    return () => {
      isCancelled = true;
    };
  }, [realChatId, isNewChat, getChat]);

  // Suscribirse al chat solo si tiene un ID real
  useEffect(() => {
    if (!isConnected || isNewChat || !realChatId) return;

    actions.subscribeToChat(realChatId);

    return () => {
      if (isConnected && realChatId) {
        actions.unsubscribeFromChat(realChatId);
      }
    };
  }, [realChatId, isNewChat, isConnected, actions]);

  // Escuchar mensajes nuevos
  useEffect(() => {
    if (isNewChat || !realChatId) return;

    const unsubscribeMessages = actions.on("new_message", (data) => {
      if (data.chat_id === realChatId) {
        setMessages((previousMessages) =>
          GiftedChat.append(previousMessages, [
            {
              _id: data.message_id,
              text: data.content.message,
              createdAt: data.content.created_at,
              user: {
                _id: data.sender.id,
                name: data.sender.name,
              },
            },
          ]),
        );
      }
    });

    return () => {
      unsubscribeMessages();
    };
  }, [realChatId, isNewChat, actions]);

  const onSend = useCallback(
    async (messages: Message[] = []) => {
      const messageText = messages[0].text;

      try {
        if (isNewChat) {
          // Crear el chat con el primer mensaje
          const newChat = await createNewChat(receiverUserId, messageText);

          // Actualizar el estado interno SIN navegar
          setRealChatId(newChat.id);
          setIsNewChat(false);

          // Enviar informacion de nuevo chat al receiver user
          const receiverUser = newChat.users.find(
            (u) => u.id === receiverUserId,
          );

          if (receiverUser) {
            actions.sendNewChat(newChat.id, {
              user: receiverUser,
            });
          }

          // Suscribirse al nuevo chat
          if (isConnected) {
            actions.subscribeToChat(newChat.id);
          }

          // Agregar el mensaje a la UI
          setMessages((previousMessages) =>
            GiftedChat.append(previousMessages, messages),
          );
        } else if (realChatId) {
          // Enviar mensaje en chat existente
          const content = {
            message: messageText,
          };

          actions.sendMessage(realChatId, content);

          setMessages((previousMessages) =>
            GiftedChat.append(previousMessages, messages),
          );
        }
      } catch (error) {
        console.error("Error sending message:", error);
        // Mostrar error al usuario si es necesario
      }
    },
    [
      isNewChat,
      realChatId,
      receiverUserId,
      createNewChat,
      actions,
      isConnected,
    ],
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: isNewChat
            ? "Nuevo Chat"
            : receiverUserName
              ? receiverUserName
              : "Chat",
          headerLeft: () => (
            <View
              style={{
                marginRight: 20,
                alignItems: "center",
                alignContent: "center",
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  router.push("/chats");
                }}
              >
                <ArrowLeft size={26} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      {user && (
        <GiftedChat
          messagesContainerStyle={{
            paddingBottom: 10,
          }}
          messages={messages}
          onSend={(messages) => onSend(messages as any)}
          user={{
            _id: user.id,
            name: user.name,
          }}
          keyboardShouldPersistTaps="never"
          renderMessage={({ currentMessage }) => {
            const isMyMessage = currentMessage.user._id === user!.id;
            return (
              <View
                style={{
                  alignItems: isMyMessage ? "flex-end" : "flex-start",
                  marginVertical: 2,
                  marginHorizontal: 10,
                }}
              >
                {currentMessage && (
                  <View
                    style={{
                      backgroundColor: isMyMessage ? "#dcf8c6" : "#fff",
                      borderRadius: 12,
                      padding: 10,
                      maxWidth: "80%",
                      elevation: 1,
                      shadowColor: "#000",
                      shadowOpacity: 0.1,
                      shadowRadius: 1,
                      shadowOffset: { width: 0, height: 1 },
                    }}
                  >
                    <Text style={{ fontSize: 16, color: "#333" }}>
                      {currentMessage.text}
                    </Text>
                    <View style={{ alignItems: "flex-end", marginTop: 4 }}>
                      <Text style={{ fontSize: 11, color: "#888" }}>
                        {new Date(currentMessage.createdAt).toLocaleTimeString(
                          [],
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
