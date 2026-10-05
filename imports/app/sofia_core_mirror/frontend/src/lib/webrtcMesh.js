import { sendSignal } from './webrtcSignaling';

// WebRTC mesh for group calling
// Each participant creates a peer connection with every other participant

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export function createPeerConnection(
  callId,
  localUserId,
  remoteUserId,
  localStream,
  onRemoteStream,
  onConnectionStateChange
) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // Add local tracks to peer connection
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      pc.addTrack(track, localStream);
    });
  }

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal(callId, {
        type: 'ice',
        from: localUserId,
        to: remoteUserId,
        candidate: event.candidate,
      });
    }
  };

  // Handle incoming tracks
  pc.ontrack = (event) => {
    const [stream] = event.streams;
    if (stream) {
      onRemoteStream(remoteUserId, stream);
    }
  };

  // Handle connection state changes
  pc.onconnectionstatechange = () => {
    if (onConnectionStateChange) {
      onConnectionStateChange(remoteUserId, pc.connectionState);
    }
  };

  return pc;
}

export async function createOfferForPeer(callId, localUserId, remoteUserId, pc) {
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    await sendSignal(callId, {
      type: 'offer',
      from: localUserId,
      to: remoteUserId,
      sdp: offer,
    });
  } catch (error) {
    console.error('Error creating offer:', error);
  }
}

export async function handleIncomingSignal(
  callId,
  localUserId,
  signal,
  peers,
  localStream,
  onRemoteStream,
  onConnectionStateChange
) {
  const { type, from, to, sdp, candidate } = signal;

  // Ignore signals not meant for us
  if (to && to !== localUserId) return;

  let pc = peers[from];

  // Create peer connection if it doesn't exist
  if (!pc && type !== 'ice') {
    pc = createPeerConnection(
      callId,
      localUserId,
      from,
      localStream,
      onRemoteStream,
      onConnectionStateChange
    );
    peers[from] = pc;
  }

  if (!pc) return;

  try {
    if (type === 'offer') {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await sendSignal(callId, {
        type: 'answer',
        from: localUserId,
        to: from,
        sdp: answer,
      });
    } else if (type === 'answer') {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } else if (type === 'ice' && candidate) {
      await pc.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (error) {
    console.error('Error handling signal:', error);
  }
}

export function closePeerConnections(peers) {
  Object.values(peers).forEach((pc) => {
    if (pc && pc.close) {
      pc.close();
    }
  });
}
