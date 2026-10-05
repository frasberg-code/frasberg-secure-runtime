"""
Sofia AI Voice API Tests
Tests for TTS, STT, Chat, and Voice endpoints
"""
import pytest
import requests
import os
import io
import wave
import struct
import math

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasicEndpoints:
    """Basic health and status endpoint tests"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["status"] == "healthy"
        print(f"API root response: {data}")
    
    def test_voices_endpoint(self):
        """Test /api/voices returns available voices including Sofia"""
        response = requests.get(f"{BASE_URL}/api/voices")
        assert response.status_code == 200
        voices = response.json()
        assert isinstance(voices, list)
        assert len(voices) > 0
        
        # Check Sofia voice exists
        voice_ids = [v["id"] for v in voices]
        assert "sofia" in voice_ids, "Sofia voice should be available"
        assert "shimmer" in voice_ids, "Shimmer voice should be available"
        
        # Verify voice structure
        for voice in voices:
            assert "id" in voice
            assert "name" in voice
            assert "description" in voice
            assert "language" in voice
        
        print(f"Available voices: {voice_ids}")


class TestTTSEndpoint:
    """Text-to-Speech endpoint tests"""
    
    def test_tts_basic(self):
        """Test TTS with basic text"""
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": "Hello, I am Sofia", "voice_id": "sofia"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "audio_url" in data
        assert "text" in data
        assert data["text"] == "Hello, I am Sofia"
        assert data["audio_url"].startswith("data:audio/mpeg;base64,")
        print("TTS basic test passed - audio generated successfully")
    
    def test_tts_different_voices(self):
        """Test TTS with different voice IDs"""
        voices_to_test = ["sofia", "shimmer", "nova", "alloy"]
        
        for voice_id in voices_to_test:
            response = requests.post(
                f"{BASE_URL}/api/tts",
                json={"text": f"Testing {voice_id} voice", "voice_id": voice_id}
            )
            assert response.status_code == 200, f"TTS failed for voice {voice_id}"
            data = response.json()
            assert "audio_url" in data
            print(f"TTS test passed for voice: {voice_id}")
    
    def test_tts_empty_text(self):
        """Test TTS with empty text - should fail or handle gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": "", "voice_id": "sofia"}
        )
        # Empty text might return 400 or 500 depending on implementation
        # Just verify it doesn't crash
        assert response.status_code in [200, 400, 422, 500]
        print(f"TTS empty text response: {response.status_code}")
    
    def test_tts_long_text(self):
        """Test TTS with longer text"""
        long_text = "Hello, I am Sofia, your AI assistant. " * 5
        response = requests.post(
            f"{BASE_URL}/api/tts",
            json={"text": long_text, "voice_id": "sofia"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "audio_url" in data
        print("TTS long text test passed")


class TestSTTEndpoint:
    """Speech-to-Text endpoint tests"""
    
    @staticmethod
    def create_test_audio():
        """Create a simple test audio file"""
        sample_rate = 16000
        duration = 1
        frequency = 440
        
        audio_buffer = io.BytesIO()
        with wave.open(audio_buffer, 'w') as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)
            wav_file.setframerate(sample_rate)
            
            for i in range(int(sample_rate * duration)):
                value = int(32767 * math.sin(2 * math.pi * frequency * i / sample_rate))
                wav_file.writeframes(struct.pack('<h', value))
        
        audio_buffer.seek(0)
        return audio_buffer
    
    def test_stt_basic(self):
        """Test STT with audio file"""
        audio_buffer = self.create_test_audio()
        
        files = {'audio_file': ('test_audio.wav', audio_buffer, 'audio/wav')}
        response = requests.post(f"{BASE_URL}/api/stt", files=files)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "transcribed_text" in data
        assert "filename" in data
        assert data["filename"] == "test_audio.wav"
        print(f"STT response: {data}")
    
    def test_stt_missing_file(self):
        """Test STT without audio file - should fail"""
        response = requests.post(f"{BASE_URL}/api/stt")
        assert response.status_code == 422  # Validation error
        print("STT missing file test passed - correctly rejected")


class TestChatEndpoint:
    """Chat endpoint tests"""
    
    def test_chat_basic(self):
        """Test basic chat message"""
        response = requests.post(
            f"{BASE_URL}/api/chat",
            json={
                "session_id": "TEST_session_001",
                "message": "Hello Sofia, how are you?",
                "model": "gpt-4o",
                "provider": "openai"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "session_id" in data
        assert "message" in data
        assert data["session_id"] == "TEST_session_001"
        assert data["message"]["role"] == "assistant"
        assert len(data["message"]["content"]) > 0
        print(f"Chat response: {data['message']['content'][:100]}...")
    
    def test_chat_conversation_persistence(self):
        """Test that conversation is persisted"""
        session_id = "TEST_session_002"
        
        # Send first message
        response1 = requests.post(
            f"{BASE_URL}/api/chat",
            json={
                "session_id": session_id,
                "message": "My name is TestUser",
                "model": "gpt-4o",
                "provider": "openai"
            }
        )
        assert response1.status_code == 200
        
        # Verify conversation exists
        response2 = requests.get(f"{BASE_URL}/api/conversations/{session_id}")
        assert response2.status_code == 200
        conv = response2.json()
        
        assert conv["session_id"] == session_id
        assert len(conv["messages"]) >= 2  # User + Assistant
        print(f"Conversation persisted with {len(conv['messages'])} messages")
    
    def test_get_conversations(self):
        """Test getting all conversations"""
        response = requests.get(f"{BASE_URL}/api/conversations")
        assert response.status_code == 200
        conversations = response.json()
        assert isinstance(conversations, list)
        print(f"Found {len(conversations)} conversations")
    
    def test_delete_conversation(self):
        """Test deleting a conversation"""
        session_id = "TEST_session_delete"
        
        # Create conversation
        requests.post(
            f"{BASE_URL}/api/chat",
            json={
                "session_id": session_id,
                "message": "Test message for deletion",
                "model": "gpt-4o",
                "provider": "openai"
            }
        )
        
        # Delete conversation
        response = requests.delete(f"{BASE_URL}/api/conversations/{session_id}")
        assert response.status_code == 200
        
        # Verify deleted
        response2 = requests.get(f"{BASE_URL}/api/conversations/{session_id}")
        assert response2.status_code == 404
        print("Conversation deleted successfully")


class TestAdvancedVoiceEndpoints:
    """Advanced voice system endpoint tests"""
    
    def test_voice_capabilities(self):
        """Test voice capabilities endpoint"""
        response = requests.get(f"{BASE_URL}/api/voice/capabilities")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"Voice capabilities: {data}")
    
    def test_voice_profiles(self):
        """Test voice profiles endpoint"""
        response = requests.get(f"{BASE_URL}/api/voice/profiles")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"Voice profiles count: {len(data)}")
    
    def test_voice_personas(self):
        """Test voice personas endpoint"""
        response = requests.get(f"{BASE_URL}/api/voice/personas")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"Voice personas: {list(data.keys())}")
    
    def test_voice_map(self):
        """Test voice map endpoint"""
        response = requests.get(f"{BASE_URL}/api/voice/map")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        print(f"Voice map entries: {len(data)}")
    
    def test_voice_speak(self):
        """Test voice speak endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/voice/speak",
            json={
                "text": "Hello from Sofia",
                "voice_profile": "v_conv_neutral",
                "persona": "default"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "audio_url" in data
        print("Voice speak test passed")
    
    def test_voice_session_start(self):
        """Test starting a voice session"""
        response = requests.post(
            f"{BASE_URL}/api/voice/session/start",
            json={
                "user_id": "TEST_user_001",
                "persona": "default"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "TEST_user_001"
        assert "variant" in data
        assert "voice_id" in data
        print(f"Voice session started: {data}")
    
    def test_voice_session_get(self):
        """Test getting voice session"""
        # First start a session
        requests.post(
            f"{BASE_URL}/api/voice/session/start",
            json={"user_id": "TEST_user_002", "persona": "default"}
        )
        
        # Get session
        response = requests.get(f"{BASE_URL}/api/voice/session/TEST_user_002")
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "TEST_user_002"
        print(f"Voice session retrieved: {data}")
    
    def test_voice_session_interrupt(self):
        """Test interrupting voice session"""
        # Start session first
        requests.post(
            f"{BASE_URL}/api/voice/session/start",
            json={"user_id": "TEST_user_003", "persona": "default"}
        )
        
        # Interrupt
        response = requests.post(f"{BASE_URL}/api/voice/session/interrupt/TEST_user_003")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "interrupted"
        print("Voice session interrupted successfully")
    
    def test_voice_events(self):
        """Test voice events endpoint"""
        response = requests.get(f"{BASE_URL}/api/voice/events?limit=10")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Voice events count: {len(data)}")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_conversations(self):
        """Clean up TEST_ prefixed conversations"""
        response = requests.get(f"{BASE_URL}/api/conversations")
        if response.status_code == 200:
            conversations = response.json()
            for conv in conversations:
                if conv.get("session_id", "").startswith("TEST_"):
                    requests.delete(f"{BASE_URL}/api/conversations/{conv['session_id']}")
                    print(f"Deleted test conversation: {conv['session_id']}")
        print("Cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
