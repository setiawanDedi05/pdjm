import jwt from 'jsonwebtoken';
import { User } from '@/models';
import type { AuthPayload } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export async function loginUser(username: string, password: string) {
  const user = await User.findOne({ where: { username } });
  if (!user) {
    throw new Error('Username atau password salah');
  }

  const isValid = await user.comparePassword(password);
  if (!isValid) {
    throw new Error('Username atau password salah');
  }

  const payload: AuthPayload = {
    id: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  return { token, user: user.toSafeObject() };
}

export function verifyToken(token: string): AuthPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    throw new Error('Token tidak valid atau sudah kadaluarsa');
  }
}

export async function getUserFromToken(token: string) {
  const payload = verifyToken(token);
  const user = await User.findByPk(payload.id);
  if (!user) throw new Error('User tidak ditemukan');
  return user.toSafeObject();
}

