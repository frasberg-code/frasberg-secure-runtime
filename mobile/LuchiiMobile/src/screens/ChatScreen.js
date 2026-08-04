import { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { verifyMeshSignature, getMeshPubkey } from "../api/client";
import { MeshClient } from "../api/mesh";
import { initCrypto, encryptLocal, decryptLocal, sealForServer } from "../crypto/e2e";
import AsyncStorage from "@react-native-async-storage/async-storage";

const HISTORY_KEY = "luchii.chat.history.enc";

export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState("connecting");
  const [e2eReady, setE2eReady] = useState(false);
  const meshRef = useRef(null);
  const listRef = useRef(null);
  const pubkeyRef = useRef(null);
  const sessionId = useRef(`mobile-${Date.now()}`);

  useEffect(() => {
    let mesh;
    (async () => {
      await initCrypto();
      const enc = await AsyncStorage.getItem(HISTORY_KEY);
      if (enc) {
        try { setMessages(JSON.parse(await decryptLocal(enc))); } catch { /* fresh start */ }
      }
      mesh = new MeshClient({
        clientId: sessionId.current,
        onStatus: setStatus,
        onMessage: async (frame) => {
          if (frame.event === "connected" && frame.e2e_pubkey) {
            pubkeyRef.current = frame.e2e_pubkey;
            setE2eReady(true);
          } else if (frame.delta) {
            setMessages((m) => {
              const last = m[m.length - 1];
              if (last && last.role === "assistant" && last.streaming) {
                return [...m.slice(0, -1), { ...last, content: last.content + frame.delta }];
              }
              return [...m, { role: "assistant", content: frame.delta, streaming: true }];
            });
          } else if (frame.done) {
            const verified = frame.sig ? await verifyMeshSignature(frame.content || "", frame.sig) : false;
            setMessages((m) => {
              const last = m[m.length - 1];
              const finalized = last && last.streaming
                ? [...m.slice(0, -1), { ...last, content: frame.content || last.content, streaming: false, verified }]
                : [...m, { role: "assistant", content: frame.content, verified }];
              persist(finalized);
              return finalized;
            });
          }
        },
      });
      mesh.connect();
      meshRef.current = mesh;
      try {
        pubkeyRef.current = pubkeyRef.current || (await getMeshPubkey());
        setE2eReady(true);
      } catch { /* hello frame will supply it */ }
    })();
    return () => mesh && mesh.close();
  }, []);

  async function persist(msgs) {
    const enc = await encryptLocal(JSON.stringify(msgs.slice(-100)));
    await AsyncStorage.setItem(HISTORY_KEY, enc);
  }

  async function send() {
    const text = input.trim();
    if (!text || !pubkeyRef.current) return;
    const frame = { content: text, session_id: sessionId.current };
    const sealed = await sealForServer(JSON.stringify(frame), pubkeyRef.current);
    const ok = meshRef.current?.send({ sealed });
    if (ok) {
      setMessages((m) => [...m, { role: "user", content: text }]);
      setInput("");
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  const pillLabel = status !== "connected" ? status.toUpperCase() : e2eReady ? "E2E MESH LIVE" : "MESH LIVE";

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={s.header}>
        <Text style={s.title}>Luchii</Text>
        <View style={[s.pill, status === "connected" ? s.pillOk : s.pillBad]}>
          <Text style={s.pillText}>{pillLabel}</Text>
        </View>
      </View>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[s.bubble, item.role === "user" ? s.user : s.assistant]}>
            <Text style={s.msgText}>{item.content}</Text>
            {item.verified && <Text style={s.verified}>✓ MESH VERIFIED</Text>}
          </View>
        )}
      />
      <View style={s.inputRow}>
        <TextInput style={s.input} placeholder={e2eReady ? "Message Luchii…" : "Establishing encrypted channel…"} placeholderTextColor="#6b6880" value={input} onChangeText={setInput} multiline editable={e2eReady} />
        <TouchableOpacity style={[s.send, !e2eReady && { opacity: 0.4 }]} onPress={send} disabled={!e2eReady}>
          <Text style={s.sendText}>↑</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07060B" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, paddingTop: 54, borderBottomWidth: 1, borderBottomColor: "#1c1930" },
  title: { color: "#EDEBFF", fontSize: 20, fontWeight: "800", letterSpacing: 2 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1 },
  pillOk: { borderColor: "#3ddc84" },
  pillBad: { borderColor: "#ffb020" },
  pillText: { color: "#EDEBFF", fontSize: 10, fontWeight: "700" },
  bubble: { borderRadius: 16, padding: 12, marginBottom: 10, maxWidth: "85%" },
  user: { backgroundColor: "#B9A7FF22", alignSelf: "flex-end", borderWidth: 1, borderColor: "#B9A7FF44" },
  assistant: { backgroundColor: "#121020", alignSelf: "flex-start", borderWidth: 1, borderColor: "#26233a" },
  msgText: { color: "#EDEBFF", fontSize: 15, lineHeight: 21 },
  verified: { color: "#3ddc84", fontSize: 10, fontWeight: "700", marginTop: 6 },
  inputRow: { flexDirection: "row", padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: "#1c1930" },
  input: { flex: 1, backgroundColor: "#121020", borderColor: "#26233a", borderWidth: 1, borderRadius: 18, color: "#EDEBFF", paddingHorizontal: 14, paddingVertical: 10, maxHeight: 120 },
  send: { backgroundColor: "#B9A7FF", borderRadius: 999, width: 44, height: 44, alignItems: "center", justifyContent: "center", alignSelf: "flex-end" },
  sendText: { color: "#07060B", fontSize: 20, fontWeight: "800" },
});
