import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { login, register } from "../api/client";

export default function LoginScreen({ navigation }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      if (mode === "login") await login(email.trim(), password);
      else await register(name.trim(), email.trim(), password);
      navigation.replace("Chat");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={s.root}>
      <Text style={s.logo}>LUCHII</Text>
      <Text style={s.sub}>Sovereign intelligence by Frasberg</Text>
      {mode === "register" && (
        <TextInput style={s.input} placeholder="Name" placeholderTextColor="#6b6880" value={name} onChangeText={setName} />
      )}
      <TextInput style={s.input} placeholder="Email" placeholderTextColor="#6b6880" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Password" placeholderTextColor="#6b6880" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TouchableOpacity style={s.btn} onPress={submit} disabled={busy}>
        {busy ? <ActivityIndicator color="#07060B" /> : <Text style={s.btnText}>{mode === "login" ? "Sign in" : "Create account"}</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setMode(mode === "login" ? "register" : "login")}>
        <Text style={s.switch}>{mode === "login" ? "New here? Create an account" : "Already have an account? Sign in"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07060B", justifyContent: "center", padding: 28 },
  logo: { color: "#EDEBFF", fontSize: 42, fontWeight: "800", letterSpacing: 6, textAlign: "center" },
  sub: { color: "#8a86a3", textAlign: "center", marginBottom: 36, marginTop: 6 },
  input: { backgroundColor: "#121020", borderColor: "#26233a", borderWidth: 1, borderRadius: 14, color: "#EDEBFF", padding: 14, marginBottom: 12 },
  btn: { backgroundColor: "#B9A7FF", borderRadius: 999, padding: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#07060B", fontWeight: "700", fontSize: 16 },
  switch: { color: "#8a86a3", textAlign: "center", marginTop: 18 },
  error: { color: "#ff7b7b", marginBottom: 8, textAlign: "center" },
});
