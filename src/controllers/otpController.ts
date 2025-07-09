import { transporter } from "../utils/nodemailer.config.js";
import fs from "fs";
import bcrypt from "bcrypt";

export async function sendOtpEmail(email: string, otp: number) {
  const htmlTemplate = fs
    .readFileSync("./src/templates/otpTemplate.html", "utf8")
    .replace("{{OTP}}", otp.toString())
    .replace("{{Year}}", new Date().getFullYear().toString());

  const mailOptions = {
    from: process.env.MAILUSERNAME,
    to: email,
    subject: "Your OTP Code",
    html: htmlTemplate,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("OTP sent successfully");
  } catch (error) {
    console.error("Error sending OTP:", error);
    throw error;
  }
}

export async function verifyOtp(
  inputOtp: string,
  actualOtp: string
): Promise<boolean> {
  // Here you can implement your OTP verification logic
  // For simplicity, we are just comparing the inputOtp with actualOtp
  return bcrypt.compare(inputOtp, actualOtp);
}
