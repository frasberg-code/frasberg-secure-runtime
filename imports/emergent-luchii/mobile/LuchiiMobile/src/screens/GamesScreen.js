import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { GAME_URL } from "../config";

export default function GamesScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  return (
    <View style={s.root}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.back} testID="games-back-btn">
          <Text style={s.backText}>‹ BACK</Text>
        </TouchableOpacity>
        <Text style={s.title}>STREET VYBZ</Text>
        <View style={{ width: 60 }} />
      </View>
      {loading && <ActivityIndicator color="#f0c040" style={s.spinner} size="large" />}
      <WebView
        testID="game-webview"
        source={{ uri: GAME_URL }}
        style={s.web}
        onLoadEnd={() => setLoading(false)}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        domStorageEnabled
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#07060B" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 54, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#1c1930" },
  back: { width: 60 },
  backText: { color: "#B9A7FF", fontSize: 14, fontWeight: "700" },
  title: { color: "#f0c040", fontSize: 16, fontWeight: "800", letterSpacing: 3 },
  web: { flex: 1, backgroundColor: "#0d0d1a" },
  spinner: { position: "absolute", top: "50%", alignSelf: "center", zIndex: 2 },
});
