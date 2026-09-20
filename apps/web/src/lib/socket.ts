"use client";

import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@collabify/shared";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
const getSocketUrl = () => process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4001";

// Single shared connection for the whole app - chat and WebRTC signaling
// multiplex over the same socket rather than opening a new one per feature.
export function getSocket(userId?: string) {
  if (!socket) {
    socket = io(getSocketUrl(), {
      auth: { userId },
      withCredentials: true,
    });
    return socket;
  }

  const existingUserId = (socket.auth as { userId?: string } | undefined)?.userId;
  if (userId && existingUserId !== userId) {
    socket.disconnect();
    socket = io(getSocketUrl(), {
      auth: { userId },
      withCredentials: true,
    });
  }

  return socket;
}
