import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { findUser } from './repo';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export async function authenticate(login: string, password: string) {
  const user = await findUser(login);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) return null;
  return { token: jwt.sign({ sub: user.id, login: user.login }, SECRET, { expiresIn: '8h' }), login: user.login as string };
}

// Middleware: пропускает только запросы с валидным заголовком Authorization: Bearer <JWT>
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const h = req.headers.authorization ?? '';
  try { jwt.verify(h.startsWith('Bearer ') ? h.slice(7) : '', SECRET); next(); }
  catch { res.status(401).json({ error: 'Unauthorized' }); }
}
