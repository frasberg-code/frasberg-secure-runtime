"""
Test suite for Sofia Virtual Assistant - New Features
Tests: Video Calling, Music Generation, Video Generation APIs
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://intellichat-173.preview.emergentagent.com')

class TestVideoCallingAPI:
    """Tests for Video Calling (Daily.co) endpoints"""
    
    def test_create_call_room(self):
        """Test creating a new video call room"""
        response = requests.post(
            f"{BASE_URL}/api/calls/rooms",
            json={
                "room_name": f"test-room-{uuid.uuid4().hex[:8]}",
                "participant_name": "Test User",
                "privacy": "public"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "room_url" in data, "Response should contain room_url"
        assert "room_name" in data, "Response should contain room_name"
        assert "token" in data, "Response should contain token"
        assert "created_at" in data, "Response should contain created_at"
        
        # Store room_name for subsequent tests
        self.room_name = data["room_name"]
        print(f"✓ Created room: {data['room_name']}")
        return data["room_name"]
    
    def test_join_call_room(self):
        """Test joining an existing call room"""
        # First create a room
        create_response = requests.post(
            f"{BASE_URL}/api/calls/rooms",
            json={
                "room_name": f"test-join-{uuid.uuid4().hex[:8]}",
                "participant_name": "Host User",
                "privacy": "public"
            }
        )
        assert create_response.status_code == 200
        room_name = create_response.json()["room_name"]
        
        # Now join the room
        join_response = requests.post(
            f"{BASE_URL}/api/calls/rooms/{room_name}/join",
            json={"participant_name": "Guest User"}
        )
        assert join_response.status_code == 200, f"Expected 200, got {join_response.status_code}: {join_response.text}"
        
        data = join_response.json()
        assert "room_url" in data
        assert "room_name" in data
        assert data["room_name"] == room_name
        print(f"✓ Joined room: {room_name}")
    
    def test_join_nonexistent_room(self):
        """Test joining a room that doesn't exist"""
        response = requests.post(
            f"{BASE_URL}/api/calls/rooms/nonexistent-room-12345/join",
            json={"participant_name": "Test User"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Correctly returns 404 for nonexistent room")
    
    def test_end_call(self):
        """Test ending a call"""
        # First create a room
        create_response = requests.post(
            f"{BASE_URL}/api/calls/rooms",
            json={
                "room_name": f"test-end-{uuid.uuid4().hex[:8]}",
                "participant_name": "Host User",
                "privacy": "public"
            }
        )
        assert create_response.status_code == 200
        room_name = create_response.json()["room_name"]
        
        # End the call
        end_response = requests.post(f"{BASE_URL}/api/calls/rooms/{room_name}/end")
        assert end_response.status_code == 200, f"Expected 200, got {end_response.status_code}"
        
        data = end_response.json()
        assert data["status"] == "ended"
        assert data["room_name"] == room_name
        print(f"✓ Ended call: {room_name}")
    
    def test_get_room_participants(self):
        """Test getting participants in a room"""
        # First create a room
        create_response = requests.post(
            f"{BASE_URL}/api/calls/rooms",
            json={
                "room_name": f"test-participants-{uuid.uuid4().hex[:8]}",
                "participant_name": "Host User",
                "privacy": "public"
            }
        )
        assert create_response.status_code == 200
        room_name = create_response.json()["room_name"]
        
        # Get participants
        participants_response = requests.get(f"{BASE_URL}/api/calls/rooms/{room_name}/participants")
        assert participants_response.status_code == 200
        
        data = participants_response.json()
        assert "participants" in data
        assert "participant_count" in data
        assert "Host User" in data["participants"]
        print(f"✓ Got participants for room: {room_name}")


class TestMusicGenerationAPI:
    """Tests for Music Generation endpoints"""
    
    def test_generate_music(self):
        """Test music generation endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/music/generate",
            json={
                "prompt": "A chill reggae beat with summer vibes",
                "duration": 30,
                "genre": "Reggae"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain id"
        assert "status" in data, "Response should contain status"
        assert data["status"] == "completed"
        print(f"✓ Music generation returned: {data}")
    
    def test_generate_music_minimal(self):
        """Test music generation with minimal parameters"""
        response = requests.post(
            f"{BASE_URL}/api/music/generate",
            json={"prompt": "Electronic dance music"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "status" in data
        print("✓ Music generation with minimal params works")
    
    def test_get_music_library(self):
        """Test getting music library"""
        response = requests.get(f"{BASE_URL}/api/music/library")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Music library returned {len(data)} tracks")


class TestVideoGenerationAPI:
    """Tests for Video Generation (Sora 2) endpoints"""
    
    def test_generate_video(self):
        """Test video generation endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/video/generate",
            json={
                "prompt": "A serene sunset over ocean waves",
                "duration": 5,
                "aspect_ratio": "16:9",
                "quality": "high",
                "style": "realistic"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "id" in data, "Response should contain id"
        assert "status" in data, "Response should contain status"
        assert data["status"] == "completed"
        print(f"✓ Video generation returned: {data}")
    
    def test_generate_video_minimal(self):
        """Test video generation with minimal parameters"""
        response = requests.post(
            f"{BASE_URL}/api/video/generate",
            json={"prompt": "A butterfly flying through a garden"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert "status" in data
        print("✓ Video generation with minimal params works")
    
    def test_generate_video_different_styles(self):
        """Test video generation with different styles"""
        styles = ["realistic", "cinematic", "anime", "abstract"]
        
        for style in styles:
            response = requests.post(
                f"{BASE_URL}/api/video/generate",
                json={
                    "prompt": f"Test video in {style} style",
                    "style": style
                }
            )
            assert response.status_code == 200, f"Failed for style {style}"
        
        print(f"✓ Video generation works for all styles: {styles}")
    
    def test_get_video_library(self):
        """Test getting video library"""
        response = requests.get(f"{BASE_URL}/api/video/library")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        print(f"✓ Video library returned {len(data)} videos")


class TestExistingAPIs:
    """Verify existing APIs still work"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ API health check passed")
    
    def test_voices_endpoint(self):
        """Test voices endpoint"""
        response = requests.get(f"{BASE_URL}/api/voices")
        assert response.status_code == 200
        
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check Sofia voice exists
        voice_ids = [v["id"] for v in data]
        assert "sofia" in voice_ids
        print(f"✓ Voices endpoint returned {len(data)} voices")
    
    def test_voice_capabilities(self):
        """Test voice capabilities endpoint"""
        response = requests.get(f"{BASE_URL}/api/voice/capabilities")
        assert response.status_code == 200
        print("✓ Voice capabilities endpoint works")
    
    def test_voice_profiles(self):
        """Test voice profiles endpoint"""
        response = requests.get(f"{BASE_URL}/api/voice/profiles")
        assert response.status_code == 200
        print("✓ Voice profiles endpoint works")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
