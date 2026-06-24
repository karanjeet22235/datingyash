import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../prisma';

export interface AuthedRequest extends Request {
  userId?: string;
  user?: any;
}

export async function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing access token' });
    }
    const token = header.slice('Bearer '.length);
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(401).json({ error: 'Invalid token' });
    if (user.isBanned) return res.status(403).json({ error: 'Account banned', reason: user.banReason });
    req.userId = user.id;
    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['x-admin-secret'];
  if (!key || key !== process.env.ADMIN_SECRET_KEY) {
    return res.status(403).json({ error: 'Forbidden: invalid admin secret' });
  }
  next();
}
