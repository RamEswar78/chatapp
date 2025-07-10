require("dotenv").config();
import express, { Request, Response } from "express";
import { createServer } from "http";
import cors from "cors";

import OtpAuth from "./routes/otpAuth";
import { connectDb } from "./models/connectDb";
import { createWebSocketServer } from "./websockets/Websocket.config";

const app = express();
const PORT: number = parseInt(process.env.PORT || "3000", 10);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/otpAuth", OtpAuth);
app.get("/", (_req: Request, res: Response) => {
  res.send("Hello World!");
});

// DB Connection
connectDb();

// Create HTTP Server & Attach WebSocket Server
const httpServer = createServer(app);

//create Websockket server
createWebSocketServer(httpServer);


// Start Server
httpServer.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

export default app;
export { PORT };
