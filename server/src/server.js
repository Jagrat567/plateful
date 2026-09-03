import { createServer } from "node:http";
import { app } from "./app.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { env } from "./config/env.js";
import { createSocketServer } from "./socket.js";
import { startOrderSimulation, stopOrderSimulation } from "./modules/orders/orderSimulation.js";
import dns from "node:dns";

const httpServer = createServer(app);
createSocketServer(httpServer);

dns.setServers(["1.1.1.1", "8.8.8.8"]);

async function start() {
  await connectDatabase();
  startOrderSimulation();
  httpServer.listen(env.PORT, () => console.log(`API listening on port ${env.PORT}`));
}

async function shutdown(signal) {
  console.log(`${signal} received; shutting down`);
  stopOrderSimulation();
  httpServer.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
start().catch((error) => {
  console.error("Server failed to start", error);
  process.exit(1);
});
