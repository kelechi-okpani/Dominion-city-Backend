import jwt from 'jsonwebtoken';
import { UserRole } from '../modules/branch/model/branch-model.js';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  // In production, the server should fail to start if the secret is missing
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
}

export interface TokenPayload {
  id: string;
  role: UserRole;
  branchId: string;
  branchName: string;
}

/**
 * Generates a secure JWT for a branch or admin user.
 */
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET as string, {
    expiresIn: '7d', // Standard session length for church admin portals
  });
};

/**
 * Validates the JWT and returns the decoded payload.
 */
export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET as string) as TokenPayload;
  } catch (error) {
    // Distinguish between expired and malformed tokens if needed later
    return null;
  }
};