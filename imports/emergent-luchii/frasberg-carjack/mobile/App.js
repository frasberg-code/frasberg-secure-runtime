// ── Frasberg Carjack — Mobile (Expo WebView shell) ────────────────────────────
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';

const GAME_URL = process.env.EXPO_PUBLIC_GAME_URL || 'https://frasberg.com/games/carjack';

export default function App() {
  const [error, setError] = useState(false);

  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      {error ? (
        <View style={styles.center}>
          <Text style={styles.title}>FRASBERG CARJACK</Text>
          <Text style={styles.sub}>Cannot reach the game server. Check your connection.</Text>
        </View>
      ) : (
        <WebView
          source={{ uri: GAME_URL }}
          style={styles.root}
          javaScriptEnabled
          domStorageEnabled
          allowsFullscreenVideo
          bounces={false}
          onError={() => setError(true)}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.center, StyleSheet.absoluteFill]}>
              <Text style={styles.title}>FRASBERG CARJACK</Text>
              <ActivityIndicator color="#e63946" size="large" />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0a0a0a', gap: 16 },
  title:  { color: '#e63946', fontSize: 26, fontWeight: '800', letterSpacing: 2 },
  sub:    { color: '#888', fontSize: 14 },
});
