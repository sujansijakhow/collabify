import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "http";
import type { ClientToServerEvents, ServerToClientEvents } from "@collabify/shared";
import { redisPub, redisSub } from "../lib/redis";
import { db } from "../db/client";
import { messages } from "../db/schema";

/**
 * Wires up Socket.io on top of the Bun HTTP server. Two responsibilities:
 *  1. Campaign chat rooms (persisted to Postgres, broadcast live).
 *  2. WebRTC signaling relay for brand<->creator live pitch calls — we never
 *     touch media here, just forward SDP offers/answers/ICE candidates.
 *
 * The Redis adapter means this scales horizontally: a message emitted from
 * one API instance reaches sockets connected to any other instance.
 */
export function attachSocketServer(httpServer: HttpServer) {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true },
    adapter: createAdapter(redisPub, redisSub),
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId as string | undefined;
    if (userId) io.emit("presence:update", { userId, online: true });

    socket.on("chat:join", (campaignId) => {
      socket.join(`campaign:${campaignId}`);
    });

    socket.on("chat:message", async ({ campaignId, content }) => {
      if (!userId) return;
      const [saved] = await db
        .insert(messages)
        .values({ campaignId, senderId: userId, content })
        .returning();
      io.to(`campaign:${campaignId}`).emit("chat:message", {
        id: saved.id,
        campaignId: saved.campaignId,
        senderId: saved.senderId,
        content: saved.content,
        createdAt: saved.createdAt.toISOString(),
      });
    });

    // --- WebRTC signaling (mesh, 1:1 room) ---
    socket.on("webrtc:join", (roomId) => socket.join(`webrtc:${roomId}`));

    socket.on("webrtc:offer", ({ roomId, sdp }) => {
      socket.to(`webrtc:${roomId}`).emit("webrtc:offer", { from: socket.id, sdp });
    });

    socket.on("webrtc:answer", ({ roomId, sdp }) => {
      socket.to(`webrtc:${roomId}`).emit("webrtc:answer", { from: socket.id, sdp });
    });

    socket.on("webrtc:ice-candidate", ({ roomId, candidate }) => {
      socket.to(`webrtc:${roomId}`).emit("webrtc:ice-candidate", { from: socket.id, candidate });
    });

    socket.on("disconnect", () => {
      if (userId) io.emit("presence:update", { userId, online: false });
    });
  });

  return io;
}
