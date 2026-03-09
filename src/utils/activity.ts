import { db } from "../config/db";

export const logActivity = async (args: {
  madrasa_id: number;
  user_id: number;
  action: string;
  entity: string;
  entity_id?: number | null;
  details?: string | null;
}) => {
  const { madrasa_id, user_id, action, entity, entity_id = null, details = null } = args;
  await db.query(
    `INSERT INTO activity_logs (madrasa_id, user_id, action, entity, entity_id, details)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [madrasa_id, user_id, action, entity, entity_id, details]
  );
};
