import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
export const serverSupabase = createClient(supabaseUrl, supabaseKey);

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
