const otpRouter = require("express").Router();
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateOtp } from "../utils/generateOtp";
import { sendOtpEmail } from "../controllers/otpController";
import { generateJwtToken } from "../utils/jwt";
import { createUser } from "../models/connectDb";

const otps = new Map<string, string>(); // Email -> hashedOtp

// ✅ Send OTP
otpRouter.post("/sendOtp", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });
  console.log(email);

  try {
    const otp = generateOtp(); // e.g. 6-digit
    console.log("inside otpAuth.ts");
    const hashedOtp = await bcrypt.hash(otp.toString(), 10);

    await sendOtpEmail(email, otp); // Send OTP email
    otps.set(email, hashedOtp);

    setTimeout(() => otps.delete(email), 5 * 60 * 1000); // Expire after 5 min

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// ✅ Verify OTP
otpRouter.post("/verifyOtp", async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp)
    return res.status(400).json({ error: "Email and OTP are required" });

  try {
    const storedOtp = otps.get(email);
    if (!storedOtp)
      return res.status(400).json({ error: "OTP not found or expired" });

    const isValid = await bcrypt.compare(otp.toString(), storedOtp);
    if (!isValid) return res.status(400).json({ error: "Invalid OTP" });

    otps.delete(email); // Remove OTP after success

    const user = await createUser(email); // Create user in DB
    const token = generateJwtToken({
      userId: user.id.toString(),
      email,
      username: user.username || undefined,
    });

    res.status(200).json({
      message: "OTP verified successfully",
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "Failed to verify OTP" });
  }
});

export default otpRouter;
