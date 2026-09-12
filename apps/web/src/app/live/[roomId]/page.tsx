"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { LiveCallSession } from "@/lib/webrtc";
import { Button } from "@/components/ui/Button";

export default function LiveCallPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const localRef = useRef<HTMLVideoElement>(null);
  const remoteRef = useRef<HTMLVideoElement>(null);
  const sessionRef = useRef<LiveCallSession | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const session = new LiveCallSession(roomId, (stream) => {
      if (remoteRef.current) remoteRef.current.srcObject = stream;
      setConnected(true);
    });
    sessionRef.current = session;

    session.startLocalMedia().then((stream) => {
      if (localRef.current) localRef.current.srcObject = stream;
    });

    return () => session.hangUp();
  }, [roomId]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-2xl">Live pitch call</h1>
      <p className="mt-1 text-sm text-slate">
        Room <span className="font-mono">{roomId}</span> - {connected ? "connected" : "waiting for the other side…"}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <video ref={localRef} autoPlay muted playsInline className="aspect-video w-full rounded-lg bg-ink" />
        <video ref={remoteRef} autoPlay playsInline className="aspect-video w-full rounded-lg bg-ink" />
      </div>

      <Button onClick={() => sessionRef.current?.callAsInitiator()} className="mt-6">
        Call
      </Button>
    </main>
  );
}
