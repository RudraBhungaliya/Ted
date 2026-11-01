import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
export function generateAccessToken(payload) {
    return jwt.sign(payload, env.JWT_SECRET, {
        expiresIn: "7d",
    });
}
export function generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
}
export function verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
export function verifyToken(token) {
    return jwt.verify(token, env.JWT_SECRET);
}
