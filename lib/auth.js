import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import { getDatabase } from './mongodb';

const SECRET_KEY = process.env.JWT_SECRET || 'micro-learning-secret-key-2024-very-secure';

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function createToken(data, expiresIn = '7d') {
  return jwt.sign(data, SECRET_KEY, { expiresIn });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    return null;
  }
}

export async function getUserFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload || !payload.sub) {
    return null;
  }

  const db = await getDatabase();
  const user = await db.collection('users').findOne({ email: payload.sub });
  if (!user) return null;

  return {
    ...user,
    _id: user._id.toString(),
  };
}

