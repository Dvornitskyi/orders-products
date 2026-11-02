import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import type { Repo } from './types';

const SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me';

export function createAuth(repo: Repo) {
  // Проверка логина и пароля (bcrypt) → подписанный токен (JWT, HS256, 8 часов)
  async function authenticate(login: string, password: string) {
    const user = await repo.findUser(login);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
    return { token: jwt.sign({ sub: user.id, login: user.login }, SECRET, { expiresIn: '8h' }), login: user.login };
  }

  // Проверяет заголовок «Authorization: Bearer <JWT>». Используется и в REST, и в GraphQL.
  function verifyHeader(header: string | null | undefined): boolean {
    const h = header ?? '';
    try { jwt.verify(h.startsWith('Bearer ') ? h.slice(7) : '', SECRET); return true; } catch { return false; }
  }

  // Middleware для REST: пропускает только запросы с валидным токеном
  function requireAuth(req: Request, res: Response, next: NextFunction) {
    if (verifyHeader(req.headers.authorization)) next();
    else res.status(401).json({ error: 'Unauthorized' });
  }

  return { authenticate, verifyHeader, requireAuth };
}
export type Auth = ReturnType<typeof createAuth>;
