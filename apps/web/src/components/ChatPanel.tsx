"use client";

import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/store/store";
import { getSocket } from "@/lib/socket";
import { hydrateMessages, messageReceived } from "@/store/features/chatSlice";

/**
 * Campaign chat panel. History loads once over REST; every message after
 * that (from either side) arrives via the "chat:message" socket event and is
 * pushed into Redux, so the UI stays live without polling.
 */
export function ChatPanel({ campaignId, userId }: { campaignId: string; userId: string }) {
  const dispatch = useDispatch();
  const messages = useSelector((s: RootState) => s.chat.messagesByCampaign[campaignId] ?? []);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const socket = getSocket(userId);
    socket.emit("chat:join", campaignId);
    socket.on("chat:message", (msg) => dispatch(messageReceived(msg)));

    fetch(`/api/messages/campaign/${campaignId}`)
      .then((r) => r.json())
      .then((history) => dispatch(hydrateMessages({ campaignId, messages: history })));

    return () => {
      socket.off("chat:message");
    };
  }, [campaignId, userId, dispatch]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function send() {
    if (!draft.trim()) return;
    getSocket(userId).emit("chat:message", { campaignId, content: draft.trim() });
    setDraft("");
  }

  return (
    <div className="flex h-full flex-col rounded-lg border border-border bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.map((m) => (
          <div key={m.id} className={m.senderId === userId ? "text-right" : "text-left"}>
            <span
              className={
                "inline-block max-w-[80%] rounded-lg px-3 py-2 text-sm " +
                (m.senderId === userId ? "bg-signal text-white" : "bg-paper text-ink")
              }
            >
              {m.content}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Write a message"
          className="flex-1 rounded-md border border-border px-3 py-2 text-sm outline-none focus-visible:border-signal"
        />
        <button onClick={send} className="rounded-md bg-signal px-4 py-2 text-sm font-medium text-white">
          Send
        </button>
      </div>
    </div>
  );
}
