"use client";

import { getSocket } from "./socket";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];


export class LiveCallSession {
  private pc: RTCPeerConnection;
  private roomId: string;
  private closed = false;

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
      if (this.closed) return;
      await this.pc.setRemoteDescription(sdp);
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      socket.emit("webrtc:answer", { roomId, sdp: answer });
    });
    socket.on("webrtc:answer", async ({ sdp }) => {
      if (!this.closed) await this.pc.setRemoteDescription(sdp);
    });
    socket.on("webrtc:ice-candidate", async ({ candidate }) => {
      if (!this.closed) await this.pc.addIceCandidate(candidate);
    });
  }

  async startLocalMedia(): Promise<MediaStream | null> {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (this.closed) {
      // Cleanup already ran while the permission prompt was pending - release
      // the camera/mic immediately instead of attaching to a closed pc.
      stream.getTracks().forEach((track) => track.stop());
      return null;
    }
    stream.getTracks().forEach((track) => this.pc.addTrack(track, stream));
    return stream;
  }

  async callAsInitiator() {
    if (this.closed) return;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    getSocket().emit("webrtc:offer", { roomId: this.roomId, sdp: offer });
  }

  hangUp() {
    this.closed = true;
    this.pc.close();
  }
}