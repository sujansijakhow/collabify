import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "http";
import type { ClientToServerEvents, ServerToClientEvents } from "@collabify/shared";
import { eq, and } from "drizzle-orm";
import { redisPub, redisSub } from "../lib/redis";
import { db } from "../db/client";
import { applications, campaigns, messages } from "../db/schema";

async function canUserJoinLiveRoom(userId: string | undefined, roomId: string) {
  if (!userId) return false;

  const [campaign] = await db.select().from(campaigns).where(eq(campaigns.id, roomId)).limit(1);
  if (!campaign) return false;

  if (campaign.brandId === userId) return true;

  const [application] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.campaignId, roomId), eq(applications.creatorId, userId), eq(applications.status, "accepted")))
    .limit(1);

  return Boolean(application);
}

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

    socket.on("call:request", async ({ roomId }) => {
      if (!(await canUserJoinLiveRoom(userId, roomId))) return;
      socket.to(`webrtc:${roomId}`).emit("call:incoming", { roomId, from: userId ?? socket.id });
    });

    socket.on("call:accept", async ({ roomId }) => {
      if (!(await canUserJoinLiveRoom(userId, roomId))) return;
      socket.to(`webrtc:${roomId}`).emit("call:accepted", { roomId });
    });

    socket.on("call:decline", async ({ roomId }) => {
      if (!(await canUserJoinLiveRoom(userId, roomId))) return;
      socket.to(`webrtc:${roomId}`).emit("call:declined", { roomId });
    });

    socket.on("webrtc:join", async (roomId, callback) => {
      if (!(await canUserJoinLiveRoom(userId, roomId))) return;
      socket.join(`webrtc:${roomId}`);
      callback?.();
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
