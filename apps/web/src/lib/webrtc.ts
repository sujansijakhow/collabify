"use client";

import { getSocket } from "./socket";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export class LiveCallSession {
  private pc: RTCPeerConnection;
  private roomId: string;
  private userId: string;
  private socket: ReturnType<typeof getSocket>;
  private closed = false;
  private localStream: MediaStream | null = null;
  private onRemoteStream: (stream: MediaStream | null) => void;
  private isMuted = false;
  private isCameraOff = false;
  private pendingIceCandidates: RTCIceCandidateInit[] = [];
  private joinReady: Promise<void>;

  constructor(roomId: string, userId: string, onRemoteStream: (stream: MediaStream | null) => void) {
    this.roomId = roomId;
    this.userId = userId;
    this.onRemoteStream = onRemoteStream;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.socket = getSocket(userId);

    this.pc.ontrack = (event) => {
      if (event.streams[0]) {
        this.onRemoteStream(event.streams[0]);
      }
    };

    this.pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(this.pc.connectionState)) {
        this.onRemoteStream(null);
      }
    };

    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.socket.emit("webrtc:ice-candidate", {
          roomId,
          candidate: event.candidate.toJSON(),
        });
      }
    };

    this.joinReady = new Promise((resolve) => {
      this.socket.emit("webrtc:join", roomId, resolve);
    });
    this.socket.on("webrtc:offer", this.handleOffer);
    this.socket.on("webrtc:answer", this.handleAnswer);
    this.socket.on("webrtc:ice-candidate", this.handleIceCandidate);
  }

  private handleOffer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
    if (this.closed) return;
    try {
      await this.pc.setRemoteDescription(sdp);
      await this.flushPendingIceCandidates();
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      this.socket.emit("webrtc:answer", { roomId: this.roomId, sdp: answer });
    } catch (error) {
      console.error("Unable to handle WebRTC offer", error);
    }
  };

  private handleAnswer = async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
    if (this.closed) return;
    try {
      await this.pc.setRemoteDescription(sdp);
      await this.flushPendingIceCandidates();
    } catch (error) {
      console.error("Unable to handle WebRTC answer", error);
    }
  };

  private handleIceCandidate = async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
    if (this.closed) return;
    if (!this.pc.remoteDescription) {
      this.pendingIceCandidates.push(candidate);
      return;
    }

    try {
      await this.pc.addIceCandidate(candidate);
    } catch (error) {
      console.error("Unable to add WebRTC ICE candidate", error);
    }
  };

  private async flushPendingIceCandidates() {
    const candidates = this.pendingIceCandidates.splice(0);
    for (const candidate of candidates) {
      await this.pc.addIceCandidate(candidate);
    }
  };

  async startLocalMedia(): Promise<MediaStream | null> {
    if (this.localStream) return this.localStream;

    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (this.closed) {
      stream.getTracks().forEach((track) => track.stop());
      return null;
    }

    this.localStream = stream;
    stream.getTracks().forEach((track) => this.pc.addTrack(track, stream));
    return stream;
  }

  async waitForJoin() {
    await this.joinReady;
  }

  async callAsInitiator() {
    if (this.closed) return;

    await this.joinReady;
    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.socket.emit("webrtc:offer", { roomId: this.roomId, sdp: offer });
  }

  toggleMute(nextMuted: boolean) {
    this.isMuted = nextMuted;
    this.localStream?.getAudioTracks().forEach((track) => {
      track.enabled = !nextMuted;
    });
  }

  toggleCamera(nextCameraOff: boolean) {
    this.isCameraOff = nextCameraOff;
    this.localStream?.getVideoTracks().forEach((track) => {
      track.enabled = !nextCameraOff;
    });
  }

  hangUp() {
    this.closed = true;
    this.pendingIceCandidates = [];
    this.socket.off("webrtc:offer", this.handleOffer);
    this.socket.off("webrtc:answer", this.handleAnswer);
    this.socket.off("webrtc:ice-candidate", this.handleIceCandidate);
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.pc.close();
  }
}