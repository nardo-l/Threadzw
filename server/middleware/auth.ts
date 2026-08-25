import { Request, Response, NextFunction } from 'express';
import { createClient } from '@supabase/supabase-js';

let serverClient: any | null = null;

function getServerSupabase() {
  if (!serverClient) {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    const supabaseKey = serviceRoleKey || process.env.VITE_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_SERVER_CONFIGURATION_MISSING');
    }

    console.log(`SERVICE ROLE KEY LOADED: ${Boolean(serviceRoleKey)}`);
    serverClient = createClient(supabaseUrl, supabaseKey);
  }
  return serverClient;
}

// Keep the existing import contract while resolving credentials only when a request uses the client.
export const serverSupabase: any = new Proxy({}, {
  get(_target, property) {
    return getServerSupabase()[property];
  }
});

export function getUserSupabaseClient(token?: string) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  const supabaseKey = serviceRoleKey || process.env.VITE_SUPABASE_ANON_KEY || '';

  if (token) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('SUPABASE_SERVER_CONFIGURATION_MISSING');
    }
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
