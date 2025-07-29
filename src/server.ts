require("dotenv").config();
import express, { Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";

import OtpAuth from "./routes/otpAuth";
import chatRoutes from "./routes/chatRoutes";
import userRoutes from "./routes/userRoutes";
import preferencesRoutes from "./routes/preferencesRoutes";
import { connectDb } from "./models/connectDb";
import { createWebSocketServer } from "./websockets/Websocket.config";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", OtpAuth);
app.use("/chats", chatRoutes);
app.use("/users", userRoutes);
app.use("/preferences", preferencesRoutes);

app.get("/", (_req: Request, res: Response) => {
  res.send("Chat Application API - Ready for Production!");
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    message: "Enhanced Chat API is running",
    timestamp: new Date().toISOString(),
    version: "2.0.0",
  });
});

// DB Connection
connectDb();

// Create HTTP Server & Attach WebSocket Server
const httpServer = createServer(app);
createWebSocketServer(httpServer);

// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;
export { PORT };
