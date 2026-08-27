// auth.js
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

export function generateToken(payload, expiresIn = "10h") {
   if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set");

   return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn,
   });
}

export function verifyToken(token) {
   if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET not set");

   return jwt.verify(token, process.env.JWT_SECRET);
}

export function hashString(value) {
   if (!process.env.HASH_SECRET) {
      throw new Error("HASH_SECRET not set");
   }

   return crypto
      .createHmac("sha256", process.env.HASH_SECRET)
      .update(String(value), "utf8")
      .digest("hex");
}
