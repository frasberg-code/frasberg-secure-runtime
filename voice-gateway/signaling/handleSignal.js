// signaling/handleSignal.js
import wrtc from "wrtc";

export async function handleSignal(data) {
  const { type, sdp, candidate } = data || {};

  if (type === "offer") {
    const peer = new wrtc.RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    await peer.setRemoteDescription({ type: "offer", sdp });
    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    return { type: "answer", sdp: answer.sdp };
  }

  if (type === "ice-candidate") {
    // Forward ICE candidate back to browser (echo for now)
    return { type: "ice-candidate", candidate };
  }

  return { ok: true, received: data };
}
