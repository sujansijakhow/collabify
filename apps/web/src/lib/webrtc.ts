"use client";

import { getSocket } from "./socket";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

/**
 * Minimal 1:1 WebRTC session for a live brand<->creator pitch call.
 * Signaling (offer/answer/ICE) rides over the existing Socket.io connection;
 * this class only owns the RTCPeerConnection and local/remote media streams.
 */
export class LiveCallSession {
  private pc: RTCPeerConnection;
  private roomId: string;

  constructor(roomId: string, onRemoteStream: (stream: MediaStream) => void) {
    this.roomId = roomId;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const socket = getSocket();

    this.pc.ontrack = (event) => onRemoteStream(event.streams[0]);
    this.pc.onicecandidate = (event) => {
      if (event.candidate) socket.emit("webrtc:ice-candidate", { roomId, candidate: event.candidate.toJSON() });
    };

    socket.emit("webrtc:join", roomId);
    socket.on("webrtc:offer", async ({ sdp }) => {
      await this.pc.setRemoteDescription(sdp);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", { roomId, sdp: answer });
    });
    socket.on("webrtc:answer", async ({ sdp }) => this.pc.setRemoteDescription(sdp));
    socket.on("webrtc:ice-candidate", async ({ candidate }) => this.pc.addIceCandidate(candidate));
  }

  async startLocalMedia(): Promise<MediaStream> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    stream.getTracks().forEach((track) => this.pc.addTrack(track, stream));
    return stream;
  }

  async callAsInitiator() {
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    getSocket().emit("webrtc:offer", { roomId: this.roomId, sdp: offer });
  }

  hangUp() {
    this.pc.close();
  }
}
