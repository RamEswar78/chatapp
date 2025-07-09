const nodemailer = require("nodemailer");

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAILUSERNAME,
    pass: process.env.MAILPASSWORD,
  },
});
