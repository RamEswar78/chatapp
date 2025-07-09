require("dotenv").config();
const express = require("express");
const cors = require("cors");
import OtpAuth from "./routes/otpAuth"; // Adjust the import path as necessary
import { connectDb } from "./models/connectDb";

const app = express();
const PORT = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
connectDb()
app.use("/otpAuth", OtpAuth);
app.get("/", (req: any, res: any) => {
  res.send("Hello World!");
});
console.log("app is running");
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
