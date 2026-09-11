import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { readFileSync } from "fs";

// Lazily initialise so local dev without a service account file doesn't crash
// on import; push notifications simply no-op until configured.
let messagingApp: ReturnType<typeof getMessaging> | null = null;

export function getFirebaseMessaging() {
  if (messagingApp) return messagingApp;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!path) {
    console.warn("[firebase] FIREBASE_SERVICE_ACCOUNT_JSON not set — push notifications disabled");
    return null;
  }
  if (!getApps().length) {
    const serviceAccount = JSON.parse(readFileSync(path, "utf-8"));
    initializeApp({ credential: cert(serviceAccount) });
  }
  messagingApp = getMessaging();
  return messagingApp;
}
