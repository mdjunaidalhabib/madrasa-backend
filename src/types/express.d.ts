import "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; madrasa_id: number; role_id: number };
      tenant?: { madrasa_id: number; slug: string };
    }
  }
}
export {};
