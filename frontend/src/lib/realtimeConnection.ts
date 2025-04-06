import { RefObject } from "react";

// Check if the current environment is secure (HTTPS or localhost)
const isSecureContext = (): boolean => {
  return window.isSecureContext || 
         window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
};

export async function createRealtimeConnection(
  ephemeralKey: string,
  audioElement: RefObject<HTMLAudioElement | null>
): Promise<{ pc: RTCPeerConnection; dc: RTCDataChannel }> {
  const pc = new RTCPeerConnection();

  pc.ontrack = (e) => {
    if (audioElement.current) {
      audioElement.current.srcObject = e.streams[0];
    }
  };

  // Request microphone access and add audio track to peer connection
  try {
    // Check if we're in a secure context (required for microphone access)
    if (!isSecureContext()) {
      throw new Error("Microphone access requires a secure context (HTTPS). The application will continue in text-only mode.");
    }

    if (navigator.mediaDevices) {
      // Check if permissions API is available to query microphone permission status
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          
          if (permissionStatus.state === 'denied') {
            throw new Error("Microphone permission has been denied. Please enable microphone access in your browser settings.");
          }
        } catch (permErr) {
          // Some browsers might not support querying microphone permission
          console.warn("Could not query microphone permission status:", permErr);
        }
      }

      // Request microphone access with explicit constraints
      const constraints = { 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      };
      
      const ms = await navigator.mediaDevices.getUserMedia(constraints);
      pc.addTrack(ms.getTracks()[0]);
      console.log("Microphone access granted successfully");
    } else {
      console.warn("MediaDevices API is not available - continuing without microphone access");
      // Create a silent audio track as a fallback
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const destination = ctx.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();
      const track = destination.stream.getAudioTracks()[0];
      pc.addTrack(track);
    }
  } catch (err) {
    console.warn("Could not access microphone - continuing without audio input:", err);
    // Create a silent audio track as a fallback to ensure the connection works
    try {
      const ctx = new AudioContext();
      const oscillator = ctx.createOscillator();
      const destination = ctx.createMediaStreamDestination();
      oscillator.connect(destination);
      oscillator.start();
      const track = destination.stream.getAudioTracks()[0];
      pc.addTrack(track);
    } catch (fallbackErr) {
      console.error("Failed to create fallback audio track:", fallbackErr);
      // Continue without adding an audio track
      // The connection will still work for receiving audio
    }
  }

  // Create data channel for events
  const dc = pc.createDataChannel("oai-events");

  // Create and set local description (offer)
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  // API endpoints
  const baseUrl = "https://api.openai.com/v1/realtime";
  const model = "gpt-4o-realtime-preview-2024-12-17";

  // Send SDP offer to OpenAI API
  const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
    method: "POST",
    body: offer.sdp,
    headers: {
      Authorization: `Bearer ${ephemeralKey}`,
      "Content-Type": "application/sdp",
    },
  });

  // Get SDP answer from API
  const answerSdp = await sdpResponse.text();
  const answer: RTCSessionDescriptionInit = {
    type: "answer",
    sdp: answerSdp,
  };

  // Set remote description with answer from API
  await pc.setRemoteDescription(answer);

  return { pc, dc };
}
