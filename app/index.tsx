import { useAuth } from "@/store/auth";
import { Redirect } from "expo-router";
import { useState } from "react";
import {
  Text,
  TextInput,
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";

export default function Index() {
  const { register, login, user } = useAuth();
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async () => {
    if (
      !userInfo.email.trim() ||
      !userInfo.email.trim() ||
      !userInfo.password.trim()
    ) {
      return setErrorMessage("you must complete all fields");
    }

    setIsLoading(true);
    try {
      await register(userInfo.name, userInfo.email, userInfo.password);

      setUserInfo({
        name: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setErrorMessage((err as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!userInfo.email.trim() || !userInfo.password.trim()) {
      return setErrorMessage("you must complete all fields");
    }

    console.log(userInfo);

    setIsLoading(true);
    try {
      await login(userInfo.email, userInfo.password);

      setUserInfo({
        name: "",
        email: "",
        password: "",
      });
    } catch (err) {
      setErrorMessage((err as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return <Redirect href="/(tabs)/chats" />;
  }

  return (
    <View style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          marginHorizontal: 10,
        }}
      >
        <Text
          style={{
            fontSize: 40,
            fontWeight: "heavy",
          }}
        >
          {isLogin ? "Login" : "Register"}
        </Text>
        {!isLogin && (
          <TextInput
            value={userInfo.name}
            onChangeText={(val) => {
              setUserInfo((prev) => ({ ...prev, name: val }));
            }}
            placeholder="Full name"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
            style={styles.input}
          />
        )}
        <TextInput
          value={userInfo.email}
          onChangeText={(val) => {
            setUserInfo((prev) => ({ ...prev, email: val }));
          }}
          placeholder="Email"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          style={styles.input}
        />
        <TextInput
          value={userInfo.password}
          onChangeText={(val) => {
            setUserInfo((prev) => ({ ...prev, password: val }));
          }}
          placeholder="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          editable={!isLoading}
          style={styles.input}
        />

        <TouchableOpacity
          onPress={() => {
            if (isLogin) {
              handleLogin();
            } else {
              handleRegister();
            }
          }}
          disabled={isLoading}
          style={{
            backgroundColor: "#000",
            borderRadius: 8,
            paddingVertical: 10,
            justifyContent: "center",
            alignItems: "center",
            width: "100%",
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text
              style={{
                color: "#fff",
                fontWeight: "bold",
              }}
            >
              {isLogin ? "Login" : "Register"}
            </Text>
          )}
        </TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
          <Text style={{ fontSize: 16 }}>Are you already have an account?</Text>
          <TouchableOpacity onPress={() => setIsLogin((prev) => !prev)}>
            <Text
              style={{
                textDecorationLine: "underline",
                fontWeight: "bold",
                fontSize: 17,
              }}
            >
              {isLogin ? "Register" : "Login"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: "rgba(196,194,194,0.8)",
    borderRadius: 8,
    width: "100%",
  },
});
