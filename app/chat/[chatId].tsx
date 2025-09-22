import { useWebSocketStore } from "@/store/websocket-store";
import { useAuthStore } from "@/store/auth-store";
import { Stack, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { GiftedChat } from "react-native-gifted-chat";
import type { Message } from "@/types/chat-types";
import { useChat } from "@/hooks/use-chat";

export default function ChatPage() {
  const { chatId, userName }: { chatId: string; userName: string } =
    useLocalSearchParams();

  const { getChat } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    // This effect fetches the initial chat history and ensures it's only done once
    // and that the message list is cleared when the chat changes.
    let isCancelled = false;
    const getChatHistory = async () => {
      const chatHistory = await getChat(chatId);
      if (!isCancelled) {
        // Use an empty array as the first argument to replace existing messages,
        // preventing duplicates if the effect runs multiple times.
        setMessages(GiftedChat.append([], chatHistory));
      }
    };

    getChatHistory();

    return () => {
      isCancelled = true;
    };
  }, [chatId, getChat]);

  useEffect(() => {
    // Cleanup the timer when the component unmounts
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const [isTyping, setIsTyping] = useState<boolean>(false);

  // Refs to manage typing state and debounce timer
  const typingTimeoutRef = useRef<number | null>(null);
  const isCurrentlyTyping = useRef(false);

  const handleTyping = () => {
    // If a timer is already running, clear it.
    // This means the user is still typing.
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // If we haven't notified that the user is typing yet,
    // send the event and mark them as typing.
    if (!isCurrentlyTyping.current) {
      isCurrentlyTyping.current = true;
      actions.sendTyping(chatId);
    }

    // Set a new timer. If this timer completes, it means the user
    // has stopped typing for 2 seconds.
    typingTimeoutRef.current = setTimeout(() => {
      isCurrentlyTyping.current = false;
    }, 2000); // 2 seconds of inactivity
  };

  const { user } = useAuthStore();
  const { isConnected, actions } = useWebSocketStore();

  useEffect(() => {
    if (isConnected) {
      actions.subscribeToChat(chatId);
    }

    return () => {
      if (isConnected) {
        actions.unsubscribeFromChat(chatId);
      }
    };
  }, [chatId, isConnected, actions]);

  useEffect(() => {
    // Handle new messages from other users
    const unsubscribeMessages = actions.on("new_message", (data) => {
      if (data.chat_id === chatId) {
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

    // Handle typing indicators
    const unsubscribeTyping = actions.on("typing", (data) => {
      if (data.chat_id === chatId) {
        setIsTyping(true);

        // Remove typing indicator after 3 seconds
        setTimeout(() => {
          // setTypingUsers((prev) => prev.filter((id) => id !== data.user_id));
          setIsTyping(false);
        }, 3000);
      }
    });

    return () => {
      unsubscribeMessages();
      unsubscribeTyping();
    };
  }, [chatId, actions]);

  const onSend = useCallback(
    (messages: Message[] = []) => {
      const content = {
        message: messages[0].text,
      };
      actions.sendMessage(chatId, content);
      // Optimistically update the UI with the new message
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, messages),
      );
    },
    [chatId, actions],
  );

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: userName,
        }}
      />
      <GiftedChat
        messagesContainerStyle={{
          paddingBottom: 10,
        }}
        messages={messages}
        onSend={(messages) => onSend(messages as any)}
        onInputTextChanged={() => {
          handleTyping();
        }}
        isTyping={isTyping}
        user={{
          _id: user!.id,
          avatar:
            "https://lh3.googleusercontent.com/a/ACg8ocIQYmDHhfJP4vdqu6d5WhBP-3jnjdossIu91FLVna2Q5SnIinoshg=s96-c",
          name: user!.name,
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
    </View>
  );
}
