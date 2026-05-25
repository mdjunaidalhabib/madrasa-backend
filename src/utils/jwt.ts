import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayloadData = Record<string, unknown>;

export const generateToken = (
  payload: JwtPayloadData,
  expiresIn: SignOptions["expiresIn"] = "7d",
) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn });
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, env.jwtSecret);
};
