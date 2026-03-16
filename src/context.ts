// src/context.ts
import { Request } from 'express';
import { verifyToken, TokenPayload } from './utils/auth.js';

export interface IResolverContext {
  user: TokenPayload | null;
}

export const createContext = ({ req }: { req: Request }): IResolverContext => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { user: null };
  }

  const token = authHeader.split(' ')[1];
  const user = verifyToken(token);
  return { user };
};