import { getMessaging } from "firebase-admin/messaging";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { readFileSync } from "fs";
import { db } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { NotificationJobPayload } from "@collabify/shared";

function getMessagingOrNull() {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!path) return null;
  if (!getApps().length) {
    initializeApp({ credential: cert(JSON.parse(readFileSync(path, "utf-8"))) });
  }
  return getMessaging();
}

// Processes the "notifications" BullMQ queue: looks up the user's stored FCM
// token and sends a push via Firebase Cloud Messaging. Kept separate from the
// video queue so a burst of notifications never blocks video transcoding.
export async function sendNotification({ userId, title, body, data }: NotificationJobPayload) {
  const messaging = getMessagingOrNull();
  if (!messaging) {
    console.warn("[notifications] Firebase not configured, skipping push:", title);
    return;
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user?.fcmToken) return;

  await messaging.send({ token: user.fcmToken, notification: { title, body }, data });
}
