import mysql from "mysql2/promise";
import { env } from "./env";

export const db = mysql.createPool({
  host: env.dbHost,
  user: env.dbUser,
  password: env.dbPass,
  database: env.dbName,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});
