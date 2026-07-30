import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const hasServiceRole = !!serviceRoleKey;
console.log(`SERVICE ROLE KEY LOADED: ${hasServiceRole}`);

const supabaseKey = serviceRoleKey || process.env.VITE_SUPABASE_ANON_KEY || 'placeholder';
export const serverSupabase = createClient(supabaseUrl, supabaseKey);

export function getUserSupabaseClient(token?: string) {
  if (token) {
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });
  }
  return serverSupabase;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization header is missing or invalid' });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await serverSupabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized: Invalid authentication token' });
    }

    req.user = user;
    next();
  } catch (err: any) {
    console.error('Authentication middleware error:', err);
    return res.status(401).json({ error: 'Unauthorized: ' + (err.message || 'Verification failed') });
  }
}
