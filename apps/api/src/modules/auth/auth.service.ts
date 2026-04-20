import jwt from "jsonwebtoken";
import { ENV } from "../config/environment";

export function signAccessToken(userId: string) {
  return jwt.sign({ userId }, ENV.JWT_SECRET, {
    expiresIn: "15m",
  });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, ENV.JWT_SECRET, {
    expiresIn: "7d",
  });
}

export function verifyAccessToken(token: string) {
  try {
    return jwt.verify(token, ENV.JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token: string) {
  try {
    return jwt.verify(token, ENV.JWT_SECRET);
  } catch (err) {
    return null;
  }
}
