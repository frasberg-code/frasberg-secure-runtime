import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  FlatList, StyleSheet, SafeAreaView, StatusBar
} from 'react-native';
import { useMeshSocket } from '../hooks/useMeshSocket';
import { useMobileVoice } from '../hooks/useMobileVoice';
import { useMeshStore } from '../store/meshStore';

const VOICES = ['lyra', 'nova', 'selene', 'orion', 'atlas', 'vega', 'rhea', 'titan'];

export default function MeshChatScreen() {
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);
  const { sendMessage } = useMeshSocket();
  const { playAudio, stopAudio, isPlaying } = useMobileVoice();
  const { messages, connected, currentVoice, setVoice } = useMeshStore();

  const handleSend = async () => {
    if (!input.trim()) return;
    await sendMessage(input.trim());
    setInput('');
  };

  const renderMessage = ({ item }) => {
    const isUser = item.direction === 'outgoing';
    return (
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.luchiiiBubble]}>
        <Text style={styles.bubbleLabel}>{isUser ? 'You' : '🔒 Luchii'}</Text>
        <Text style={styles.bubbleText}>{item.content}</Text>
        {item.audio && (
          <TouchableOpacity onPress={() => playAudio(item.audio, item.audio_format)}>
            <Text style={styles.audioBtn}>🔊 Play</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔒 Luchii Mesh</Text>
        <Text style={connected ? styles.online : styles.offline}>
          {connected ? '🟢 Live' : '🔴 Reconnecting...'}
        </Text>
      </View>
      {/* Voice Selector */}
      <View style={styles.voiceRow}>
        {VOICES.map((v) => (
          <TouchableOpacity
            key={v}
            onPress={() => setVoice(v)}
            style={[styles.voiceChip, currentVoice === v && styles.voiceChipActive]}
          >
            <Text style={[styles.voiceChipText, currentVoice === v && styles.voiceChipTextActive]}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        {isPlaying && (
          <TouchableOpacity onPress={stopAudio} style={styles.stopBtn}>
            <Text style={styles.stopBtnText}>⏹</Text>
          </TouchableOpacity>
        )}
      </View>
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Message Luchii..."
          placeholderTextColor="#666"
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d1a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a2e' },
  headerTitle: { color: '#6c63ff', fontSize: 18, fontWeight: 'bold' },
  online: { color: '#00e676', fontWeight: 'bold' },
  offline: { color: '#ff5252', fontWeight: 'bold' },
  voiceRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 10, gap: 6 },
  voiceChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: '#6c63ff' },
  voiceChipActive: { backgroundColor: '#6c63ff' },
  voiceChipText: { color: '#aaa', fontSize: 12 },
  voiceChipTextActive: { color: '#fff', fontWeight: 'bold' },
  stopBtn: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, backgroundColor: '#ff5252' },
  stopBtnText: { color: '#fff', fontSize: 12 },
  messageList: { padding: 16 },
  bubble: { padding: 12, borderRadius: 14, marginBottom: 10, maxWidth: '80%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#6c63ff' },
  luchiiiBubble: { alignSelf: 'flex-start', backgroundColor: '#1a1a2e' },
  bubbleLabel: { color: '#aaa', fontSize: 11, marginBottom: 4 },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 22 },
  audioBtn: { color: '#00e676', marginTop: 6, fontSize: 13 },
  inputRow: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#1a1a2e', gap: 8 },
  input: { flex: 1, backgroundColor: '#1a1a2e', color: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14 },
  sendBtn: { backgroundColor: '#6c63ff', borderRadius: 10, paddingHorizontal: 18, justifyContent: 'center' },
  sendBtnText: { color: '#fff', fontWeight: 'bold' },
});
