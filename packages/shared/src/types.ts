// Shared types used by web, api, and worker so all three stay in sync.

export type UserRole = "creator" | "brand" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string | null;
  createdAt: string;
}

export type CampaignStatus = "draft" | "open" | "closed";

export interface Campaign {
  id: string;
  brandId: string;
  title: string;
  description: string;
  budgetCents: number;
  status: CampaignStatus;
  createdAt: string;
}

export type ApplicationStatus = "pending" | "accepted" | "rejected";

export interface Application {
  id: string;
  campaignId: string;
  creatorId: string;
  pitch: string;
  status: ApplicationStatus;
  createdAt: string;
}

export type SubmissionStatus = "uploaded" | "processing" | "ready" | "failed";

export interface Submission {
  id: string;
  applicationId: string;
  sourceUrl: string;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  status: SubmissionStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  campaignId: string;
  senderId: string;
  content: string;
  createdAt: string;
}

// ---- Socket.io event contracts (shared between web client and api server) ----

export interface ServerToClientEvents {
  "chat:message": (msg: ChatMessage) => void;
  "presence:update": (payload: { userId: string; online: boolean }) => void;
  "submission:status": (payload: { submissionId: string; status: SubmissionStatus }) => void;
  "webrtc:offer": (payload: { from: string; sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:answer": (payload: { from: string; sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:ice-candidate": (payload: { from: string; candidate: RTCIceCandidateInit }) => void;
}

export interface ClientToServerEvents {
  "chat:join": (campaignId: string) => void;
  "chat:message": (payload: { campaignId: string; content: string }) => void;
  "webrtc:join": (roomId: string) => void;
  "webrtc:offer": (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:answer": (payload: { roomId: string; sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:ice-candidate": (payload: { roomId: string; candidate: RTCIceCandidateInit }) => void;
}

// ---- Kafka event contracts (analytics event stream) ----

export type AnalyticsEventType =
  | "campaign.viewed"
  | "submission.viewed"
  | "application.submitted";

export interface AnalyticsEvent {
  type: AnalyticsEventType;
  entityId: string;
  userId?: string;
  ts: string;
}

// ---- BullMQ job payloads ----

export interface VideoJobPayload {
  submissionId: string;
  sourcePath: string;
}

export interface NotificationJobPayload {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}
