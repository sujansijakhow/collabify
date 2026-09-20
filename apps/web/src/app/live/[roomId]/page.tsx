"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSelector } from "react-redux";
import { RequireAuth } from "@/components/RequireAuth";
import { Button } from "@/components/ui/Button";
import { getSocket } from "@/lib/socket";
import { LiveCallSession } from "@/lib/webrtc";
import type { RootState } from "@/store/store";

function clearVideoElement(video: HTMLVideoElement | null) {
  if (!video) return;
  video.pause();
  video.srcObject = null;
  video.removeAttribute("src");
  video.load();
}

function LiveRoomContent() {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useSelector((s: RootState) => s.auth);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ roomId: string; from: string } | null>(null);
  const [error, setError] = useState("");
  const sessionRef = useRef<LiveCallSession | null>(null);
  const ringtoneRef = useRef<HTMLAudioElement | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!roomId || !user) return;

    const socket = getSocket(user.id);

    socket.on("call:incoming", ({ roomId: incomingRoomId, from }) => {
      if (incomingRoomId !== roomId) return;
      setIncomingCall({ roomId: incomingRoomId, from });
      if (!ringtoneRef.current) {
        ringtoneRef.current = new Audio("data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQAAAAA=");
      }
      ringtoneRef.current.loop = true;
      ringtoneRef.current.play().catch(() => {});
    });

    const session = new LiveCallSession(roomId, user.id, (stream) => setRemoteStream(stream));
    sessionRef.current = session;

    return () => {
      socket.off("call:incoming");
      session.hangUp();
      clearVideoElement(localVideoRef.current);
      clearVideoElement(remoteVideoRef.current);
      sessionRef.current = null;
    };
  }, [roomId, user?.id]);

  useEffect(() => {
    if (localVideoRef.current) {
      if (localStream) {
        localVideoRef.current.srcObject = localStream;
      } else {
        clearVideoElement(localVideoRef.current);
      }
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current) {
      if (remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      } else {
        clearVideoElement(remoteVideoRef.current);
      }
    }
  }, [remoteStream]);

  async function startCall() {
    if (!roomId || !user) return;

    try {
      setError("");
      setIsConnecting(true);

      const session = sessionRef.current ?? new LiveCallSession(roomId, user.id, (stream) => setRemoteStream(stream));
      sessionRef.current = session;
      const socket = getSocket(user.id);

      const handleAccepted = async ({ roomId: acceptedRoomId }: { roomId: string }) => {
        if (acceptedRoomId !== roomId) return;
        socket.off("call:declined", handleDeclined);

        try {
          await session.waitForJoin();
          const stream = await session.startLocalMedia();
          setLocalStream(stream);
          setIsMuted(false);
          setIsCameraOff(false);
          await session.callAsInitiator();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Unable to start the call.");
          setIsConnecting(false);
        }
      };

      const handleDeclined = ({ roomId: declinedRoomId }: { roomId: string }) => {
        if (declinedRoomId !== roomId) return;
        socket.off("call:accepted", handleAccepted);
        session.hangUp();
        sessionRef.current = null;
        setError("The other participant declined the call.");
        setIsConnecting(false);
      };

      socket.once("call:accepted", handleAccepted);
      socket.once("call:declined", handleDeclined);
      await session.waitForJoin();
      socket.emit("call:request", { roomId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to start the call.");
      setIsConnecting(false);
    }
  }

  function toggleMute() {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sessionRef.current?.toggleMute(nextMuted);
  }

  function toggleCamera() {
    const nextCameraOff = !isCameraOff;
    setIsCameraOff(nextCameraOff);
    sessionRef.current?.toggleCamera(nextCameraOff);
  }

  function endCall() {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    sessionRef.current?.hangUp();
    clearVideoElement(localVideoRef.current);
    clearVideoElement(remoteVideoRef.current);
    sessionRef.current = null;
    setIncomingCall(null);
    setLocalStream(null);
    setRemoteStream(null);
    setIsMuted(false);
    setIsCameraOff(false);
  }

  async function acceptIncomingCall() {
    if (!roomId || !user || !incomingCall) return;

    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }

    setIncomingCall(null);
    setError("");
    setIsConnecting(true);

    try {
      const session = sessionRef.current ?? new LiveCallSession(roomId, user.id, (stream) => setRemoteStream(stream));
      sessionRef.current = session;
      const stream = await session.startLocalMedia();
      setLocalStream(stream);
      setIsMuted(false);
      setIsCameraOff(false);
      getSocket(user.id).emit("call:accept", { roomId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to answer the call.");
    } finally {
      setIsConnecting(false);
    }
  }

  function declineIncomingCall() {
    if (roomId && user) {
      getSocket(user.id).emit("call:decline", { roomId });
    }
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    setIncomingCall(null);
  }

  if (!user) return null;

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate">Live room</p>
          <h1 className="mt-2 font-display text-3xl">{roomId}</h1>
        </div>

        {incomingCall && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-signal/40 bg-signal-light px-3 py-2">
            <span className="text-sm font-medium text-signal-dark">Incoming call from {incomingCall.from}</span>
            <Button onClick={acceptIncomingCall}>Accept</Button>
            <Button variant="ghost" onClick={declineIncomingCall}>
              Decline
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button onClick={startCall} disabled={isConnecting || !!localStream}>
            {isConnecting ? "Connecting…" : localStream ? "Connected" : "Start live call"}
          </Button>
          {localStream && (
            <>
              <Button variant="ghost" onClick={toggleMute}>
                {isMuted ? "Unmute" : "Mute"}
              </Button>
              <Button variant="ghost" onClick={toggleCamera}>
                {isCameraOff ? "Turn on video" : "Turn off video"}
              </Button>
              <Button variant="danger" onClick={endCall}>
                End call
              </Button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md border border-clay/40 bg-clay-light px-4 py-3 text-sm text-clay">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm text-slate">
            <span>You</span>
            <span>{user.role}</span>
          </div>
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="h-[280px] w-full rounded-lg bg-slate-900 object-cover"
          />
        </div>

        <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-sm text-slate">
            <span>Remote</span>
            <span>{remoteStream ? "Connected" : "Waiting"}</span>
          </div>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="h-[280px] w-full rounded-lg bg-slate-900 object-cover"
          />
        </div>
      </div>

      <p className="mt-4 text-sm text-slate">
        Open this same room from another authenticated account to test a creator↔brand call.
      </p>
    </main>
  );
}

export default function LiveRoomPage() {
  return (
    <RequireAuth>
      <LiveRoomContent />
    </RequireAuth>
  );
}
