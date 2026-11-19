import crypto from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';
import type { PublicUser, UserRole } from '../src/types';

export interface StoredUser extends PublicUser {
  passwordHash: string;
}

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const AUTH_SECRET =
  process.env.SESSION_SECRET || 'freshkart-agro-connect-western-odisha-mvp-secret-v1';

/**
 * Hash a password using Node's scrypt with a unique random 16-byte salt.
 * Stored as "<saltHex>:<derivedKeyHex>". Never stores plain text passwords.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derivedKey}`;
}

/**
 * Verify a plain-text candidate password against a stored scrypt hash
 * using constant-time comparison to prevent timing attacks.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

export interface TokenPayload {
  userId: string;
  role: UserRole;
  exp: number;
}

export function signToken(userId: string, role: UserRole): string {
  const payload: TokenPayload = {
    userId,
    role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(encodedPayload)
    .digest('base64url');
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [encodedPayload, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', AUTH_SECRET)
      .update(encodedPayload)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8')
    ) as TokenPayload;
    if (!payload.userId || !payload.role || typeof payload.exp !== 'number') {
      return null;
    }
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function toPublicUser(user: StoredUser): PublicUser {
  const { passwordHash: _passwordHash, ...publicFields } = user;
  return publicFields;
}

export interface AuthedRequest extends Request {
  authUser?: PublicUser;
}

export function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice(7).trim();
}

export function createAuthMiddleware(getUserById: (id: string) => StoredUser | undefined) {
  function attachOptionalUser(req: AuthedRequest, _res: Response, next: NextFunction) {
    const token = extractBearerToken(req);
    if (token) {
      const payload = verifyToken(token);
      if (payload) {
        const user = getUserById(payload.userId);
        if (user && user.accountStatus === 'active') {
          req.authUser = toPublicUser(user);
        }
      }
    }
    next();
  }

  function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
    const token = extractBearerToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Please log in.' });
    }
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
    }
    const user = getUserById(payload.userId);
    if (!user) {
      return res.status(401).json({ error: 'Account not found.' });
    }
    if (user.accountStatus !== 'active') {
      return res.status(403).json({ error: 'Your account is currently suspended. Contact support.' });
    }
    req.authUser = toPublicUser(user);
    next();
  }

  function requireRole(...allowedRoles: UserRole[]) {
    return (req: AuthedRequest, res: Response, next: NextFunction) => {
      if (!req.authUser) {
        return res.status(401).json({ error: 'Authentication required.' });
      }
      if (!allowedRoles.includes(req.authUser.role)) {
        return res.status(403).json({
          error: `Access denied. This action requires ${allowedRoles.join(' or ')} privileges.`,
        });
      }
      next();
    };
  }

  return { attachOptionalUser, requireAuth, requireRole };
}
