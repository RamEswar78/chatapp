import crypto from 'crypto';

export function generateOtp():number {
  return crypto.randomInt(100000, 999999);
}