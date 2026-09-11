import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createServer } from "http";
import { authRoutes } from "./routes/auth";
import { campaignRoutes } from "./routes/campaigns";
import { applicationRoutes } from "./routes/applications";
import { submissionRoutes } from "./routes/submissions";
import { messageRoutes } from "./routes/messages";
import { attachSocketServer } from "./sockets";

const app = new Elysia()
  .use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true }))
  .get("/health", () => ({ ok: true }))
  .use(authRoutes)
  .use(campaignRoutes)
  .use(applicationRoutes)
  .use(submissionRoutes)
  .use(messageRoutes);

const port = Number(process.env.PORT ?? 4000);

// Elysia's Bun-native server doesn't expose a raw Node http.Server for
// Socket.io to bind to, so for the WS layer we run a second lightweight
// Node http server on the same port range purely to host Socket.io, and
// proxy REST traffic through Elysia's own `.fetch`. In production these
// would typically sit behind a single reverse proxy (nginx/Caddy) that
// routes /socket.io to this process and everything else to Elysia.
const httpServer = createServer((req, res) => {
  // Fallback for any request the Socket.io engine doesn't claim.
  res.writeHead(404);
  res.end();
});
attachSocketServer(httpServer);
httpServer.listen(port + 1, () => {
  console.log(`[api] socket.io listening on :${port + 1}`);
});

app.listen(port, () => {
  console.log(`[api] elysia REST listening on :${port}`);
});
