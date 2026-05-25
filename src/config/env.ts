import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string) {
  const value = process.env[name] || fallback;
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  dbHost: required("DB_HOST", "localhost"),
  dbUser: required("DB_USER", "root"),
  dbPass: process.env.DB_PASS || "",
  dbName: required("DB_NAME"),
  jwtSecret: required("JWT_SECRET"),
  rootDomain: process.env.ROOT_DOMAIN || "localhost",
  corsOrigins: (process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
};
