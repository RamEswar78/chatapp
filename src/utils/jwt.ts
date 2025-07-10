import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_EXPIRY = "7d";

export interface Jwtpayload {
  userName: string;
  email: string;
}

export function generateJwtToken(payload: Jwtpayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY, // 👈 this fixes TS error
  });
}

export function verifyToken(token: string): Jwtpayload {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (
    typeof decoded === "object" &&
    decoded !== null &&
    "userName" in decoded &&
    "email" in decoded
  ) {
    return decoded as Jwtpayload;
  }

  throw new Error("Invalid token payload");
}
