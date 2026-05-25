import "express";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; madrasa_id: number; role_id: number; role?: string; role_name?: string };
      tenant?: { madrasa_id: number; slug: string };
    }
  }
}
export {};
