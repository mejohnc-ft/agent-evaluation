import { initBotId } from "botid/client/core";

// Vercel BotID: attaches an invisible challenge token to chat requests (checked in /api/chat).
initBotId({ protect: [{ path: "/api/chat", method: "POST" }] });
