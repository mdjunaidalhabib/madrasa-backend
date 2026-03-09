import { Request, Response } from "express";
import { db } from "../../config/db";

export const getDivisions = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;

  const [rows]: any = await db.query(
    `SELECT d.id, d.name_bn
     FROM divisions d
     JOIN madrasa_divisions md ON md.division_id=d.id
     WHERE md.madrasa_id=? AND md.is_enabled=1
     ORDER BY d.id ASC`,
    [madrasa_id]
  );

  res.json(rows);
};

export const getClassesByDivision = async (req: Request, res: Response) => {
  const madrasa_id = req.tenant!.madrasa_id;
  const division_id = Number(req.params.division_id);

  const [rows]: any = await db.query(
    `SELECT id, name_bn
     FROM classes
     WHERE madrasa_id=? AND division_id=? AND is_active=1
     ORDER BY sort_order ASC, id ASC`,
    [madrasa_id, division_id]
  );

  res.json(rows);
};
