const otpRouter = require("express").Router();
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { generateOtp } from "../utils/generateOtp";
import { sendOtpEmail, verifyOtp } from "../controllers/otpController";
import { generateJwtToken } from "../utils/jwt";
const otps = new Map(); // Store OTPs in memory for simplicity, consider using a database for production`
import { createUser } from "../models/connectDb"; // Import createUser function to create user in the database
// Create a transporter object using SMTP transport

otpRouter.post("/sendOtp", async (req: Request, res: Response) => {
  console.log("Received request to send OTP");
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  try {
    const otp = generateOtp(); // Generate a random OTP
    const hashedOtp = await bcrypt.hash(otp.toString(), 10); // Hash the OTP for security
    await sendOtpEmail(email, otp); // Send OTP via email
    otps.set(email, hashedOtp); // Store OTP in memory with email as key
    setTimeout(() => {
      otps.delete(email); // Remove OTP after 5 minutes
    }, 5 * 60 * 1000);
    res.status(200).json({ message: "OTP sent successfully", otp }); // Respond with success message
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

// Endpoint to verify OTP
otpRouter.post("/verifyOtp", async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }
  const actualOtp = otps.get(email); // Retrieve OTP from memory
  if (!actualOtp) {
    return res.status(400).json({ error: "OTP not found or expired" });
  }
  verifyOtp(otp.toString(), actualOtp)
    .then((isValid) => {
      if (isValid) {
        otps.delete(email); // Remove OTP after successful verification
        createUser(email) // Create user in the database
          .then((user) => {
            const token = generateJwtToken({
              userName: user.username as string,
              email: email,
            });
            res
              .status(200)
              .json({ message: "OTP verified successfully", token: token }); // Respond with success message
          });
      } else {
        res.status(400).json({ error: "Invalid OTP" }); // Respond with error
      }
    })
    .catch((error) => {
      console.error("Error verifying OTP:", error);
      res.status(500).json({ error: "Failed to verify OTP" }); // Respond with error
    });
});

export default otpRouter;
