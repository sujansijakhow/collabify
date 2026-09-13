import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { createServer } from "http";
import { authRoutes } from "./routes/auth";
import { campaignRoutes } from "./routes/campaigns";
import { applicationRoutes } from "./routes/applications";
import { submissionRoutes } from "./routes/submissions";
import { messageRoutes } from "./routes/messages";
import { mediaRoutes } from "./routes/media";
import { attachSocketServer } from "./sockets";

const app = new Elysia()
  .use(cors({ origin: process.env.WEB_ORIGIN ?? "http://localhost:3000", credentials: true }))
  .get("/health", () => ({ ok: true }))
  .use(authRoutes)
  .use(campaignRoutes)
  .use(applicationRoutes)
  .use(submissionRoutes)
  .use(messageRoutes)
  .use(mediaRoutes);

const port = Number(process.env.PORT ?? 4000);

const httpServer = createServer((req, res) => {
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