import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, Alert
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert("Erreur", "Remplis tous les champs.");
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert("Erreur", e.response?.data?.error || "Connexion impossible.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={s.container}>
      <View style={s.inner}>
        <Text style={s.logo}>AFTER</Text>
        <Text style={s.subtitle}>Vois ton futur avant de le vivre</Text>

        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor="#5a4a3a"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={s.input}
          placeholder="Mot de passe"
          placeholderTextColor="#5a4a3a"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          <Text style={s.btnText}>{loading ? "Connexion..." : "Se connecter"}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
          <Text style={s.link}>Pas encore de compte ? <Text style={s.linkAccent}>Créer un compte</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0a07" },
  inner: { flex: 1, justifyContent: "center", padding: 32 },
  logo: { fontSize: 52, fontStyle: "italic", color: "#c8a97e", textAlign: "center", letterSpacing: 8, marginBottom: 8 },
  subtitle: { color: "#5a4a3a", textAlign: "center", letterSpacing: 2, marginBottom: 48, fontSize: 13 },
  input: {
    borderWidth: 1, borderColor: "rgba(200,169,126,0.2)",
    borderRadius: 10, padding: 16, color: "#e8e0d5",
    marginBottom: 14, fontSize: 15, backgroundColor: "rgba(255,255,255,0.03)",
  },
  btn: {
    backgroundColor: "#c8a97e", borderRadius: 10,
    padding: 16, alignItems: "center", marginTop: 8, marginBottom: 24,
  },
  btnText: { color: "#0d0a07", fontWeight: "700", fontSize: 16, letterSpacing: 1 },
  link: { color: "#5a4a3a", textAlign: "center", fontSize: 14 },
  linkAccent: { color: "#c8a97e" },
});
