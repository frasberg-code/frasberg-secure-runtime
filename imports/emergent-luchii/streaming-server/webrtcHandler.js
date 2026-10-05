import { RTCPeerConnection, RTCSessionDescription, nonstandard } from "wrtc";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

const { RTCVideoSource, RTCAudioSource } = nonstandard;

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },
];

export async function createPeerConnection(sessionId, displayId = 99) {
  const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

  // ─── Video Track via FFmpeg Screen Capture ─────────────
  const videoSource = new RTCVideoSource();
  const videoTrack = videoSource.createTrack();
  pc.addTrack(videoTrack);

  // ─── Audio Track ────────────────────────────────────────
  const audioSource = new RTCAudioSource();
  const audioTrack = audioSource.createTrack();
  pc.addTrack(audioTrack);

  // ─── Start FFmpeg capture from virtual display ──────────
  const videoStream = new PassThrough();

  const captureProcess = ffmpeg()
    .input(`:${displayId}`)
    .inputFormat("x11grab")
    .inputOptions(["-framerate 30", "-video_size 1280x720"])
    .input("pulse")
    .inputFormat("pulse")
    .videoCodec("rawvideo")
    .outputFormat("rawvideo")
    .outputOptions(["-pix_fmt yuv420p"])
    .pipe(videoStream, { end: false });

  // Feed raw frames to WebRTC video source
  const width = 1280;
  const height = 720;
  const frameSize = width * height * 1.5; // YUV420p

  let buffer = Buffer.alloc(0);

  videoStream.on("data", (chunk) => {
    buffer = Buffer.concat([buffer, chunk]);
    while (buffer.length >= frameSize) {
      const frame = buffer.slice(0, frameSize);
      buffer = buffer.slice(frameSize);
      videoSource.onFrame({
        width,
        height,
        data: new Uint8ClampedArray(frame),
      });
    }
  });

  pc.on("icecandidate", (e) => {
    if (e.candidate) {
      console.log(`🔗 ICE candidate for session ${sessionId}`);
    }
  });

  pc.on("connectionstatechange", () => {
    console.log(`📡 [${sessionId}] Connection state: ${pc.connectionState}`);
  });

  return { pc, captureProcess };
}

export async function handleOffer(pc, offerSdp) {
  await pc.setRemoteDescription(new RTCSessionDescription({
    type: "offer",
    sdp: offerSdp,
  }));
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  return answer.sdp;
}

export async function addIceCandidate(pc, candidate) {
  await pc.addIceCandidate(candidate);
}
