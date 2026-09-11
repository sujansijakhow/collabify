"use client";

import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Requests notification permission, registers for a push token, and returns
// it so the app can PATCH it onto the logged-in user's row (consumed by the
// worker's notificationProcessor when sending pushes).
export async function requestPushToken(): Promise<string | null> {
  if (!(await isSupported())) return null;
  if (!getApps().length) initializeApp(firebaseConfig);

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const messaging = getMessaging();
  return getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY });
}

export async function onForegroundMessage(handler: (title: string, body: string) => void) {
  if (!(await isSupported())) return;
  const messaging = getMessaging();
  onMessage(messaging, (payload) => {
    handler(payload.notification?.title ?? "", payload.notification?.body ?? "");
  });
}
